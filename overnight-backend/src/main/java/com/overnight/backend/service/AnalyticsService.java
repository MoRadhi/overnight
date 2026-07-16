package com.overnight.backend.service;

import com.overnight.backend.dto.*;
import com.overnight.backend.entity.*;
import com.overnight.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private static final DateTimeFormatter MONTH_FMT = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final int OCCUPANCY_HISTORY_DAYS = 60;

    private final ReservationRepository reservationRepository;
    private final GuestRepository guestRepository;
    private final RoomRepository roomRepository;
    private final HotelRepository hotelRepository;
    private final ReviewRepository reviewRepository;
    private final AnalyticsClient analyticsClient;

    public AnalyticsService(ReservationRepository reservationRepository,
                            GuestRepository guestRepository,
                            RoomRepository roomRepository,
                            HotelRepository hotelRepository,
                            ReviewRepository reviewRepository,
                            AnalyticsClient analyticsClient) {
        this.reservationRepository = reservationRepository;
        this.guestRepository = guestRepository;
        this.roomRepository = roomRepository;
        this.hotelRepository = hotelRepository;
        this.reviewRepository = reviewRepository;
        this.analyticsClient = analyticsClient;
    }

    // ── RFM Segments ─────────────────────────────────────────────────────────

    public List<GuestSegmentResponse> getSegments(Optional<Long> hotelId) {
        List<Reservation> completed = hotelId
                .map(id -> reservationRepository.findByHotelIdAndStatus(id, ReservationStatus.CHECKED_OUT))
                .orElseGet(() -> reservationRepository.findByStatus(ReservationStatus.CHECKED_OUT));

        if (completed.isEmpty()) return List.of();

        List<RfmRecord> records = completed.stream()
                .map(r -> new RfmRecord(
                        r.getGuest().getId(),
                        r.getCheckOutDate(),
                        r.getTotalPrice().doubleValue()))
                .toList();

        List<GuestSegmentData> segments = analyticsClient.rfm(records);

        // Build a lookup of guestId → Guest for enrichment
        Map<Long, Guest> guestMap = guestRepository.findAll()
                .stream()
                .collect(Collectors.toMap(Guest::getId, g -> g));

        return segments.stream()
                .map(s -> {
                    Guest g = guestMap.get(s.guestId());
                    String firstName = g != null ? g.getFirstName() : "Unknown";
                    String lastName  = g != null ? g.getLastName()  : "";
                    String email     = g != null ? g.getEmail()     : "";
                    return new GuestSegmentResponse(
                            s.guestId(), firstName, lastName, email,
                            s.segment(), s.rScore(), s.fScore(), s.mScore(),
                            s.recencyDays(), s.frequency(),
                            BigDecimal.valueOf(s.monetary()).setScale(2, RoundingMode.HALF_UP));
                })
                .toList();
    }

    // ── Analytics Summary ─────────────────────────────────────────────────────

    public AnalyticsSummaryResponse getSummary(Optional<Long> hotelId) {
        List<Reservation> completed = hotelId
                .map(id -> reservationRepository.findByHotelIdAndStatus(id, ReservationStatus.CHECKED_OUT))
                .orElseGet(() -> reservationRepository.findByStatus(ReservationStatus.CHECKED_OUT));

        // Revenue by month (last 12 months only)
        LocalDate cutoff = LocalDate.now().minusMonths(12);
        List<RevenueDataPoint> revenueByMonth = completed.stream()
                .filter(r -> r.getCheckOutDate().isAfter(cutoff))
                .collect(Collectors.groupingBy(
                        r -> r.getCheckOutDate().format(MONTH_FMT),
                        Collectors.reducing(BigDecimal.ZERO,
                                Reservation::getTotalPrice, BigDecimal::add)))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new RevenueDataPoint(e.getKey(), e.getValue()))
                .toList();

        BigDecimal totalRevenue = completed.stream()
                .map(Reservation::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long uniqueGuests = completed.stream()
                .map(r -> r.getGuest().getId())
                .distinct().count();

        // Segment distribution — reuse RFM result if we have completions
        Map<String, Long> segmentDistribution = Map.of();
        if (!completed.isEmpty()) {
            List<RfmRecord> records = completed.stream()
                    .map(r -> new RfmRecord(
                            r.getGuest().getId(),
                            r.getCheckOutDate(),
                            r.getTotalPrice().doubleValue()))
                    .toList();
            segmentDistribution = analyticsClient.rfm(records).stream()
                    .collect(Collectors.groupingBy(GuestSegmentData::segment, Collectors.counting()));
        }

        return new AnalyticsSummaryResponse(
                revenueByMonth,
                segmentDistribution,
                totalRevenue,
                completed.size(),
                uniqueGuests);
    }

    // ── Occupancy Forecast ────────────────────────────────────────────────────

    public List<ForecastPoint> getForecast(Long hotelId) {
        long totalRooms = roomRepository.countRoomsByHotelId(hotelId);
        if (totalRooms == 0) return List.of();

        // Build occupancy history for the last OCCUPANCY_HISTORY_DAYS days
        List<Reservation> relevant = reservationRepository.findByHotelId(hotelId)
                .stream()
                .filter(r -> r.getStatus() == ReservationStatus.CHECKED_OUT
                          || r.getStatus() == ReservationStatus.CHECKED_IN)
                .toList();

        LocalDate today = LocalDate.now();
        List<OccupancyPoint> history = new ArrayList<>();

        for (int i = OCCUPANCY_HISTORY_DAYS; i >= 1; i--) {
            LocalDate day = today.minusDays(i);
            long occupied = relevant.stream()
                    .filter(r -> !r.getCheckInDate().isAfter(day)
                              && r.getCheckOutDate().isAfter(day))
                    .count();
            history.add(new OccupancyPoint(day, (int) occupied, (int) totalRooms));
        }

        return analyticsClient.forecast(hotelId, history);
    }

    // ── Sentiment Trend ───────────────────────────────────────────────────────

    public List<SentimentTrendPoint> getSentimentTrend(Optional<Long> hotelId) {
        List<Review> reviews = hotelId
                .map(reviewRepository::findByHotelId)
                .orElseGet(reviewRepository::findAll);

        if (reviews.isEmpty()) return List.of();

        // Group by month and aggregate sentiment scores
        return reviews.stream()
                .filter(r -> r.getSentimentScore() != null) // only scored reviews
                .collect(Collectors.groupingBy(
                        r -> r.getCreatedAt().atZone(java.time.ZoneOffset.UTC)
                                .toLocalDate().format(MONTH_FMT)))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    List<Review> monthReviews = e.getValue();
                    double avg = monthReviews.stream()
                            .mapToDouble(Review::getSentimentScore).average().orElse(0);
                    long pos = monthReviews.stream()
                            .filter(r -> "POSITIVE".equals(String.valueOf(r.getSentimentLabel()))).count();
                    long neg = monthReviews.stream()
                            .filter(r -> "NEGATIVE".equals(String.valueOf(r.getSentimentLabel()))).count();
                    long neu = monthReviews.size() - pos - neg;
                    return new SentimentTrendPoint(e.getKey(),
                            BigDecimal.valueOf(avg).setScale(3, RoundingMode.HALF_UP).doubleValue(),
                            pos, neu, neg);
                })
                .toList();
    }
}