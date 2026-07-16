package com.overnight.backend.config;

import com.overnight.backend.entity.*;
import com.overnight.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * Seeds the database with realistic demo data across eight hotels in eight countries.
 * Runs on every startup when the DB is empty — safe to leave in for local dev and demos.
 *
 * Excluded from the "test" profile so the H2 test context starts clean.
 * To wipe and re-seed locally: drop the DB and run docker compose up db -d again.
 *
 * Baseline seed includes a curated core dataset; additional bulk data is generated
 * to simulate a larger production-like portfolio for demos and analytics.
 * Guests span five RFM segments (Champions, Loyal, Potential Loyalist, At Risk, Lost)
 * plus New Guests, In-House guests, and one Cancelled reservation for exclusion testing.
 * Reviews are pre-scored with VADER compound scores so analytics charts render immediately.
 */
@Configuration
@Profile("!test")
public class DataSeeder {

    // ── Unsplash base ─────────────────────────────────────────────────────────
    private static final String UNS = "https://images.unsplash.com/";
    private static final String UNS_PARAMS = "?auto=format&fit=crop&w=1200&q=80";

    private static String unsplash(String photoId) {
        return UNS + photoId + UNS_PARAMS;
    }

    @Bean
    CommandLineRunner seedDatabase(
            HotelRepository hotelRepo,
            RoomTypeRepository roomTypeRepo,
            RoomRepository roomRepo,
            GuestRepository guestRepo,
            ReservationRepository reservationRepo,
            ReviewRepository reviewRepo,
            AdminRepository adminRepo,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (hotelRepo.count() > 0) return;

            // ── Admin ────────────────────────────────────────────────────────
            Admin admin = new Admin();
            admin.setUsername("admin");
            admin.setPasswordHash(passwordEncoder.encode("overnight2024"));
            adminRepo.save(admin);

            // ── Hotels ───────────────────────────────────────────────────────
            Hotel noir = hotel(
                    "Hotel Noir", "12 Rue de la Paix", "Paris", "France",
                    "A moody, intimate boutique hotel in the heart of Paris, steps from the Opéra.",
                    unsplash("photo-1551882547-ff40c63fe5fa"));

            Hotel seaCliff = hotel(
                    "Sea Cliff Retreat", "88 Ocean Drive", "Lisbon", "Portugal",
                    "Perched above the Atlantic, minimalist rooms with floor-to-ceiling sea views.",
                    unsplash("photo-1566073771259-6a8506099945"));

            Hotel verdant = hotel(
                    "The Verdant", "3 Garden Lane", "Kyoto", "Japan",
                    "A serene garden hotel blending traditional ryokan aesthetics with modern comfort.",
                    unsplash("photo-1540541338537-41369657c890"));

            Hotel casa = hotel(
                    "Casa Dorada", "7 Passeig de Gràcia", "Barcelona", "Spain",
                    "A golden Art Nouveau townhouse hotel in the heart of the Eixample district.",
                    unsplash("photo-1513519245088-0e12902e35ca"));

            Hotel fjord = hotel(
                    "Fjord House", "22 Bryggen Wharf", "Bergen", "Norway",
                    "Dramatic Norwegian fjord views from a converted timber warehouse on the historic wharf.",
                    unsplash("photo-1605152276897-4f618f831968"));

            Hotel lumi = hotel(
                    "Villa Lumina", "5 Via della Croce", "Rome", "Italy",
                    "A refined Roman villa steps from the Spanish Steps, blending antiquity with luxury.",
                    unsplash("photo-1552832230-c0197dd311b5"));

            Hotel riad = hotel(
                    "Riad Azul", "14 Derb Sidi Ahmed Ou Moussa", "Marrakech", "Morocco",
                    "A hidden medina riad with a cobalt-tiled courtyard pool and rooftop terrace views of the Atlas.",
                    unsplash("photo-1509316785289-025f5b846b35"));

            Hotel banyan = hotel(
                    "The Banyan", "1 Marine Lines", "Mumbai", "India",
                    "A landmark colonial-era heritage hotel on the seafront, reimagined for modern luxury.",
                    unsplash("photo-1587474260584-136574528ed5"));

            hotelRepo.saveAll(List.of(noir, seaCliff, verdant, casa, fjord, lumi, riad, banyan));

            // ── Room Types ───────────────────────────────────────────────────

            // Hotel Noir
            RoomType noirClassic  = roomType(noir, "Classic Room",
                    "Queen bed, city view, walk-in rain shower",
                    new BigDecimal("180.00"), 2,
                    unsplash("photo-1631049307264-da0ec9d70304"));
            RoomType noirDeluxe   = roomType(noir, "Deluxe Room",
                    "King bed, Eiffel view, soaking tub",
                    new BigDecimal("260.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType noirSuite    = roomType(noir, "Penthouse Suite",
                    "Split-level suite, rooftop terrace, butler service",
                    new BigDecimal("580.00"), 4,
                    unsplash("photo-1582719478250-c89cae4dc85b"));
            roomTypeRepo.saveAll(List.of(noirClassic, noirDeluxe, noirSuite));

            // Sea Cliff Retreat
            RoomType seaStudio    = roomType(seaCliff, "Sea Studio",
                    "Open-plan king studio, private ocean balcony",
                    new BigDecimal("220.00"), 2,
                    unsplash("photo-1571896349842-33c89424de2d"));
            RoomType seaDeluxe    = roomType(seaCliff, "Cliff Deluxe",
                    "King bed, panoramic sea view, outdoor rainfall shower",
                    new BigDecimal("310.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType seaPenthouse = roomType(seaCliff, "Atlantic Suite",
                    "Two-bedroom suite, private plunge pool, sunset terrace",
                    new BigDecimal("720.00"), 4,
                    unsplash("photo-1582719478250-c89cae4dc85b"));
            roomTypeRepo.saveAll(List.of(seaStudio, seaDeluxe, seaPenthouse));

            // The Verdant
            RoomType verdantZen   = roomType(verdant, "Zen Room",
                    "Tatami floor, garden view, shared onsen access",
                    new BigDecimal("150.00"), 2,
                    unsplash("photo-1602002418082-a4443978a5d1"));
            RoomType verdantKaede = roomType(verdant, "Kaede Suite",
                    "Private garden, indoor hinoki cypress bath",
                    new BigDecimal("340.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType verdantVilla = roomType(verdant, "Garden Villa",
                    "Private villa with plunge pool, chef service, and bamboo garden",
                    new BigDecimal("860.00"), 6,
                    unsplash("photo-1517840901100-8179e982acb7"));
            roomTypeRepo.saveAll(List.of(verdantZen, verdantKaede, verdantVilla));

            // Casa Dorada
            RoomType casaTerraza  = roomType(casa, "Terraza Room",
                    "Queen bed, Juliet balcony with Eixample rooftop views",
                    new BigDecimal("195.00"), 2,
                    unsplash("photo-1631049307264-da0ec9d70304"));
            RoomType casaDeluxe   = roomType(casa, "Suite Catalana",
                    "King bed, Art Nouveau details, marble en-suite",
                    new BigDecimal("295.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType casaPenthouse = roomType(casa, "Penthouse Dorada",
                    "Duplex penthouse with private rooftop pool and panoramic city views",
                    new BigDecimal("650.00"), 4,
                    unsplash("photo-1543968996-ee822b8176ba"));
            roomTypeRepo.saveAll(List.of(casaTerraza, casaDeluxe, casaPenthouse));

            // Fjord House
            RoomType fjordView    = roomType(fjord, "Fjord View Room",
                    "Queen bed, floor-to-ceiling fjord panorama, heated floors",
                    new BigDecimal("240.00"), 2,
                    unsplash("photo-1558618666-fcd25c85cd64"));
            RoomType fjordDeluxe  = roomType(fjord, "Nordic Deluxe",
                    "King bed, private balcony over the wharf, wood-burning stove",
                    new BigDecimal("360.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType fjordSuite   = roomType(fjord, "Aurora Suite",
                    "Glass-ceiling suite for northern lights viewing, private sauna",
                    new BigDecimal("780.00"), 4,
                    unsplash("photo-1582719478250-c89cae4dc85b"));
            roomTypeRepo.saveAll(List.of(fjordView, fjordDeluxe, fjordSuite));

            // Villa Lumina
            RoomType lumiGarden   = roomType(lumi, "Garden Room",
                    "Queen bed, courtyard garden view, antique furnishings",
                    new BigDecimal("210.00"), 2,
                    unsplash("photo-1602002418082-a4443978a5d1"));
            RoomType lumiDeluxe   = roomType(lumi, "Lumina Deluxe",
                    "King bed, frescoed ceiling, walk-in marble shower",
                    new BigDecimal("320.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType lumiRooftop  = roomType(lumi, "Rooftop Terrace Suite",
                    "Private rooftop with Roman skyline views, outdoor bath, concierge",
                    new BigDecimal("740.00"), 4,
                    unsplash("photo-1543968996-ee822b8176ba"));
            roomTypeRepo.saveAll(List.of(lumiGarden, lumiDeluxe, lumiRooftop));

            // Riad Azul
            RoomType riadMediana  = roomType(riad, "Medina Room",
                    "Zellige tiled room, mashrabiya windows, lantern lighting",
                    new BigDecimal("130.00"), 2,
                    unsplash("photo-1631049307264-da0ec9d70304"));
            RoomType riadAtlas    = roomType(riad, "Atlas Suite",
                    "Arched suite with hand-painted cedar ceilings and private courtyard access",
                    new BigDecimal("250.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType riadRoyal    = roomType(riad, "Royal Riad",
                    "Two-bedroom suite with private plunge pool and Atlas Mountain panorama",
                    new BigDecimal("520.00"), 6,
                    unsplash("photo-1517840901100-8179e982acb7"));
            roomTypeRepo.saveAll(List.of(riadMediana, riadAtlas, riadRoyal));

            // The Banyan
            RoomType banyonBay    = roomType(banyan, "Bay View Room",
                    "Queen bed, colonial-era detailing, sweeping Arabian Sea vistas",
                    new BigDecimal("170.00"), 2,
                    unsplash("photo-1631049307264-da0ec9d70304"));
            RoomType banyonGrand  = roomType(banyan, "Grand Deluxe",
                    "King bed, heritage teak floors, marble en-suite, butler on call",
                    new BigDecimal("280.00"), 2,
                    unsplash("photo-1618773928121-c32242e63f39"));
            RoomType banyonImperial = roomType(banyan, "Imperial Suite",
                    "Two-room suite with private dining terrace and panoramic sea views",
                    new BigDecimal("620.00"), 4,
                    unsplash("photo-1445019980597-93fa8acb246c"));
            roomTypeRepo.saveAll(List.of(banyonBay, banyonGrand, banyonImperial));

            // ── Rooms ────────────────────────────────────────────────────────

            // Hotel Noir — 8 rooms
            List<Room> noirRooms = List.of(
                    room(noirClassic, "101", 1), // [0]
                    room(noirClassic, "102", 1), // [1]
                    room(noirClassic, "103", 1), // [2]
                    room(noirDeluxe,  "201", 2), // [3]
                    room(noirDeluxe,  "202", 2), // [4]
                    room(noirDeluxe,  "203", 2), // [5]
                    room(noirSuite,   "501", 5), // [6]
                    room(noirSuite,   "502", 5)  // [7]
            );
            roomRepo.saveAll(noirRooms);

            // Sea Cliff Retreat — 9 rooms (one under maintenance)
            Room seaMaintenance = room(seaStudio, "104", 1);
            seaMaintenance.setStatus(RoomStatus.MAINTENANCE);
            List<Room> seaRooms = List.of(
                    room(seaStudio,    "101", 1), // [0]
                    room(seaStudio,    "102", 1), // [1]
                    room(seaStudio,    "103", 1), // [2]
                    seaMaintenance,               // [3] MAINTENANCE
                    room(seaDeluxe,    "201", 2), // [4]
                    room(seaDeluxe,    "202", 2), // [5]
                    room(seaDeluxe,    "203", 2), // [6]
                    room(seaPenthouse, "601", 6), // [7]
                    room(seaPenthouse, "602", 6)  // [8]
            );
            roomRepo.saveAll(seaRooms);

            // The Verdant — 8 rooms
            List<Room> verdantRooms = List.of(
                    room(verdantZen,   "G01", 0), // [0]
                    room(verdantZen,   "G02", 0), // [1]
                    room(verdantZen,   "G03", 0), // [2]
                    room(verdantZen,   "G04", 0), // [3]
                    room(verdantKaede, "K01", 1), // [4]
                    room(verdantKaede, "K02", 1), // [5]
                    room(verdantVilla, "V01", 0), // [6]
                    room(verdantVilla, "V02", 0)  // [7]
            );
            roomRepo.saveAll(verdantRooms);

            // Casa Dorada — 7 rooms
            List<Room> casaRooms = List.of(
                    room(casaTerraza,   "101",  1),  // [0]
                    room(casaTerraza,   "102",  1),  // [1]
                    room(casaTerraza,   "103",  1),  // [2]
                    room(casaDeluxe,    "201",  2),  // [3]
                    room(casaDeluxe,    "202",  2),  // [4]
                    room(casaPenthouse, "PH1", 10),  // [5]
                    room(casaPenthouse, "PH2", 10)   // [6]
            );
            roomRepo.saveAll(casaRooms);

            // Fjord House — 7 rooms
            List<Room> fjordRooms = List.of(
                    room(fjordView,   "101", 1), // [0]
                    room(fjordView,   "102", 1), // [1]
                    room(fjordView,   "103", 1), // [2]
                    room(fjordDeluxe, "201", 2), // [3]
                    room(fjordDeluxe, "202", 2), // [4]
                    room(fjordSuite,  "A01", 4), // [5]
                    room(fjordSuite,  "A02", 4)  // [6]
            );
            roomRepo.saveAll(fjordRooms);

            // Villa Lumina — 8 rooms
            List<Room> lumiRooms = List.of(
                    room(lumiGarden,  "101", 1), // [0]
                    room(lumiGarden,  "102", 1), // [1]
                    room(lumiGarden,  "103", 1), // [2]
                    room(lumiDeluxe,  "201", 2), // [3]
                    room(lumiDeluxe,  "202", 2), // [4]
                    room(lumiDeluxe,  "203", 2), // [5]
                    room(lumiRooftop, "R01", 8), // [6]
                    room(lumiRooftop, "R02", 8)  // [7]
            );
            roomRepo.saveAll(lumiRooms);

            // Riad Azul — 7 rooms
            List<Room> riadRooms = List.of(
                    room(riadMediana, "G01", 0), // [0]
                    room(riadMediana, "G02", 0), // [1]
                    room(riadMediana, "G03", 0), // [2]
                    room(riadAtlas,   "S01", 1), // [3]
                    room(riadAtlas,   "S02", 1), // [4]
                    room(riadRoyal,   "R01", 2), // [5]
                    room(riadRoyal,   "R02", 2)  // [6]
            );
            roomRepo.saveAll(riadRooms);

            // The Banyan — 8 rooms
            List<Room> banyonRooms = List.of(
                    room(banyonBay,      "101", 1), // [0]
                    room(banyonBay,      "102", 1), // [1]
                    room(banyonBay,      "103", 1), // [2]
                    room(banyonGrand,    "201", 2), // [3]
                    room(banyonGrand,    "202", 2), // [4]
                    room(banyonGrand,    "203", 2), // [5]
                    room(banyonImperial, "I01", 4), // [6]
                    room(banyonImperial, "I02", 4)  // [7]
            );
            roomRepo.saveAll(banyonRooms);

            // ── Guests (20) ──────────────────────────────────────────────────
            Guest alice    = guest("Alice",    "Moreau",        "alice.moreau@example.com",     "+33612345678");
            Guest bjorn    = guest("Björn",    "Lindqvist",     "bjorn.l@example.com",          "+46701234567");
            Guest camille  = guest("Camille",  "Santos",        "camille.santos@example.com",   "+351912345678");
            Guest daisuke  = guest("Daisuke",  "Nakamura",      "daisuke.n@example.com",        "+81901234567");
            Guest elena    = guest("Elena",    "Rossi",         "elena.rossi@example.com",      "+39331234567");
            Guest fiona    = guest("Fiona",    "Chen",          "fiona.chen@example.com",       "+447911123456");
            Guest gabriel  = guest("Gabriel",  "Osei",          "gabriel.osei@example.com",     "+233244123456");
            Guest hana     = guest("Hana",     "Yamamoto",      "hana.yama@example.com",        "+81801234567");
            Guest isabella = guest("Isabella", "Ferreira",      "isabella.f@example.com",       "+5511912345678");
            Guest javier   = guest("Javier",   "Torres",        "javier.torres@example.com",    "+34612345678");
            Guest kenji    = guest("Kenji",    "Watanabe",      "kenji.w@example.com",          "+81701234567");
            Guest layla    = guest("Layla",    "Hassan",        "layla.hassan@example.com",     "+201012345678");
            Guest marcus   = guest("Marcus",   "Andersen",      "marcus.a@example.com",         "+4551234567");
            Guest nina     = guest("Nina",     "Petrov",        "nina.petrov@example.com",      "+79161234567");
            Guest omar     = guest("Omar",     "Khalil",        "omar.khalil@example.com",      "+96279123456");
            Guest priya    = guest("Priya",    "Sharma",        "priya.sharma@example.com",     "+919812345678");
            Guest rui      = guest("Rui",      "Barros",        "rui.barros@example.com",       "+351931234567");
            Guest sofia    = guest("Sofia",    "Greco",         "sofia.greco@example.com",      "+30691234567");
            Guest tariq    = guest("Tariq",    "Al-Rashid",     "tariq.alrashid@example.com",   "+966501234567");
            Guest uma      = guest("Uma",      "Krishnamurthy", "uma.krish@example.com",        "+919901234567");
            guestRepo.saveAll(List.of(
                    alice, bjorn, camille, daisuke, elena, fiona, gabriel, hana,
                    isabella, javier, kenji, layla, marcus, nina, omar, priya,
                    rui, sofia, tariq, uma));

            LocalDate today = LocalDate.now();

            // ── Reservations (52) ────────────────────────────────────────────
            // Segment key:
            //   Alice / Uma / Isabella  → Champions   (frequent, recent, high monetary)
            //   Björn / Javier / Rui    → Loyal       (regular cadence, moderate spend)
            //   Camille / Kenji         → Potential Loyalist (recent, low frequency)
            //   Daisuke / Layla / Sofia → At Risk     (active >1yr ago, no return)
            //   Fiona / Nina            → Lost        (single old stay)
            //   Elena / Marcus / Tariq  → New Guests  (very recent)
            //   Gabriel / Omar          → In-House    (CHECKED_IN)
            //   Hana                    → Cancelled   (excluded from analytics)

            // ── Alice — Champion (6 reservations) ───────────────────────────
            Reservation a1 = res(reservationRepo, alice, noirRooms.get(3), noir,
                    today.minusDays(320), today.minusDays(316),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("1040.00"));

            Reservation a2 = res(reservationRepo, alice, seaRooms.get(4), seaCliff,
                    today.minusDays(210), today.minusDays(207),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("930.00"));

            Reservation a3 = res(reservationRepo, alice, verdantRooms.get(4), verdant,
                    today.minusDays(120), today.minusDays(117),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("1020.00"));

            Reservation a4 = res(reservationRepo, alice, casaRooms.get(3), casa,
                    today.minusDays(60), today.minusDays(57),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("885.00"));

            Reservation a5 = res(reservationRepo, alice, fjordRooms.get(3), fjord,
                    today.minusDays(15), today.minusDays(12),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("1080.00"));

            res(reservationRepo, alice, lumiRooms.get(3), lumi,
                    today.plusDays(30), today.plusDays(34),
                    ReservationStatus.BOOKED, new BigDecimal("1280.00"));

            // ── Björn — Loyal (4 reservations) ──────────────────────────────
            Reservation b1 = res(reservationRepo, bjorn, verdantRooms.get(0), verdant,
                    today.minusDays(400), today.minusDays(397),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("450.00"));

            res(reservationRepo, bjorn, noirRooms.get(0), noir,
                    today.minusDays(280), today.minusDays(277),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("540.00"));

            Reservation b3 = res(reservationRepo, bjorn, noirRooms.get(1), noir,
                    today.minusDays(180), today.minusDays(177),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("540.00"));

            res(reservationRepo, bjorn, noirRooms.get(2), noir,
                    today.minusDays(60), today.minusDays(57),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("540.00"));

            // ── Camille — Potential Loyalist (4 reservations) ───────────────
            Reservation c1 = res(reservationRepo, camille, seaRooms.get(0), seaCliff,
                    today.minusDays(90), today.minusDays(87),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("660.00"));

            res(reservationRepo, camille, seaRooms.get(1), seaCliff,
                    today.plusDays(30), today.plusDays(33),
                    ReservationStatus.BOOKED, new BigDecimal("660.00"));

            res(reservationRepo, camille, riadRooms.get(2), riad,
                    today.minusDays(25), today.minusDays(22),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("390.00"));

            res(reservationRepo, camille, riadRooms.get(3), riad,
                    today.plusDays(60), today.plusDays(64),
                    ReservationStatus.BOOKED, new BigDecimal("1000.00"));

            // ── Daisuke — At Risk (3 reservations, all >1yr ago) ────────────
            res(reservationRepo, daisuke, verdantRooms.get(1), verdant,
                    today.minusDays(520), today.minusDays(517),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("450.00"));

            Reservation d2 = res(reservationRepo, daisuke, verdantRooms.get(5), verdant,
                    today.minusDays(420), today.minusDays(416),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("1360.00"));

            Reservation d3 = res(reservationRepo, daisuke, verdantRooms.get(2), verdant,
                    today.minusDays(380), today.minusDays(378),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("300.00"));

            // ── Elena — New Guest (1 recent stay) ───────────────────────────
            Reservation e1 = res(reservationRepo, elena, noirRooms.get(0), noir,
                    today.minusDays(10), today.minusDays(8),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("360.00"));

            // ── Fiona — Lost (1 very old stay) ──────────────────────────────
            Reservation f1 = res(reservationRepo, fiona, seaRooms.get(6), seaCliff,
                    today.minusDays(700), today.minusDays(697),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("930.00"));

            // ── Gabriel — Currently In-House ─────────────────────────────────
            res(reservationRepo, gabriel, noirRooms.get(4), noir,
                    today.minusDays(2), today.plusDays(2),
                    ReservationStatus.CHECKED_IN, new BigDecimal("1040.00"));

            // ── Hana — Cancelled (must NOT appear in analytics) ──────────────
            res(reservationRepo, hana, verdantRooms.get(1), verdant,
                    today.plusDays(15), today.plusDays(18),
                    ReservationStatus.CANCELLED, new BigDecimal("450.00"));

            // ── Isabella — Champion (4 reservations) ─────────────────────────
            Reservation i1 = res(reservationRepo, isabella, casaRooms.get(0), casa,
                    today.minusDays(300), today.minusDays(297),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("585.00"));

            res(reservationRepo, isabella, lumiRooms.get(0), lumi,
                    today.minusDays(190), today.minusDays(187),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("630.00"));

            res(reservationRepo, isabella, riadRooms.get(1), riad,
                    today.minusDays(80), today.minusDays(77),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("390.00"));

            Reservation i4 = res(reservationRepo, isabella, banyonRooms.get(0), banyan,
                    today.minusDays(20), today.minusDays(17),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("510.00"));

            // ── Javier — Loyal (3 reservations) ──────────────────────────────
            Reservation j1 = res(reservationRepo, javier, casaRooms.get(3), casa,
                    today.minusDays(350), today.minusDays(347),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("885.00"));

            res(reservationRepo, javier, casaRooms.get(1), casa,
                    today.minusDays(200), today.minusDays(197),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("585.00"));

            res(reservationRepo, javier, casaRooms.get(5), casa,
                    today.minusDays(80), today.minusDays(77),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("1950.00"));

            // ── Kenji — Potential Loyalist (3 reservations) ───────────────────
            Reservation k1 = res(reservationRepo, kenji, verdantRooms.get(3), verdant,
                    today.minusDays(90), today.minusDays(87),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("450.00"));

            res(reservationRepo, kenji, fjordRooms.get(0), fjord,
                    today.minusDays(30), today.minusDays(27),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("720.00"));

            res(reservationRepo, kenji, fjordRooms.get(5), fjord,
                    today.plusDays(45), today.plusDays(49),
                    ReservationStatus.BOOKED, new BigDecimal("3120.00"));

            // ── Layla — At Risk (3 reservations, all >1yr ago) ───────────────
            res(reservationRepo, layla, riadRooms.get(0), riad,
                    today.minusDays(580), today.minusDays(577),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("390.00"));

            Reservation l2 = res(reservationRepo, layla, riadRooms.get(4), riad,
                    today.minusDays(480), today.minusDays(477),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("750.00"));

            res(reservationRepo, layla, riadRooms.get(2), riad,
                    today.minusDays(400), today.minusDays(397),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("390.00"));

            // ── Marcus — New Guest (1 recent stay) ───────────────────────────
            Reservation m1 = res(reservationRepo, marcus, fjordRooms.get(1), fjord,
                    today.minusDays(5), today.minusDays(3),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("480.00"));

            // ── Nina — Lost (1 very old stay) ─────────────────────────────────
            res(reservationRepo, nina, lumiRooms.get(1), lumi,
                    today.minusDays(800), today.minusDays(797),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("630.00"));

            // ── Omar — Currently In-House ──────────────────────────────────────
            res(reservationRepo, omar, casaRooms.get(2), casa,
                    today.minusDays(1), today.plusDays(3),
                    ReservationStatus.CHECKED_IN, new BigDecimal("780.00"));

            // ── Priya — Upcoming Booking ───────────────────────────────────────
            res(reservationRepo, priya, banyonRooms.get(6), banyan,
                    today.plusDays(20), today.plusDays(24),
                    ReservationStatus.BOOKED, new BigDecimal("2480.00"));

            // ── Rui — Loyal (4 reservations) ──────────────────────────────────
            res(reservationRepo, rui, seaRooms.get(5), seaCliff,
                    today.minusDays(420), today.minusDays(417),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("1240.00"));

            Reservation r2 = res(reservationRepo, rui, seaRooms.get(0), seaCliff,
                    today.minusDays(250), today.minusDays(247),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("660.00"));

            res(reservationRepo, rui, seaRooms.get(6), seaCliff,
                    today.minusDays(100), today.minusDays(97),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("930.00"));

            res(reservationRepo, rui, seaRooms.get(7), seaCliff,
                    today.plusDays(50), today.plusDays(54),
                    ReservationStatus.BOOKED, new BigDecimal("2880.00"));

            // ── Sofia — At Risk (2 reservations, ~16–18 months ago) ───────────
            Reservation s1 = res(reservationRepo, sofia, lumiRooms.get(3), lumi,
                    today.minusDays(550), today.minusDays(547),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("960.00"));

            res(reservationRepo, sofia, lumiRooms.get(4), lumi,
                    today.minusDays(450), today.minusDays(447),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("960.00"));

            // ── Tariq — New Guest (2 stays) ────────────────────────────────────
            Reservation t1 = res(reservationRepo, tariq, banyonRooms.get(1), banyan,
                    today.minusDays(40), today.minusDays(37),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("510.00"));

            res(reservationRepo, tariq, banyonRooms.get(3), banyan,
                    today.plusDays(15), today.plusDays(19),
                    ReservationStatus.BOOKED, new BigDecimal("1120.00"));

            // ── Uma — Champion (6 reservations, highest lifetime value) ────────
            Reservation u1 = res(reservationRepo, uma, noirRooms.get(6), noir,
                    today.minusDays(600), today.minusDays(596),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("2900.00"));

            res(reservationRepo, uma, verdantRooms.get(6), verdant,
                    today.minusDays(450), today.minusDays(446),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("3440.00"));

            res(reservationRepo, uma, seaRooms.get(8), seaCliff,
                    today.minusDays(290), today.minusDays(286),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("2880.00"));

            res(reservationRepo, uma, lumiRooms.get(6), lumi,
                    today.minusDays(150), today.minusDays(146),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("2960.00"));

            Reservation u5 = res(reservationRepo, uma, noirRooms.get(7), noir,
                    today.minusDays(50), today.minusDays(46),
                    ReservationStatus.CHECKED_OUT, new BigDecimal("2320.00"));

            res(reservationRepo, uma, casaRooms.get(6), casa,
                    today.plusDays(7), today.plusDays(11),
                    ReservationStatus.BOOKED, new BigDecimal("2600.00"));

            // ── Reviews (18 pre-scored) ──────────────────────────────────────
            // Score is VADER compound (-1.0 → +1.0). Label must match SentimentLabel enum.
            // createdAt is backdated to ~1 day after checkout for realistic chart spread.

            review(reviewRepo, a1, 5,
                    "Exceptional stay in Paris. The Deluxe Room had magnificent city views and the staff were incredibly attentive throughout.",
                    0.85, SentimentLabel.POSITIVE, today.minusDays(315));

            review(reviewRepo, a2, 5,
                    "Breathtaking sea views from our room. The outdoor shower was a truly unique experience. We will absolutely return.",
                    0.82, SentimentLabel.POSITIVE, today.minusDays(206));

            review(reviewRepo, a3, 5,
                    "A truly serene experience in Kyoto. The private garden and hinoki bath were sublime. This is what luxury should feel like.",
                    0.90, SentimentLabel.POSITIVE, today.minusDays(116));

            review(reviewRepo, b1, 4,
                    "A peaceful and restorative retreat. The tatami floor room was exactly what I hoped for and the onsen was wonderful.",
                    0.76, SentimentLabel.POSITIVE, today.minusDays(396));

            review(reviewRepo, b3, 3,
                    "Nice stay, comfortable room. Nothing extraordinary but the location is excellent and the bed was very comfortable.",
                    0.12, SentimentLabel.NEUTRAL, today.minusDays(176));

            review(reviewRepo, c1, 4,
                    "Loved the ocean balcony and the minimalist Lisbon design. Great value. Would happily recommend to friends.",
                    0.71, SentimentLabel.POSITIVE, today.minusDays(86));

            review(reviewRepo, d2, 5,
                    "The Kaede Suite was exquisite. Waking up to a private garden made every morning magical. Service far exceeded expectations.",
                    0.88, SentimentLabel.POSITIVE, today.minusDays(415));

            review(reviewRepo, d3, 3,
                    "Simple, clean room. The onsen access was a nice bonus. Overall a satisfactory stay.",
                    0.22, SentimentLabel.NEUTRAL, today.minusDays(377));

            review(reviewRepo, e1, 4,
                    "Lovely first experience at Hotel Noir. Charming Parisian atmosphere and a brilliant location. Staff were very kind.",
                    0.74, SentimentLabel.POSITIVE, today.minusDays(7));

            review(reviewRepo, f1, 2,
                    "Honestly quite disappointing. The room was smaller than photos suggested and the staff were completely unresponsive to our requests.",
                    -0.61, SentimentLabel.NEGATIVE, today.minusDays(696));

            review(reviewRepo, i1, 5,
                    "Casa Dorada was a delight! The Terraza Room had a gorgeous balcony overlooking the Eixample. Barcelona breakfast was superb.",
                    0.80, SentimentLabel.POSITIVE, today.minusDays(296));

            review(reviewRepo, i4, 4,
                    "Great Mumbai location with stunning bay views. The service was warm and the room beautifully appointed.",
                    0.72, SentimentLabel.POSITIVE, today.minusDays(16));

            review(reviewRepo, j1, 5,
                    "A wonderful Barcelona experience. Elegant rooms, professional staff, and amenities that rival any five-star property.",
                    0.79, SentimentLabel.POSITIVE, today.minusDays(346));

            review(reviewRepo, k1, 3,
                    "A satisfactory stay. Room was clean and quiet. Honestly expected more personality given the hotel's reputation.",
                    0.05, SentimentLabel.NEUTRAL, today.minusDays(86));

            review(reviewRepo, l2, 2,
                    "The riad was not up to standard. The air conditioning barely worked and the room had an unpleasant damp smell. Very disappointing.",
                    -0.72, SentimentLabel.NEGATIVE, today.minusDays(476));

            review(reviewRepo, m1, 5,
                    "Spectacular fjord views and the cosiest Nordic interior I have ever stayed in. A perfect solo retreat. Highly recommend.",
                    0.84, SentimentLabel.POSITIVE, today.minusDays(2));

            review(reviewRepo, s1, 2,
                    "The hotel was mediocre at best. Service was slow and inattentive, and the so-called garden view faced a blank wall.",
                    -0.58, SentimentLabel.NEGATIVE, today.minusDays(546));

            review(reviewRepo, u5, 5,
                    "An absolutely spectacular penthouse experience. Butler service was impeccable and the Parisian views were breathtaking. A once-in-a-lifetime stay.",
                    0.92, SentimentLabel.POSITIVE, today.minusDays(45));

            // ── Portfolio expansion: more hotels, guests, and reservation volume ──────
            List<Hotel> expandedHotels = new ArrayList<>();
            expandedHotels.add(hotel("Maison Lumiere", "48 Quai Saint-Vincent", "Lyon", "France",
                    "A riverside design hotel with restored stone arcades and culinary salon experiences.",
                    unsplash("photo-1470246973918-29a93221c455")));
            expandedHotels.add(hotel("Chateau Velours", "2 Rue des Tilleuls", "Bordeaux", "France",
                    "A vineyard château retreat blending cellar tastings with contemporary suites.",
                    unsplash("photo-1468824357306-a439d58ccb1c")));

            expandedHotels.add(hotel("Alfama House", "21 Rua do Salvador", "Lisbon", "Portugal",
                    "A hillside townhouse hotel above Alfama with fado evenings and river-view terraces.",
                    unsplash("photo-1501117716987-c8e1ecb210b8")));
            expandedHotels.add(hotel("Douro Line", "9 Cais da Ribeira", "Porto", "Portugal",
                    "A contemporary Douro-front property tuned for long-weekend city escapes.",
                    unsplash("photo-1489515217757-5fd1be406fef")));

            expandedHotels.add(hotel("Sakura Harbor", "6 Minatomachi", "Yokohama", "Japan",
                    "Harbor-facing suites with understated Japanese craft and panoramic skyline views.",
                    unsplash("photo-1516483638261-f4dbaf036963")));
            expandedHotels.add(hotel("Mori Atelier", "17 Nakanoshima", "Osaka", "Japan",
                    "An urban atelier hotel pairing art-led interiors with precision service.",
                    unsplash("photo-1493558103817-58b2924bce98")));

            expandedHotels.add(hotel("Casa Meridian", "18 Carrer de Mallorca", "Barcelona", "Spain",
                    "Mediterranean contemporary rooms steps from the city’s cultural arteries.",
                    unsplash("photo-1498503182468-3b51cbb6cb24")));
            expandedHotels.add(hotel("Solstice Gran Via", "55 Calle Gran Via", "Madrid", "Spain",
                    "A polished business-and-leisure address with skyline lounge and signature dining.",
                    unsplash("photo-1511739001486-6bfe10ce785f")));

            expandedHotels.add(hotel("Arctic Quay", "4 Havnegata", "Tromso", "Norway",
                    "Expedition-minded lodging with arctic panoramas and warm Nordic interiors.",
                    unsplash("photo-1517825738774-7de9363ef735")));
            expandedHotels.add(hotel("Nordhavn Collective", "11 Bryggekanten", "Oslo", "Norway",
                    "A harbor district hotel with long-stay comfort and high-efficiency meeting spaces.",
                    unsplash("photo-1489493887464-892be6d1daae")));

            expandedHotels.add(hotel("Palazzo Sera", "14 Via del Corso", "Rome", "Italy",
                    "A restored palazzo balancing Roman grandeur with modern guest technology.",
                    unsplash("photo-1522708323590-d24dbb6b0267")));
            expandedHotels.add(hotel("Canaletta House", "32 Cannaregio", "Venice", "Italy",
                    "A quiet canal-side residence focused on intimate, slow-luxury stays.",
                    unsplash("photo-1479064555552-3ef4979f8908")));

            expandedHotels.add(hotel("Kasbah Orion", "28 Rue Bab Doukkala", "Marrakech", "Morocco",
                    "A medina sanctuary with geometric courtyards, hammam rituals, and rooftop stargazing.",
                    unsplash("photo-1516483638261-f4dbaf036963")));
            expandedHotels.add(hotel("Atlas Crescent", "3 Avenue Mohammed V", "Marrakech", "Morocco",
                    "A contemporary Moroccan residence for city explorers and executive travelers.",
                    unsplash("photo-1455587734955-081b22074882")));

            expandedHotels.add(hotel("Harbor Banyan Annex", "22 Colaba Causeway", "Mumbai", "India",
                    "A vibrant coastal extension of The Banyan with lifestyle-forward suites.",
                    unsplash("photo-1467269204594-9661b134dd2b")));
            expandedHotels.add(hotel("Raj Courtyard", "7 Civil Lines", "Jaipur", "India",
                    "A pink-city courtyard hotel designed for destination weddings and family retreats.",
                    unsplash("photo-1512453979798-5ea266f8880c")));

            hotelRepo.saveAll(expandedHotels);

            List<Room> expandedRooms = new ArrayList<>();
            int maintenanceCounter = 0;
            for (Hotel eh : expandedHotels) {
                RoomType urban = roomType(eh, "Urban Standard",
                        "High-efficiency queen rooms tuned for short city stays.",
                        new BigDecimal("160.00"), 2,
                        unsplash("photo-1631049307264-da0ec9d70304"));
                RoomType signature = roomType(eh, "Signature Deluxe",
                        "King room with lounge corner and upgraded bath amenities.",
                        new BigDecimal("250.00"), 2,
                        unsplash("photo-1618773928121-c32242e63f39"));
                RoomType residence = roomType(eh, "Residence Suite",
                        "One-bedroom suite with dining area for extended stays.",
                        new BigDecimal("420.00"), 4,
                        unsplash("photo-1582719478250-c89cae4dc85b"));
                roomTypeRepo.saveAll(List.of(urban, signature, residence));

                List<Room> hotelRooms = new ArrayList<>();
                hotelRooms.add(room(urban, "101", 1));
                hotelRooms.add(room(urban, "102", 1));
                hotelRooms.add(room(signature, "201", 2));
                hotelRooms.add(room(signature, "202", 2));
                hotelRooms.add(room(signature, "203", 2));
                hotelRooms.add(room(residence, "501", 5));
                hotelRooms.add(room(residence, "502", 5));

                // Keep a realistic small maintenance slice in the inventory.
                if ((maintenanceCounter++ % 4) == 0) {
                    hotelRooms.get(1).setStatus(RoomStatus.MAINTENANCE);
                }

                roomRepo.saveAll(hotelRooms);
                expandedRooms.addAll(hotelRooms);
            }

            List<Guest> generatedGuests = new ArrayList<>();
            String[] firstNames = {
                    "Adrian", "Bianca", "Carlos", "Dina", "Emil", "Farah", "Gianni", "Helena", "Iris", "Jonas",
                    "Karim", "Lena", "Milan", "Nora", "Orion", "Petra", "Quinn", "Rafael", "Selma", "Tobias",
                    "Vera", "Waleed", "Xenia", "Yara", "Zane", "Aiko", "Bruno", "Celine", "Diego", "Esme"
            };
            String[] lastNames = {
                    "Armand", "Borges", "Costa", "Duarte", "Estevez", "Farouk", "Gallo", "Haddad", "Ibrahim", "Jensen",
                    "Khan", "Larsen", "Mori", "Navarro", "Okafor", "Petrovic", "Quintero", "Rossi", "Silva", "Tanaka",
                    "Usmani", "Valdez", "Wagner", "Xu", "Yilmaz", "Zamora", "Ahmed", "Bianchi", "Carlsen", "Dubois"
            };

            for (int i = 0; i < 140; i++) {
                String first = firstNames[i % firstNames.length];
                String last = lastNames[(i * 3) % lastNames.length];
                Guest g = guest(
                        first,
                        last,
                        String.format("guest%03d@overnight-demo.com", i + 1),
                        String.format("+1-555-%04d", 2000 + i));
                generatedGuests.add(g);
            }
            guestRepo.saveAll(generatedGuests);

            List<Room> allRoomsForGeneration = roomRepo.findAll();
            List<Reservation> generatedReservations = new ArrayList<>();

            for (int i = 0; i < generatedGuests.size(); i++) {
                Guest g = generatedGuests.get(i);
                int stayCount = 1 + (i % 3); // 1..3 reservations per guest

                for (int j = 0; j < stayCount; j++) {
                    Room assignedRoom = allRoomsForGeneration.get((i * 7 + j * 13) % allRoomsForGeneration.size());
                    Hotel assignedHotel = assignedRoom.getRoomType().getHotel();

                    ReservationStatus status;
                    int selector = (i + j) % 10;
                    if (selector < 5) {
                        status = ReservationStatus.CHECKED_OUT;
                    } else if (selector < 8) {
                        status = ReservationStatus.BOOKED;
                    } else if (selector == 8) {
                        status = ReservationStatus.CHECKED_IN;
                    } else {
                        status = ReservationStatus.CANCELLED;
                    }

                    int nights = 2 + ((i + j) % 4);
                    LocalDate checkIn;
                    LocalDate checkOut;

                    if (status == ReservationStatus.CHECKED_OUT) {
                        checkIn = today.minusDays(14 + ((i * 17L + j * 11L) % 540));
                        checkOut = checkIn.plusDays(nights);
                    } else if (status == ReservationStatus.BOOKED) {
                        checkIn = today.plusDays(6 + ((i * 9L + j * 5L) % 220));
                        checkOut = checkIn.plusDays(nights);
                    } else if (status == ReservationStatus.CHECKED_IN) {
                        checkIn = today.minusDays(1 + ((i + j) % 3));
                        checkOut = today.plusDays(1 + ((i + j) % 5));
                    } else { // CANCELLED
                        checkIn = today.plusDays(10 + ((i * 5L + j * 3L) % 180));
                        checkOut = checkIn.plusDays(nights);
                    }

                    BigDecimal totalPrice = assignedRoom.getRoomType().getBasePrice()
                            .multiply(BigDecimal.valueOf(nights));

                    generatedReservations.add(res(
                            reservationRepo,
                            g,
                            assignedRoom,
                            assignedHotel,
                            checkIn,
                            checkOut,
                            status,
                            totalPrice));
                }
            }

            // Add lightweight sentiment coverage for a subset of newly completed stays.
            String[] reviewPool = {
                    "Great business stay with efficient service and very clean rooms.",
                    "Comfortable and quiet overall, with attentive staff throughout.",
                    "Excellent location and smooth check-in experience.",
                    "Room quality was fair, service was acceptable.",
                    "Breakfast variety could improve, but overall stay was pleasant.",
                    "Outstanding suite setup and thoughtful hospitality touches."
            };
            int reviewIndex = 0;
            for (Reservation r : generatedReservations) {
                if (r.getStatus() != ReservationStatus.CHECKED_OUT) continue;
                if ((reviewIndex % 5) != 0) {
                    reviewIndex++;
                    continue;
                }

                String comment = reviewPool[reviewIndex % reviewPool.length];
                double score = switch (reviewIndex % 6) {
                    case 0 -> 0.74;
                    case 1 -> 0.68;
                    case 2 -> 0.52;
                    case 3 -> 0.15;
                    case 4 -> -0.21;
                    default -> 0.81;
                };
                SentimentLabel label = score > 0.3
                        ? SentimentLabel.POSITIVE
                        : (score < -0.3 ? SentimentLabel.NEGATIVE : SentimentLabel.NEUTRAL);

                review(
                        reviewRepo,
                        r,
                        score > 0.5 ? 5 : (score > 0.2 ? 4 : (score < 0 ? 3 : 4)),
                        comment,
                        score,
                        label,
                        r.getCheckOutDate().plusDays(1));
                reviewIndex++;
            }

            System.out.println("✓ Overnight seed data loaded — " +
                    hotelRepo.count() + " hotels, " +
                    roomTypeRepo.count() + " room types, " +
                    roomRepo.count() + " rooms, " +
                    guestRepo.count() + " guests, " +
                    reservationRepo.count() + " reservations, " +
                    reviewRepo.count() + " reviews");
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Hotel hotel(String name, String address, String city,
                        String country, String description, String imageUrl) {
        Hotel h = new Hotel();
        h.setName(name);
        h.setAddress(address);
        h.setCity(city);
        h.setCountry(country);
        h.setDescription(description);
        h.setImageUrl(imageUrl);
        return h;
    }

    private RoomType roomType(Hotel hotel, String name, String description,
                              BigDecimal basePrice, int capacity, String imageUrl) {
        RoomType rt = new RoomType();
        rt.setHotel(hotel);
        rt.setName(name);
        rt.setDescription(description);
        rt.setBasePrice(basePrice);
        rt.setCapacity(capacity);
        rt.setImageUrl(imageUrl);
        return rt;
    }

    private Room room(RoomType roomType, String number, int floor) {
        Room r = new Room();
        r.setRoomType(roomType);
        r.setRoomNumber(number);
        r.setFloor(floor);
        r.setStatus(RoomStatus.AVAILABLE);
        return r;
    }

    private Guest guest(String first, String last, String email, String phone) {
        Guest g = new Guest();
        g.setFirstName(first);
        g.setLastName(last);
        g.setEmail(email);
        g.setPhone(phone);
        return g;
    }

    /** Saves and returns the reservation so its reference can be used for reviews. */
    private Reservation res(ReservationRepository repo,
                            Guest guest, Room room, Hotel hotel,
                            LocalDate checkIn, LocalDate checkOut,
                            ReservationStatus status, BigDecimal totalPrice) {
        Reservation r = new Reservation();
        r.setGuest(guest);
        r.setRoom(room);
        r.setHotel(hotel);
        r.setCheckInDate(checkIn);
        r.setCheckOutDate(checkOut);
        r.setStatus(status);
        r.setTotalPrice(totalPrice);
        return repo.save(r);
    }

    /**
     * Creates a pre-scored review with a backdated timestamp.
     * Backdating is safe because Review.@PrePersist is null-safe — it only
     * sets createdAt when the field has not already been populated.
     */
    private void review(ReviewRepository reviewRepo,
                        Reservation reservation,
                        int rating, String comment,
                        double sentimentScore, SentimentLabel sentimentLabel,
                        LocalDate createdAtDate) {
        Review review = new Review();
        review.setReservation(reservation);
        review.setRating(rating);
        review.setComment(comment);
        review.setSentimentScore(sentimentScore);
        review.setSentimentLabel(sentimentLabel);
        review.setCreatedAt(createdAtDate.atStartOfDay(ZoneOffset.UTC).toInstant());
        reviewRepo.save(review);
    }
}