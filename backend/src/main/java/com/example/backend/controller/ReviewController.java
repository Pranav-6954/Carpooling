package com.example.backend.controller;

import com.example.backend.model.Review;
import com.example.backend.service.ReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Review r, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).build();
        String currentUser = auth.getName();

        try {
            Review saved = reviewService.createReview(r, currentUser);
            return ResponseEntity.ok(saved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{email}")
    public List<Review> getUserReviews(@PathVariable String email) {
        return reviewService.getReviewsForUser(email);
    }
}
