package com.example.backend.service;

import com.example.backend.model.Booking;
import com.example.backend.model.Ride;
import com.example.backend.model.User;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.RideRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final RideRepository rideRepository;
    private final GoogleMapsService googleMapsService;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserService userService;

    public BookingService(BookingRepository bookingRepository, RideRepository rideRepository,
            GoogleMapsService googleMapsService, NotificationService notificationService, EmailService emailService, UserService userService) {
        this.bookingRepository = bookingRepository;
        this.rideRepository = rideRepository;
        this.googleMapsService = googleMapsService;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.userService = userService;
    }

    @Transactional
    public Booking createBooking(Booking b) {
        if (b.getRide() == null || b.getRide().getId() == null) {
            throw new RuntimeException("Ride ID is required");
        }
        Long rid = b.getRide().getId();
        Ride r = rideRepository.findById(rid).orElseThrow(() -> new RuntimeException("Ride not found"));
        if (b.getSeats() > r.getTickets())
            throw new RuntimeException("Not enough seats available");

        // 1. Determine Locations
        String from = b.getPickupLocation() != null ? b.getPickupLocation() : r.getFromLocation();
        String to = b.getDropoffLocation() != null ? b.getDropoffLocation() : r.getToLocation();
        b.setPickupLocation(from);
        b.setDropoffLocation(to);

        // 2. Calculate Distance
        long distMeters = googleMapsService.getDistanceInMeters(from, to);
        double distKm = distMeters / 1000.0;
        b.setDistanceKm(distKm);

        // 3. Calculate Price
        double base = 50.0;
        double rate = 2.0;
        double pricePerSeat = base + (rate * distKm);
        double total = pricePerSeat * b.getSeats();
        double systemTotal = Math.round(total * 100.0) / 100.0;

        if (b.getTotalPrice() != null && b.getTotalPrice() > 0) {
            // Use User's Offer
        } else {
            b.setTotalPrice(systemTotal);
        }

        // 4. Payment Logic
        if ("CASH".equalsIgnoreCase(b.getPaymentMethod())) {
            b.setPaymentStatus("PENDING_COLLECTION");
            b.setStatus("PENDING"); 
        } else {
            b.setPaymentMethod("STRIPE");
            b.setPaymentStatus("UNPAID");
            b.setStatus("PENDING");
        }

        r.setTickets(r.getTickets() - b.getSeats());
        rideRepository.save(r);
        b.setRide(r);
        Booking saved = bookingRepository.save(b);

        // 5. Notifications
        sendNotifications(saved, "BOOKING_CREATED");

        return saved;
    }

    private void sendNotifications(Booking b, String type) {
        Ride r = b.getRide();
        // Driver Notification
        // Driver Notification
        if (r.getDriverEmail() != null) {
            if ("BOOKING_CREATED".equals(type)) {
                String msg = String.format("New Booking! %d seats from %s to %s. Offer: Rs. %.2f (%s)", 
                            b.getSeats(), b.getPickupLocation(), b.getDropoffLocation(), b.getTotalPrice(), b.getPaymentMethod());
                notificationService.createNotification(r.getDriverEmail(), msg, type);
                // emailService.sendEmail(r.getDriverEmail(), "Carpooling: New Booking Request", msg);
            } else if ("BOOKING_UPDATED".equals(type)) {
                // Only notify driver of updates if it's significant (e.g. cancelled? handled elsewhere usually)
                // For general validation, if status changed to COMPLETED or PAID, maybe useful?
                // But for Ride Completion (initiated by driver), we might want to suppress self-notifications or make them clear.
                String sub = "Booking Update";
                String msg = String.format("Booking for %s is now %s", b.getDropoffLocation(), b.getStatus());
                
                // If the status is one of the completion flows
                if ("COMPLETED".equals(b.getStatus()) || "DRIVER_COMPLETED".equals(b.getStatus())) {
                    msg = "Ride to " + b.getDropoffLocation() + " marked as " + b.getStatus();
                }
                
                notificationService.createNotification(r.getDriverEmail(), msg, type);
            }
        }
        // Passenger Notification
        if (b.getUserEmail() != null) {
            String statusMsg;
            switch(b.getStatus()) {
                case "ACCEPTED":
                    statusMsg = "Good news! Your booking to " + b.getDropoffLocation() + " has been ACCEPTED. Please proceed to payment.";
                    
                    // Send Detailed Email
                    if (r.getDriverEmail() != null) {
                        User driver = userService.findByEmail(r.getDriverEmail()).orElse(null);
                        emailService.sendRideConfirmationEmail(b.getUserEmail(), r, driver, b);
                    }
                    break;
                case "COMPLETED":
                case "PAID":
                    statusMsg = "Payment Successful! Your ride to " + b.getDropoffLocation() + " is CONFIRMED.";
                    emailService.sendPaymentReceivedEmail(b.getUserEmail(), b);
                    break;
                case "REJECTED":
                    statusMsg = "Sorry, your booking request to " + b.getDropoffLocation() + " was declined by the driver.";
                    break;
                case "PENDING":
                    statusMsg = "Your booking request to " + b.getDropoffLocation() + " is sent to the driver.";
                    break;
                default:
                    statusMsg = "Your booking for ride to " + b.getDropoffLocation() + " is now " + b.getStatus();
            }
            notificationService.createNotification(b.getUserEmail(), statusMsg, type);
            // emailService.sendEmail(b.getUserEmail(), "Carpooling: Booking Status Update", statusMsg);
        }
    }

    public Booking updateBooking(Booking b) {
        Booking saved = bookingRepository.save(b);
        sendNotifications(saved, "BOOKING_UPDATED");
        return saved;
    }

    @Transactional
    public Booking cancelBooking(Long bookingId, String reason, String actorEmail) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Ride r = b.getRide();

        // Security Check: Only Passenger or Driver can cancel
        boolean isPassenger = b.getUserEmail().equals(actorEmail);
        boolean isDriver = r.getDriverEmail().equals(actorEmail);

        if (!isPassenger && !isDriver) {
             throw new RuntimeException("Unauthorized to cancel this booking");
        }

        // Prevent cancelling if already completed/cancelled
        if ("CANCELLED".equals(b.getStatus()) || "COMPLETED".equals(b.getStatus())) {
            throw new RuntimeException("Cannot cancel a booking that is already " + b.getStatus());
        }

        b.setStatus("CANCELLED");
        b.setCancellationReason(reason);
        
        // RESTORE SEATS
        r.setTickets(r.getTickets() + b.getSeats());
        rideRepository.save(r);
        
        Booking saved = bookingRepository.save(b);

        // Notifications
        String targetEmail = isPassenger ? r.getDriverEmail() : b.getUserEmail();
        String msg = String.format("Booking Cancelled by %s. Reason: %s", 
            isPassenger ? "Passenger" : "Driver", 
            reason != null ? reason : "No reason provided");
            
        notificationService.createNotification(targetEmail, msg, "BOOKING_CANCELLED");
        
        // Also notify the actor confirming cancellation
        notificationService.createNotification(actorEmail, "Booking successfully cancelled.", "BOOKING_CANCELLED");

        // Send Email
        try {
             emailService.sendEmail(targetEmail, "Ride Cancellation Alert", 
                "Your ride booking has been cancelled.\n\n" + msg + "\n\nRide: " + r.getFromLocation() + " -> " + r.getToLocation());
        } catch (Exception e) {
            System.err.println("Failed to send cancellation email: " + e.getMessage());
        }

        return saved;
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

    public List<Booking> findByRideId(Long rideId) {
        return bookingRepository.findByRideId(rideId);
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

    @Transactional
    public int fixStuckBookings() {
        List<Booking> stuck = bookingRepository.findAll().stream()
            .filter(b -> "PAYMENT_PENDING".equals(b.getStatus()) || 
                         "UNPAID".equals(b.getPaymentStatus()) ||
                         "PENDING_COLLECTION".equals(b.getPaymentStatus()) ||
                         "CONFIRMED".equals(b.getStatus()) ||
                         "DRIVER_COMPLETED".equals(b.getStatus()))
            .collect(java.util.stream.Collectors.toList());
        
        for (Booking b : stuck) {
            b.setStatus("COMPLETED");
            b.setPaymentStatus("PAID");
            bookingRepository.save(b);
        }
        return stuck.size();
    }
}
