package com.example.backend.controller;

import com.example.backend.service.FareService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/fare")
public class FareController {

    private final FareService fareService;

    public FareController(FareService fareService) {
        this.fareService = fareService;
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculate(@RequestBody Map<String, String> request) {
        String from = request.get("fromLocation");
        String to = request.get("toLocation");

        if (from == null || to == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "fromLocation and toLocation are required"));
        }

        String via = request.get("viaRoute"); // Optional

        try {
            return ResponseEntity.ok(fareService.calculateFare(from, to, via));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
