package com.example.backend.controller;

import com.example.backend.model.Vehicle;
import com.example.backend.service.VehicleService;

import com.example.backend.service.FareService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService service;
    private final FareService fareService;

    public VehicleController(VehicleService service, FareService fareService) {
        this.service = service;
        this.fareService = fareService;
    }

    @GetMapping
    public List<Vehicle> list() {
        return service.list();
    }

    @GetMapping("/search")
    public List<Vehicle> search(@RequestParam(required = false, defaultValue = "") String from,
            @RequestParam(required = false, defaultValue = "") String to,
            @RequestParam(required = false, defaultValue = "") String date) {
        return service.searchVehicles(from, to, date);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Vehicle v, Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        boolean isAdmin = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isDriver = auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_DRIVER"));

        if (!isAdmin && !isDriver) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin or Driver required"));
        }

        // We no longer strictly block creation based on price to ensure "smooth" UX.
        // The recommendation is handled as a warning in the frontend.

        try {
            Vehicle saved = service.createPost(v, auth.getName());
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id, Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        service.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted"));
    }

    @GetMapping("/driver-posts")
    public ResponseEntity<?> getDriverVehicles(Authentication auth) {
        if (auth == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));

        List<Vehicle> all = service.list();
        List<Vehicle> myVehicles = all.stream()
                .filter(v -> auth.getName().equals(v.getDriverEmail()))
                .toList();
        return ResponseEntity.ok(myVehicles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        Optional<Vehicle> opt = service.findById(id);
        if (opt.isPresent())
            return ResponseEntity.ok(opt.get());
        else
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Vehicle v, Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        Optional<Vehicle> existing = service.findById(id);
        if (existing.isEmpty())
            return ResponseEntity.status(404).body(Map.of("error", "Not found"));

        Vehicle db = existing.get();
        // Update fields...
        if (v.getFromLocation() != null)
            db.setFromLocation(v.getFromLocation());
        if (v.getToLocation() != null)
            db.setToLocation(v.getToLocation());
        if (v.getDate() != null)
            db.setDate(v.getDate());

        // We no longer strictly block updates based on price for "smooth" UX.

        if (v.getPrice() > 0)
            db.setPrice(v.getPrice());
        if (v.getTickets() >= 0)
            db.setTickets(v.getTickets());
        if (v.getVehicleType() != null)
            db.setVehicleType(v.getVehicleType());
        if (v.getImageUrl() != null)
            db.setImageUrl(v.getImageUrl());
        if (v.getRoute() != null)
            db.setRoute(v.getRoute());

        Vehicle saved = service.create(db);
        return ResponseEntity.ok(saved);
    }
}
