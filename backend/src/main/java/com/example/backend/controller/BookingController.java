package com.example.backend.controller;

import com.example.backend.model.Booking;
import com.example.backend.model.Ride;
import com.example.backend.service.BookingService;
import com.example.backend.service.RideService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingService bookingService;
    private final RideService rideService;
    private final com.example.backend.service.NotificationService notificationService;
    private final com.example.backend.service.ReviewService reviewService;

    public BookingController(BookingService bookingService, RideService rideService, com.example.backend.service.NotificationService notificationService, com.example.backend.service.ReviewService reviewService) {
        this.bookingService = bookingService;
        this.rideService = rideService;
        this.notificationService = notificationService;
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> body, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        try {
            Long rideId = Long.valueOf(body.containsKey("rideId") ? body.get("rideId").toString()
                    : body.get("vehicleId").toString());
            Ride r = rideService.findById(rideId).orElseThrow(() -> new RuntimeException("Ride not found"));

            boolean isDriver = auth.getName().equals(r.getDriverEmail());

            // Access Control: Allow ROLE_USER OR the Driver of this ride
            boolean isUser = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_USER"));
            if (!isUser && !isDriver) {
                return ResponseEntity.status(403).body(Map.of("error", "User or Owner required"));
            }

            int seats = Integer.parseInt(body.get("seats").toString());
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawPassengers = (List<Map<String, Object>>) body.get("passengers");
            if (rawPassengers == null)
                rawPassengers = List.of();

            List<com.example.backend.model.Passenger> passengers = rawPassengers.stream().map(p -> {
                String name = (String) p.get("name");
                int age = Integer.parseInt(p.get("age").toString());
                String gender = (String) p.get("gender");
                return new com.example.backend.model.Passenger(name, age, gender);
            }).toList();

            Booking b = new Booking();
            b.setUserEmail(auth.getName());
            b.setRide(r);
            b.setSeats(seats);
            b.setPassengers(passengers);

            // Extract Locations from Body
            if (body.containsKey("pickupLocation"))
                b.setPickupLocation(body.get("pickupLocation").toString());
            if (body.containsKey("dropoffLocation"))
                b.setDropoffLocation(body.get("dropoffLocation").toString());

            if (body.containsKey("totalPrice")) {
                b.setTotalPrice(Double.valueOf(body.get("totalPrice").toString()));
            }

            if (body.containsKey("paymentMethod")) {
                b.setPaymentMethod(body.get("paymentMethod").toString());
            }

            Booking saved = bookingService.createBooking(b);
            return ResponseEntity.ok(saved);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> myBookings(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        List<Booking> list = bookingService.findByUserEmail(auth.getName());
        return ResponseEntity.ok(list);
    }

    @GetMapping
    public ResponseEntity<?> allBookings(Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        return ResponseEntity.ok(bookingService.allBookings());
    }

    @GetMapping("/driver")
    public ResponseEntity<?> driverBookings(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String currentUser = auth.getName();
        List<Booking> all = bookingService.allBookings();
        java.time.LocalDate today = java.time.LocalDate.now();


        
        List<Booking> tempList = all.stream()
                .filter(b -> {
                    if (b.getRide() == null)
                        return false;
                    String rDriver = b.getRide().getDriverEmail();
                    if (rDriver == null)
                        return false;
                    return currentUser.trim().equalsIgnoreCase(rDriver.trim());
                })
                .toList();

        // Separate processing to ensure side-effects happen reliably
        List<Booking> driverBookings = new java.util.ArrayList<>(tempList);
        
        driverBookings.forEach(b -> {
             if ("PENDING".equals(b.getStatus())) {
                 try {
                     String dStr = b.getRide().getDate();
                     if (dStr != null) {
                         java.time.LocalDate rDate = null;
                         try {
                             // Try ISO first (2025-01-31)
                             rDate = java.time.LocalDate.parse(dStr);
                         } catch (Exception e1) {
                             // Try d/M/yyyy (31/1/2025 or 5/1/2026)
                             try {
                                 rDate = java.time.LocalDate.parse(dStr, java.time.format.DateTimeFormatter.ofPattern("d/M/yyyy"));
                             } catch (Exception e2) {
                                // Try dd-MM-yyyy
                                try {
                                     rDate = java.time.LocalDate.parse(dStr, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                                } catch (Exception e3) {
                                     System.err.println("Could not parse date: " + dStr);
                                }
                             }
                         }

                         if (rDate != null && rDate.isBefore(today)) {
                             b.setStatus("EXPIRED");
                             bookingService.updateBooking(b);
                         }
                     }
                 } catch (Exception e) {
                      e.printStackTrace(); 
                 }
             }
             
             // Calculate rating
             b.setUserRating(reviewService.getAverageRating(b.getUserEmail()));
        });
        
        driverBookings.sort((b1, b2) -> Long.compare(b2.getId(), b1.getId()));

        return ResponseEntity.ok(driverBookings);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body,
            Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String newStatus = body.get("status");

        Booking b = bookingService.findById(id).orElse(null);
        if (b == null)
            return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));

        // Verify this booking belongs to a ride owned by this driver
        if (!auth.getName().equals(b.getRide().getDriverEmail())) {
            return ResponseEntity.status(403).body(Map.of("error", "Not your booking"));
        }

        b.setStatus(newStatus);
        bookingService.updateBooking(b); // Save
        return ResponseEntity.ok(b);
    }

    @PostMapping("/estimate")
    public ResponseEntity<?> estimate(@RequestBody Booking b) {
        if (b.getPickupLocation() == null || b.getDropoffLocation() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "pickupLocation and dropoffLocation required"));
        }
        return ResponseEntity
                .ok(bookingService.estimatePrice(b.getPickupLocation(), b.getDropoffLocation(), b.getSeats()));
    }

    @PutMapping("/{id}/confirm-dropoff")
    public ResponseEntity<?> confirmDropoff(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        Booking b = bookingService.findById(id).orElse(null);
        if (b == null) return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));

        if (!b.getUserEmail().equals(auth.getName())) {
             return ResponseEntity.status(403).body(Map.of("error", "Not your booking"));
        }

        if (!"DRIVER_COMPLETED".equals(b.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Driver has not marked ride as completed yet."));
        }

        if ("CASH".equalsIgnoreCase(b.getPaymentMethod())) {
            b.setStatus("CASH_PAYMENT_PENDING"); // Wait for Driver to confirm receipt
        } else {
            b.setStatus("PAYMENT_PENDING"); // Wait for Stripe Payment
        }

        bookingService.updateBooking(b);
        return ResponseEntity.ok(b);
    }

    @PutMapping("/{id}/confirm-cash")
    public ResponseEntity<?> confirmCash(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        Booking b = bookingService.findById(id).orElse(null);
        if (b == null) return ResponseEntity.status(404).body(Map.of("error", "Booking not found"));

        // Must be Driver
        if (!b.getRide().getDriverEmail().equals(auth.getName())) {
             return ResponseEntity.status(403).body(Map.of("error", "Not your booking"));
        }

        if (!"CASH_PAYMENT_PENDING".equals(b.getStatus())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Booking is not waiting for cash confirmation."));
        }

        b.setStatus("COMPLETED");
        b.setPaymentStatus("PAID"); 
        bookingService.updateBooking(b);

        notificationService.createNotification(b.getUserEmail(), "Driver confirmed Cash Payment. Ride Complete!", "PAYMENT_CONFIRMED");
        
        return ResponseEntity.ok(b);
    }
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        
        try {
            String reason = body.getOrDefault("reason", "No reason provided");
            Booking b = bookingService.cancelBooking(id, reason, auth.getName());
            return ResponseEntity.ok(b);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
