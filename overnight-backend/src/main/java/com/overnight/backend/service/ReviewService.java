package com.overnight.backend.service;

import com.overnight.backend.dto.ReviewRequest;
import com.overnight.backend.dto.ReviewResponse;
import com.overnight.backend.dto.SentimentResultData;
import com.overnight.backend.entity.*;
import com.overnight.backend.exception.BadRequestException;
import com.overnight.backend.exception.ConflictException;
import com.overnight.backend.exception.ResourceNotFoundException;
import com.overnight.backend.repository.ReservationRepository;
import com.overnight.backend.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReservationRepository reservationRepository;
    private final AnalyticsClient analyticsClient;

    public ReviewService(ReviewRepository reviewRepository,
                         ReservationRepository reservationRepository,
                         AnalyticsClient analyticsClient) {
        this.reviewRepository = reviewRepository;
        this.reservationRepository = reservationRepository;
        this.analyticsClient = analyticsClient;
    }

    public List<ReviewResponse> findByHotel(Long hotelId) {
        return reviewRepository.findByHotelId(hotelId)
                .stream()
                .map(ReviewResponse::from)
                .toList();
    }

    /**
     * Creates a review then immediately scores it for sentiment via the
     * analytics service. If the analytics service is down, the review is
     * saved without a sentiment score — it will remain null until the
     * service recovers (a future batch-scoring pass could backfill it).
     */
    @Transactional
    public ReviewResponse create(Long reservationId, ReviewRequest request) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        if (reservation.getStatus() != ReservationStatus.CHECKED_OUT) {
            throw new BadRequestException(
                    "Reviews can only be submitted for completed stays (CHECKED_OUT)");
        }

        if (reviewRepository.existsByReservationId(reservationId)) {
            throw new ConflictException(
                    "A review for reservation " + reservationId + " already exists");
        }

        Review review = new Review();
        review.setReservation(reservation);
        review.setRating(request.rating());
        review.setComment(request.comment());
        Review saved = reviewRepository.save(review);

        // Score sentiment — fire-and-update, swallow failures gracefully
        try {
            var reviewRecord = new AnalyticsClient.SentimentReviewRecord(
                    saved.getId(), saved.getComment());
            List<SentimentResultData> results = analyticsClient.sentiment(List.of(reviewRecord));
            if (!results.isEmpty()) {
                SentimentResultData result = results.get(0);
                saved.setSentimentScore(result.sentimentScore());
                saved.setSentimentLabel(SentimentLabel.valueOf(result.sentimentLabel()));
                saved = reviewRepository.save(saved);
            }
        } catch (Exception ignored) {
            // Analytics service down — review is still saved, sentiment scored later
        }

        return ReviewResponse.from(saved);
    }
}