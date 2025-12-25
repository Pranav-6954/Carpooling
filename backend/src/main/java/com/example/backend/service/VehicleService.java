package com.example.backend.service;

import com.example.backend.model.Vehicle;
import com.example.backend.model.Booking;
import com.example.backend.repository.VehicleRepository;
import com.example.backend.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VehicleService {
    private final VehicleRepository repo;
    private final UserService userService;
    private final BookingService bookingService;
    private final GoogleMapsService googleMapsService;
    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;

    public VehicleService(VehicleRepository repo, UserService userService, BookingService bookingService,
            GoogleMapsService googleMapsService, NotificationService notificationService, BookingRepository bookingRepository) {
        this.repo = repo;
        this.userService = userService;
        this.bookingService = bookingService;
        this.googleMapsService = googleMapsService;
        this.notificationService = notificationService;
        this.bookingRepository = bookingRepository;
    }

    public Vehicle create(Vehicle v) {
        return repo.save(v);
    }

    /**
     * Creation logic for a Driver posting a ride.
     * Handles setting driver info and creating auto-reservations.
     */
    public Vehicle createPost(Vehicle v, String userEmail) {
        // 1. Fetch User
        com.example.backend.model.User u = userService.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found: " + userEmail));

        // 2. Set Driver Details
        v.setDriverEmail(u.getEmail());
        v.setDriverName(u.getName());
        v.setDriverImage(u.getProfileImage());
        // driverPhone is passed from frontend
        // Logic: Request Body phone >> User Profile phone (if available)
        // User model currently doesn't have phone, so we rely on input
        // v.getDriverPhone()
        if (v.getDriverPhone() == null || v.getDriverPhone().isEmpty()) {
            // Future: fallback to u.getPhone() if added to User model
        }

        // 2b. Calculate Dynamic Fare (if price is 0 or auto-calc requested)
        if (v.getPrice() <= 0 && v.getFromLocation() != null && v.getToLocation() != null) {
            long distanceMeters = googleMapsService.getDistanceInMeters(v.getFromLocation(), v.getToLocation());
            double distanceKm = distanceMeters / 1000.0;
            double baseFare = 50.0;
            double ratePerKm = 10.0;
            double totalFare = baseFare + (ratePerKm * distanceKm);

            // Per seat pricing logic
            // If calculating total cost for the trip, we might divide by seats.
            // Usually ride share price is "per seat".
            // Let's assume the calculated fare is for the whole trip, and we divide by
            // total capacity to get per-seat price?
            // OR the ratePerKm is already "per passenger km"?
            // Let's stick to the plan: (Base + Rate*Dist) / Seats
            int capacity = v.getTickets() > 0 ? v.getTickets() : 1; // avoid div/0
            double pricePerSeat = totalFare / capacity;

            // Round to 2 decimals
            pricePerSeat = Math.round(pricePerSeat * 100.0) / 100.0;

            v.setPrice(pricePerSeat);
        }

        // 3. Save Vehicle
        Vehicle saved = repo.save(v);

        // 4. Handle Reservation (if driver reserves seats for themselves/friends)
        if (v.getReservedSeats() > 0) {
            try {
                com.example.backend.model.Booking b = new com.example.backend.model.Booking();
                b.setUserEmail(u.getEmail());
                b.setVehicle(saved);
                b.setSeats(v.getReservedSeats());
                b.setStatus("PENDING");
                b.setPassengers(java.util.List.of(
                        new com.example.backend.model.Passenger("Driver Reserved", 0, "N/A")));
                bookingService.createBooking(b);
            } catch (Exception ex) {
                // Log but don't fail the whole creation?
                // For now print trace, ideally use SLF4J
                System.err.println("Failed to auto-reserve seats: " + ex.getMessage());
            }
        }
        return saved;
    }

    public List<Vehicle> list() {
        return repo.findAll();
    }

    public Optional<Vehicle> findById(Long id) {
        return repo.findById(id);
    }

    public void delete(Long id) {
        try {
            // Get vehicle details before deletion
            Optional<Vehicle> vehicleOpt = repo.findById(id);
            if (vehicleOpt.isPresent()) {
                Vehicle vehicle = vehicleOpt.get();
                
                // Find all bookings for this vehicle
                List<Booking> bookings = bookingRepository.findAll().stream()
                    .filter(b -> b.getVehicle() != null && b.getVehicle().getId().equals(id))
                    .toList();
                
                // Notify all passengers
                for (Booking booking : bookings) {
                    try {
                        notificationService.sendRideCancellation(
                            booking.getUserEmail(), 
                            vehicle.getFromLocation(), 
                            vehicle.getToLocation(), 
                            vehicle.getDate()
                        );
                    } catch (Exception e) {
                        System.err.println("Failed to notify passenger: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error during ride deletion notification: " + e.getMessage());
        }
        
        // Delete the vehicle
        repo.deleteById(id);
    }

    public List<Vehicle> searchVehicles(String from, String to, String date) {
        List<Vehicle> candidates = repo.searchVehicles(from, to);
        
        return candidates.stream().filter(v -> {
            // 1. Filter by Date if provided
            if (date != null && !date.isEmpty()) {
                if (!v.getDate().equals(date)) return false;
            }

            // 2. Filter by Direction: fromLocation must appear BEFORE toLocation in the route
            String route = v.getRoute();
            if (route == null || route.isEmpty()) return true; // Fallback if no route string

            // Normalized lower case for comparison
            String routeLower = route.toLowerCase();
            String fromLower = from.toLowerCase();
            String toLower = to.toLowerCase();

            int fromIndex = routeLower.indexOf(fromLower);
            int toIndex = routeLower.indexOf(toLower);

            // If strict containment was handled by DB, we just check order here.
            // If DB matched 'from' in 'fromLocation' field, index might be -1 in route, 
            // so we should consider 'fromLocation' as index 0 conceptually?
            
            // Better Robust Logic:
            // 1. Determine "Effective Index" of Start
            int effectiveStartIndex = -1;
            if (v.getFromLocation().toLowerCase().contains(fromLower)) {
                effectiveStartIndex = 0; // Starts at source
            } else if (fromIndex != -1) {
                effectiveStartIndex = fromIndex; // Starts at intermediate stop
            }

            // 2. Determine "Effective Index" of End
            int effectiveEndIndex = -1;
            if (v.getToLocation().toLowerCase().contains(toLower)) {
                effectiveEndIndex = Integer.MAX_VALUE; // Ends at destination
            } else if (toIndex != -1) {
                effectiveEndIndex = toIndex; // Ends at intermediate stop
            }

            // 3. Valid if Start comes before End
            return effectiveStartIndex != -1 && effectiveEndIndex != -1 && effectiveStartIndex < effectiveEndIndex;
        }).toList();
    }

    public Vehicle save(Vehicle v) {
        return repo.save(v);
    }

    public List<Vehicle> getAllVehicles() {
        return list();
    }
}
