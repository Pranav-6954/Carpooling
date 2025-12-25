package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final UserService userService;
    private final com.example.backend.service.BookingService bookingService;
    private final com.example.backend.service.VehicleService vehicleService;
    private final com.example.backend.repository.PaymentRepository paymentRepository;

    public AdminController(UserService userService,
            com.example.backend.service.BookingService bookingService,
            com.example.backend.service.VehicleService vehicleService,
            com.example.backend.repository.PaymentRepository paymentRepository) {
        this.userService = userService;
        this.bookingService = bookingService;
        this.vehicleService = vehicleService;
        this.paymentRepository = paymentRepository;
    }

    private boolean isSuperAdmin(Authentication auth) {
        if (auth == null)
            return false;
        // auth.getName() is email
        Optional<User> u = userService.findByEmail(auth.getName());
        return u.map(User::isSuperAdmin).orElse(false);
    }

    @GetMapping("/users")
    public ResponseEntity<?> all(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        return ResponseEntity.ok(userService.allUsers());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> edit(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        User u = opt.get();
        u.setName(body.getOrDefault("name", u.getName()));
        u.setEmail(body.getOrDefault("email", u.getEmail()));
        if (body.containsKey("role")) {
            String r = body.get("role");
            // Allow changing to 'user' or 'driver' or 'admin' (if authorized?)
            // For now let's just allow it blindly if they are admin.
            u.setRole(r);
        }
        userService.save(u);
        return ResponseEntity.ok(u);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        if (!isSuperAdmin(auth))
            return ResponseEntity.status(403).body(Map.of("error", "Only super admin can delete admins"));
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        User u = opt.get();
        if (u.isSuperAdmin())
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot remove super admin"));
        userService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, Authentication auth) {
        if (!isSuperAdmin(auth))
            return ResponseEntity.status(403).body(Map.of("error", "Only super admin can approve"));
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        User u = opt.get();
        if (!"pending-admin".equals(u.getRole()))
            return ResponseEntity.badRequest().body(Map.of("error", "Not pending"));
        u.setRole("admin");
        u.setRequestedAdmin(false);
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "Approved"));
    }

    @PostMapping("/users/{id}/revoke")
    public ResponseEntity<?> revoke(@PathVariable Long id, Authentication auth) {
        if (!isSuperAdmin(auth))
            return ResponseEntity.status(403).body(Map.of("error", "Only super admin can revoke"));
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        User u = opt.get();
        if (u.isSuperAdmin())
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot revoke super admin"));
        u.setRole("user");
        u.setRequestedAdmin(false);
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "Revoked"));
    }

    @PostMapping("/users/{id}/toggle-status")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        Optional<User> opt = userService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "Not found"));
        User u = opt.get();
        
        if (u.isSuperAdmin()) return ResponseEntity.badRequest().body(Map.of("error", "Cannot deactivate super admin"));
        
        u.setActive(!u.isActive());
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "Status updated to " + (u.isActive() ? "Active" : "Deactivated")));
    }

    @GetMapping("/stats/detailed")
    public ResponseEntity<?> getDetailedStats(Authentication auth) {
        // Allow any admin to view stats
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }

        List<User> users = userService.allUsers();
        long userCount = users.stream().filter(u -> "user".equals(u.getRole())).count();
        long driverCount = users.stream().filter(u -> "driver".equals(u.getRole())).count();

        List<com.example.backend.model.Booking> bookings = bookingService.allBookings();
        long totalBookings = bookings.size();
        long cancelledBookings = bookings.stream()
                .filter(b -> "CANCELLED".equals(b.getStatus()) || "REJECTED".equals(b.getStatus())).count();

        // Calculate ACTUAL earnings from Payment table
        List<com.example.backend.model.Payment> payments = paymentRepository.findAll();
        double totalVolume = payments.stream()
                .filter(p -> "CONFIRMED".equals(p.getStatus()))
                .mapToDouble(p -> p.getAmount())
                .sum();

        double onlineVolume = payments.stream()
                .filter(p -> "CONFIRMED".equals(p.getStatus()) && p.getStripePaymentIntentId() != null && !p.getStripePaymentIntentId().startsWith("CASH_"))
                .mapToDouble(p -> p.getAmount())
                .sum();

        double cashVolume = payments.stream()
                .filter(p -> "CONFIRMED".equals(p.getStatus()) && p.getStripePaymentIntentId() != null && p.getStripePaymentIntentId().startsWith("CASH_"))
                .mapToDouble(p -> p.getAmount())
                .sum();

        List<com.example.backend.model.Vehicle> rides = vehicleService.getAllVehicles();
        long totalRides = rides.size();

        return ResponseEntity.ok(Map.of(
                "userCount", userCount,
                "driverCount", driverCount,
                "totalBookings", totalBookings,
                "cancelledBookings", cancelledBookings,
                "totalVolume", totalVolume,
                "onlineVolume", onlineVolume,
                "cashVolume", cashVolume,
                "totalRides", totalRides));
    }
    @GetMapping("/activity")
    public ResponseEntity<?> getRecentActivity(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }

        List<User> latestUsers = userService.allUsers().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5).toList();

        List<com.example.backend.model.Vehicle> latestRides = vehicleService.getAllVehicles().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5).toList();

        List<com.example.backend.model.Booking> latestBookings = bookingService.allBookings().stream()
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .limit(5).toList();

        java.util.List<Map<String, Object>> activities = new java.util.ArrayList<>();

        for (User u : latestUsers) {
            activities.add(Map.of(
                "type", "USER_REGISTRATION",
                "message", "New user joined: " + u.getName(),
                "timestamp", u.getId(), // Using ID as mock chronological order
                "user", u.getEmail()
            ));
        }

        for (com.example.backend.model.Vehicle v : latestRides) {
            activities.add(Map.of(
                "type", "RIDE_CREATED",
                "message", "New ride created: " + v.getFromLocation() + " to " + v.getToLocation(),
                "timestamp", v.getId(),
                "user", v.getDriverEmail()
            ));
        }

        for (com.example.backend.model.Booking b : latestBookings) {
            activities.add(Map.of(
                "type", "BOOKING_CONFIRMED",
                "message", "New booking: " + b.getUserEmail() + " reserved " + b.getSeats() + " seats",
                "timestamp", b.getId(),
                "user", b.getUserEmail()
            ));
        }

        // Sort combined list by "timestamp" (ID) desc
        activities.sort((a, b) -> ((Long) b.get("timestamp")).compareTo((Long) a.get("timestamp")));
        
        return ResponseEntity.ok(activities.stream().limit(10).toList());
    }
}
