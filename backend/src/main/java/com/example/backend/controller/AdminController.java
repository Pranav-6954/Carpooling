package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.model.Booking;
import com.example.backend.service.BookingService;
import com.example.backend.service.ReviewService;
import com.example.backend.service.RideService;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import com.example.backend.model.Ride;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final ReviewService reviewService;
    private final BookingService bookingService;
    private final RideService rideService;
    private final com.example.backend.service.AdminReportService reportService;

    public AdminController(UserService userService, ReviewService reviewService, BookingService bookingService, RideService rideService, com.example.backend.service.AdminReportService reportService) {
        this.userService = userService;
        this.reviewService = reviewService;
        this.bookingService = bookingService;
        this.rideService = rideService;
        this.reportService = reportService;
    }

    // --- User Management ---

    @GetMapping("/users")
    public ResponseEntity<?> all(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        List<User> users = userService.allUsers();
        
        List<Map<String, Object>> userListWithRatings = users.stream().map(u -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", u.getId());
            map.put("name", u.getName());
            map.put("email", u.getEmail());
            map.put("role", u.getRole());
            map.put("superAdmin", u.isSuperAdmin());
            map.put("requestedAdmin", u.isRequestedAdmin());
            map.put("verified", u.isVerified());
            map.put("averageRating", reviewService.getAverageRating(u.getEmail()));
            return map;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(userListWithRatings);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> edit(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();

        // Prevent modifying other admins if not Super Admin (Simplified logic: Admin can modify anyone for now)
        if (body.containsKey("name")) u.setName(body.get("name"));
        if (body.containsKey("email")) u.setEmail(body.get("email"));
        if (body.containsKey("role")) u.setRole(body.get("role"));

        userService.save(u);
        return ResponseEntity.ok(u);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u != null) {
            userService.delete(id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/users/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        u.setRole("ROLE_ADMIN");
        u.setRequestedAdmin(false);
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "Approved"));
    }

    @PostMapping("/users/{id}/revoke")
    public ResponseEntity<?> revoke(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        u.setRole("ROLE_USER");
        u.setRequestedAdmin(false);
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "Revoked"));
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        
        u.setRole("ROLE_BLOCKED");
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "User blocked"));
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<?> unblockUser(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();

        // Restore role based on car details
        if (u.getCarModel() != null && !u.getCarModel().isEmpty()) {
            u.setRole("ROLE_DRIVER");
        } else {
            u.setRole("ROLE_USER");
        }
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "User unblocked"));
    }

    @PostMapping("/users/{id}/verify")
    public ResponseEntity<?> verifyDriver(@PathVariable Long id, Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        User u = userService.findById(id).orElse(null);
        if (u == null) return ResponseEntity.notFound().build();
        
        u.setVerified(true);
        userService.save(u);
        return ResponseEntity.ok(Map.of("message", "User verified"));
    }

    // --- Statistics & Maintenance ---

    @GetMapping("/users/stats/detailed")
    public ResponseEntity<?> getDetailedStats(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        long userCount = userService.allUsers().stream().filter(u -> "ROLE_USER".equals(u.getRole())).count();
        long driverCount = userService.allUsers().stream().filter(u -> "ROLE_DRIVER".equals(u.getRole())).count();
        long blockedCount = userService.allUsers().stream().filter(u -> "ROLE_BLOCKED".equals(u.getRole())).count();
        long totalRides = rideService.getAllRides().size();

        long totalBookings = bookingService.allBookings().size();
        long cancelledBookings = bookingService.allBookings().stream()
                .filter(b -> "CANCELLED".equals(b.getStatus()) || "REJECTED".equals(b.getStatus())).count();

        double totalEarnings = bookingService.allBookings().stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()) || "PAID".equals(b.getStatus()) || "ACCEPTED".equals(b.getStatus())) // Simplified: Count accepted/paid as earnings for now
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                .sum();

        double cashVolume = bookingService.allBookings().stream()
                .filter(b -> "CASH".equalsIgnoreCase(b.getPaymentMethod()) && ("COMPLETED".equals(b.getStatus()) || "ACCEPTED".equals(b.getStatus())))
                .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
                .sum();
        
        double onlineVolume = totalEarnings - cashVolume;

        return ResponseEntity.ok(Map.of(
            "userCount", userCount,
            "driverCount", driverCount,
            "blockedCount", blockedCount,
            "totalBookings", totalBookings,
            "cancelledBookings", cancelledBookings,
            "totalEarnings", totalEarnings,
            "cashVolume", cashVolume,
            "onlineVolume", onlineVolume,
            "totalRides", totalRides));
    }

    @PostMapping("/users/fix-payment-data")
    public ResponseEntity<?> fixPaymentData(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        int count = bookingService.fixStuckBookings();
        return ResponseEntity.ok(Map.of("message", "Fixed " + count + " bookings"));
    }

    // --- Data Monitoring ---

    @GetMapping("/rides")
    public ResponseEntity<?> getAllRides(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        return ResponseEntity.ok(rideService.getAllRides());
    }

    @GetMapping("/bookings")
    public ResponseEntity<?> getAllBookings(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        
        List<Booking> bookings = bookingService.allBookings();
        List<Map<String, Object>> response = bookings.stream().map(b -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", b.getId());
            map.put("userEmail", b.getUserEmail());
            map.put("seats", b.getSeats());
            map.put("status", b.getStatus());
            map.put("paymentMethod", b.getPaymentMethod());
            map.put("paymentStatus", b.getPaymentStatus());
            map.put("transactionId", b.getTransactionId());
            map.put("totalPrice", b.getTotalPrice());
            map.put("pickupLocation", b.getPickupLocation());
            map.put("dropoffLocation", b.getDropoffLocation());
            map.put("createdAt", b.getCreatedAt());
            map.put("ride", b.getRide()); // Serialize full ride object as before

            // Enrich with Names - Smart Fallback
            User passenger = userService.findByEmail(b.getUserEmail()).orElse(null);
            String pName = (passenger != null && passenger.getName() != null) ? passenger.getName() : null;
            if (pName == null || pName.isEmpty()) {
                // Derive from email: "john.doe@gmail.com" -> "John Doe"
                pName = b.getUserEmail().split("@")[0].replaceAll("[._]", " ");
                pName = java.util.Arrays.stream(pName.split(" "))
                        .filter(word -> !word.isEmpty())
                        .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                        .collect(Collectors.joining(" "));
            }
            map.put("passengerName", pName);
            
            if (b.getRide() != null) {
                String dName = b.getRide().getDriverName();
                if (dName == null || dName.isEmpty()) {
                     String dEmail = b.getRide().getDriverEmail();
                     if (dEmail != null) {
                        dName = dEmail.split("@")[0].replaceAll("[._]", " ");
                        dName = java.util.Arrays.stream(dName.split(" "))
                                .filter(word -> !word.isEmpty())
                                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                                .collect(Collectors.joining(" "));
                     } else {
                        dName = "Driver";
                     }
                }
                map.put("driverName", dName);
                map.put("driverEmail", b.getRide().getDriverEmail());
            }

            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/analytics")
    public ResponseEntity<?> getAnalytics(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }

        List<Booking> bookings = bookingService.allBookings();
        List<Ride> rides = rideService.getAllRides();
        LocalDate today = LocalDate.now();

        // 1. User Distribution
        List<User> users = userService.allUsers();
        Map<String, Long> userDist = users.stream()
            .collect(Collectors.groupingBy(u -> u.getRole() == null ? "UNKNOWN" : u.getRole().replace("ROLE_", ""), Collectors.counting()));
        
        // 2. Booking Status
        Map<String, Long> bookingStatus = new HashMap<>();
        // Calculate Expired Rides (OPEN + Past Date)
        long expiredRides = rides.stream()
            .filter(r -> r.getStatus() != null && "OPEN".equalsIgnoreCase(r.getStatus().trim()))
            .filter(r -> {
                String dStr = r.getDate();
                if (dStr == null || dStr.trim().isEmpty()) return false;
                dStr = dStr.trim();
                
                // Try multiple formats
                List<String> patterns = Arrays.asList(
                    "yyyy-MM-dd", 
                    "d/M/yyyy", 
                    "dd-MM-yyyy",
                    "yyyy/MM/dd",
                    "MM/dd/yyyy",
                    "dd/MM/yyyy"
                );
                
                for (String p : patterns) {
                    try {
                        LocalDate d;
                        if (p.equals("yyyy-MM-dd")) {
                             d = LocalDate.parse(dStr);
                        } else {
                             d = LocalDate.parse(dStr, DateTimeFormatter.ofPattern(p));
                        }
                        return d.isBefore(today);
                    } catch (Exception e) {
                        // continue to next pattern
                    }
                }
                
                // Fallback: try JS style timestamp or other? Unlikely for Date string
                System.err.println("Debug: Could not parse date for expired check: " + dStr);
                return false;
            })
            .count();

        bookingStatus.put("CONFIRMED", bookings.stream().filter(b -> List.of("ACCEPTED", "PAID", "COMPLETED", "DRIVER_COMPLETED").contains(b.getStatus())).count());
        bookingStatus.put("PENDING", bookings.stream().filter(b -> List.of("PENDING", "CASH_PAYMENT_PENDING", "PAYMENT_PENDING").contains(b.getStatus())).count());
        // Manual adjust (+10) for past data as requested
        bookingStatus.put("EXPIRED", bookings.stream().filter(b -> "EXPIRED".equals(b.getStatus())).count() + expiredRides + 10);
        bookingStatus.put("COMPLETED", bookings.stream().filter(b -> "COMPLETED".equals(b.getStatus())).count());

        // 3. Financials & Metrics
        double totalRevenue = bookings.stream()
            .filter(b -> List.of("ACCEPTED", "PAID", "COMPLETED", "DRIVER_COMPLETED").contains(b.getStatus()))
            .mapToDouble(b -> b.getTotalPrice() != null ? b.getTotalPrice() : 0.0)
            .sum();

        double avgSeats = rides.stream()
            .mapToInt(Ride::getTickets)
            .average()
            .orElse(0.0);

        // 4. Popular Destinations
        Map<String, Long> destinations = rides.stream()
            .filter(r -> r.getToLocation() != null)
            .collect(Collectors.groupingBy(r -> r.getToLocation().trim().toLowerCase(), Collectors.counting())); // Case insensitive grouping

        System.out.println("DEBUG: All Destinations (Count): " + destinations);

        List<Map<String, Object>> popularDestinations = destinations.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .map(e -> {
                 Map<String, Object> m = new HashMap<>();
                 m.put("name", e.getKey().substring(0, 1).toUpperCase() + e.getKey().substring(1)); // Capitalize display
                 m.put("count", e.getValue());
                 // Calculate percentage
                 m.put("percentage", String.format("%.1f%%", (e.getValue() * 100.0) / Math.max(rides.size(), 1)));
                 return m;
            })
            .collect(Collectors.toList());

        // 5. Ride Activity (Last 30 Days)
        Map<String, Long> activityMap = new LinkedHashMap<>();
        // Initialize last 30 days with 0
        for (int i = 29; i >= 0; i--) {
            activityMap.put(today.minusDays(i).format(DateTimeFormatter.ofPattern("MMM dd")), 0L);
        }
        
        // Populate actuals
        rides.forEach(r -> {
            if (r.getCreatedAt() != null) {
                LocalDate date = java.time.LocalDate.ofInstant(r.getCreatedAt(), java.time.ZoneId.systemDefault());
                if (!date.isBefore(today.minusDays(29))) {
                    String key = date.format(DateTimeFormatter.ofPattern("MMM dd"));
                    activityMap.put(key, activityMap.getOrDefault(key, 0L) + 1);
                }
            }
        });

        // Convert activity map to parallel lists for Chart.js
        List<String> activityLabels = new ArrayList<>(activityMap.keySet());
        List<Long> activityData = new ArrayList<>(activityMap.values());

        // 6. Cancellation Reasons
        Map<String, Long> cancelReasons = bookings.stream()
            .filter(b -> "CANCELLED".equals(b.getStatus()))
            .collect(Collectors.groupingBy(b -> b.getCancellationReason() == null ? "Not specified" : b.getCancellationReason(), Collectors.counting()));

        // 7. Revenue Trends (All Time - Daily)
        // Group by "YYYY-MM-dd"
        Map<String, Double> dailyRevenue = new TreeMap<>(); // Sort by date
        bookings.stream()
             .filter(b -> List.of("COMPLETED", "PAID", "ACCEPTED", "DRIVER_COMPLETED").contains(b.getStatus()))
             .forEach(b -> {
                  if (b.getCreatedAt() != null && b.getTotalPrice() != null) {
                      LocalDate date = java.time.LocalDate.ofInstant(b.getCreatedAt(), java.time.ZoneId.systemDefault());
                      String key = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
                      dailyRevenue.put(key, dailyRevenue.getOrDefault(key, 0.0) + b.getTotalPrice());
                  }
             });

        return ResponseEntity.ok(Map.of(
            "userDistribution", userDist,
            "bookingStatus", bookingStatus,
            "popularDestinations", popularDestinations,
            "rideActivity", Map.of("labels", activityLabels, "data", activityData),
            "totalRevenue", totalRevenue, // Keeping it in API, removing from Frontend as requested
            "avgSeatsPerRide", String.format("%.1f", avgSeats),
            "cancellationReasons", cancelReasons,
            "revenueTrends", dailyRevenue
        ));
    }

    @GetMapping("/reports/download")
    public ResponseEntity<byte[]> downloadReport(Authentication auth) {
        if (auth == null || !auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).build();
        }
        try {
            byte[] pdfBytes = reportService.generateAdminReport();
            
            return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=admin_report.pdf")
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(pdfBytes);
        } catch (java.io.IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
