package com.example.backend.service;

import com.example.backend.model.Booking;
import com.example.backend.model.Vehicle;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final VehicleRepository vehicleRepository;
    private final GoogleMapsService googleMapsService;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository, VehicleRepository vehicleRepository,
            GoogleMapsService googleMapsService, NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.vehicleRepository = vehicleRepository;
        this.googleMapsService = googleMapsService;
        this.notificationService = notificationService;
    }

    @Transactional
    public Booking createBooking(Booking b) {
        if (b.getVehicle() == null || b.getVehicle().getId() == null) {
            throw new RuntimeException("Vehicle ID is required");
        }
        Long vid = b.getVehicle().getId();
        Vehicle v = vehicleRepository.findById(vid).orElseThrow(() -> new RuntimeException("Vehicle not found"));
        if (b.getSeats() > v.getTickets())
            throw new RuntimeException("Not enough seats available");

        // 1. Determine Locations
        String from = b.getPickupLocation() != null ? b.getPickupLocation() : v.getFromLocation();
        String to = b.getDropoffLocation() != null ? b.getDropoffLocation() : v.getToLocation();
        b.setPickupLocation(from);
        b.setDropoffLocation(to);

        // 2. Calculate Distance
        long distMeters = googleMapsService.getDistanceInMeters(from, to);
        double distKm = distMeters / 1000.0;
        b.setDistanceKm(distKm);

        // 3. Calculate Price
        // Fare = Base (50) + (2.0 * Dist)
        double base = 50.0;
        double rate = 2.0;
        double pricePerSeat = base + (rate * distKm);
        double total = pricePerSeat * b.getSeats();

        // Round to 2 decimals
        double systemTotal = Math.round(total * 100.0) / 100.0;

        // Dynamic Pricing: Allow User Offer if provided
        if (b.getTotalPrice() != null && b.getTotalPrice() > 0) {
            // Use User's Offer
        } else {
            b.setTotalPrice(systemTotal);
        }

        v.setTickets(v.getTickets() - b.getSeats());

        vehicleRepository.save(v);
        b.setVehicle(v);
        Booking saved = bookingRepository.save(b);

        // Notify Driver via NotificationService
        if (v.getDriverEmail() != null) {
            String msg = "New Booking Request! " + b.getUserEmail() + " requested " + b.getSeats() + " seats.";
            notificationService.send(v.getDriverEmail(), msg);
            // messagingTemplate.convertAndSend("/topic/driver/" + v.getDriverEmail(), msg); // Now handled by service
        }

        return saved;
    }

    public Booking updateBooking(Booking b) {
        return bookingRepository.save(b);
    }

    public List<Booking> findByUserEmail(String email) {
        return bookingRepository.findByUserEmailOrderByCreatedAtDesc(email);
    }

    public java.util.Optional<Booking> findById(Long id) {
        return bookingRepository.findById(id);
    }

    public List<Booking> allBookings() {
        return bookingRepository.findAll();
    }

    public java.util.Map<String, Object> estimatePrice(String from, String to, int seats) {
        long distMeters = googleMapsService.getDistanceInMeters(from, to);
        double distKm = distMeters / 1000.0;
        double base = 50.0;
        double rate = 2.0;
        double pricePerSeat = base + (rate * distKm);
        double total = pricePerSeat * seats;

        // Round
        total = Math.round(total * 100.0) / 100.0;

        return java.util.Map.of(
                "distanceKm", distKm,
                "pricePerSeat", Math.round(pricePerSeat * 100.0) / 100.0,
                "totalPrice", total);
    }
}
