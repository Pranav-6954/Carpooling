package com.example.backend.controller;

import com.example.backend.service.RideService;
import com.example.backend.service.BookingService;
import com.example.backend.model.Booking;
import com.example.backend.model.Ride;
import com.example.backend.service.FareService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    private final RideService service;
    private final FareService fareService;
    private final com.example.backend.service.ReviewService reviewService;
    private final BookingService bookingService;
    private final com.example.backend.service.NotificationService notificationService;
    private final com.example.backend.service.UserService userService;

    public RideController(RideService service, FareService fareService, com.example.backend.service.ReviewService reviewService, BookingService bookingService, com.example.backend.service.NotificationService notificationService, com.example.backend.service.UserService userService) {
        this.service = service;
        this.fareService = fareService;
        this.reviewService = reviewService;
        this.bookingService = bookingService;
        this.notificationService = notificationService;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        List<Ride> rides = service.list().stream()
                .filter(r -> "OPEN".equals(r.getStatus()) && r.getTickets() > 0)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(enrichRides(rides));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam(required = false, defaultValue = "") String from,
            @RequestParam(required = false, defaultValue = "") String to) {
        List<Ride> rides = service.searchRides(from, to).stream()
                .filter(r -> "OPEN".equals(r.getStatus()) && r.getTickets() > 0)
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(enrichRides(rides));
    }

    private List<Map<String, Object>> enrichRides(List<Ride> rides) {
        return rides.stream().map(r -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", r.getId());
            map.put("fromLocation", r.getFromLocation());
            map.put("toLocation", r.getToLocation());
            map.put("date", r.getDate());
            map.put("price", r.getPrice());
            map.put("tickets", r.getTickets());
            map.put("vehicleType", r.getVehicleType());
            map.put("imageUrl", r.getImageUrl());
            map.put("driverName", r.getDriverName());
            map.put("driverEmail", r.getDriverEmail());
            map.put("driverRating", reviewService.getAverageRating(r.getDriverEmail()));
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Ride r, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isDriver = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));

        if (!isAdmin && !isDriver) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin or Driver required"));
        }
        
        // Driver Verification Check
        if (isDriver && !isAdmin) {
             com.example.backend.model.User currentUser = userService.findByEmail(auth.getName()).orElse(null);
             if (currentUser != null && (currentUser.isVerified() == null || !currentUser.isVerified())) {
                 return ResponseEntity.status(403).body(Map.of("error", "Driver verification pending. Please wait for admin approval."));
             }
        }

        // Validate Price against FareService
        if (r.getFromLocation() != null && r.getToLocation() != null) {
            Map<String, Object> fareData = fareService.calculateFare(r.getFromLocation(), r.getToLocation());
            double maxPrice = (double) fareData.get("recommendedPrice");

            // Allow a small buffer or strictly enforce?
            // User requirement: "must NOT exceed the dynamically calculated fare."
            if (r.getPrice() > maxPrice) {
                return ResponseEntity.badRequest().body(Map.of("error",
                        "Price exceeds the maximum allowed fare of " + maxPrice + " for this route."));
            }
        }

        try {
            Ride saved = service.createPost(r, auth.getName());
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        System.out.println("DELETE REQUEST: User=" + auth.getName());
        System.out.println("AUTHORITIES: " + auth.getAuthorities());

        Optional<Ride> rideOpt = service.findById(id);
        if (rideOpt.isEmpty()) return ResponseEntity.notFound().build();

        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = rideOpt.get().getDriverEmail().equals(auth.getName());

        System.out.println("isAdmin: " + isAdmin + ", isOwner: " + isOwner);

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
        }
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/driver-posts")
    public ResponseEntity<?> getDriverRides(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        String driverEmail = auth.getName();
        List<Ride> myRides = service.list().stream()
                .filter(r -> driverEmail.equals(r.getDriverEmail()))
                .filter(r -> "OPEN".equalsIgnoreCase(r.getStatus()))
                .collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok(myRides);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        Optional<Ride> opt = service.findById(id);
        if (opt.isPresent())
            return ResponseEntity.ok(opt.get());
        else
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Ride r, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        Optional<Ride> existing = service.findById(id);
        if (existing.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));

        Ride db = existing.get();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = db.getDriverEmail().equals(auth.getName());

        if (!isAdmin && !isOwner) {
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
        }

        // Update fields...
        if (r.getFromLocation() != null)
            db.setFromLocation(r.getFromLocation());
        if (r.getToLocation() != null)
            db.setToLocation(r.getToLocation());
        if (r.getDate() != null)
            db.setDate(r.getDate());

        // Re-validate price if location or price changes (Simplified check here)
        double currentPrice = (r.getPrice() > 0) ? r.getPrice() : db.getPrice();
        String currentFrom = (r.getFromLocation() != null) ? r.getFromLocation() : db.getFromLocation();
        String currentTo = (r.getToLocation() != null) ? r.getToLocation() : db.getToLocation();

        Map<String, Object> fareData = fareService.calculateFare(currentFrom, currentTo);
        double maxPrice = (double) fareData.get("recommendedPrice");

        if (currentPrice > maxPrice) {
            return ResponseEntity.badRequest().body(Map.of("error",
                    "Price exceeds the maximum allowed fare of " + maxPrice + " for this route."));
        }

        if (r.getPrice() > 0)
            db.setPrice(r.getPrice());
        if (r.getTickets() >= 0)
            db.setTickets(r.getTickets());
        if (r.getVehicleType() != null)
            db.setVehicleType(r.getVehicleType());
        if (r.getImageUrl() != null)
            db.setImageUrl(r.getImageUrl());
        if (r.getRoute() != null)
            db.setRoute(r.getRoute());

        Ride saved = service.save(db);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelRide(@PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String reason = payload.getOrDefault("reason", "No reason provided");

        Optional<Ride> existing = service.findById(id);
        if (existing.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));

        Ride ride = existing.get();
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        
        if (!isAdmin && !ride.getDriverEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
        }

        ride.setStatus("CANCELLED");
        ride.setCancellationReason(reason);
        service.save(ride);

        // Cancel all related bookings
        List<Booking> bookings = bookingService.findByRideId(id);
        for (Booking b : bookings) {
            // Cancel active bookings
            if (!"CANCELLED".equals(b.getStatus()) && !"REJECTED".equals(b.getStatus())) { // Only cancel if not already finished/cancelled?
                 // Even if ACCEPTED or PENDING
                 b.setStatus("CANCELLED");
                 b.setCancellationReason("Driver Cancelled: " + reason);
                 bookingService.updateBooking(b);
                 notificationService.createNotification(b.getUserEmail(), "Ride Cancelled by Driver: " + reason, "RIDE_CANCELLED");
            }
        }
        return ResponseEntity.ok(ride);
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeRide(@PathVariable Long id, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();

        Optional<Ride> existing = service.findById(id);
        if (existing.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));

        Ride ride = existing.get();
        if (!ride.getDriverEmail().equals(auth.getName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Permission denied"));
        }

        ride.setStatus("COMPLETED");
        service.save(ride);

        // Update all related bookings
        List<Booking> bookings = bookingService.findByRideId(id);
        for (Booking b : bookings) {
            // Only update bookings that are in progress (ACCEPTED or PAID)
            // If they are REJECTED or CANCELLED, ignore.
            // If they are PENDING, they should probably be REJECTED? Or ignored? User didn't specify. 
            // Let's assume we proceed with ACCEPTED bookings.
            if ("ACCEPTED".equals(b.getStatus()) || "PAID".equals(b.getStatus())) {
                 if ("CASH".equalsIgnoreCase(b.getPaymentMethod())) {
                     b.setStatus("CASH_PAYMENT_PENDING");
                     notificationService.createNotification(b.getUserEmail(), "Ride Completed! Please pay cash to Driver.", "RIDE_COMPLETED");
                 } else {
                     // For Stripe, if already paid, mark complete, otherwise pending
                     if ("PAID".equals(b.getPaymentStatus())) {
                         b.setStatus("COMPLETED");
                     } else {
                         b.setStatus("PAYMENT_PENDING");
                         notificationService.createNotification(b.getUserEmail(), "Ride Completed! Please proceed to payment.", "RIDE_COMPLETED");
                     }
                 }
                 bookingService.updateBooking(b);
            }
        }
        
        return ResponseEntity.ok(ride);
    }
}
