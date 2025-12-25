package com.example.backend.service;

import com.example.backend.model.Review;
import com.example.backend.model.Booking;
import com.example.backend.repository.ReviewRepository;
import com.example.backend.repository.BookingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public ReviewService(ReviewRepository reviewRepository, BookingRepository bookingRepository, NotificationService notificationService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    public Review createReview(Review review, String reviewerEmail) {
        // Set the reviewer email from authenticated user
        review.setReviewerEmail(reviewerEmail);
        
        // Validate booking
        Booking booking = bookingRepository.findById(review.getBookingId()).orElse(null);
        if (booking == null) {
            throw new RuntimeException("Invalid Booking ID");
        }

        // Save review
        Review saved = reviewRepository.save(review);

        // Send notification to the reviewee
        try {
            String revieweeEmail = review.getRevieweeEmail();
            if (revieweeEmail != null && !revieweeEmail.isEmpty()) {
                String stars = "⭐".repeat(Math.min(review.getRating(), 5));
                String msg = String.format("New review received! %s rated you %s (%d/5)", 
                    reviewerEmail, stars, review.getRating());
                
                if (review.getComment() != null && !review.getComment().isEmpty()) {
                    msg += " - \"" + review.getComment() + "\"";
                }
                
                notificationService.send(revieweeEmail, msg);
            }
        } catch (Exception e) {
            // Log error but don't fail the review creation
            System.err.println("Failed to send review notification: " + e.getMessage());
        }

        return saved;
    }

    public List<Review> getReviewsForUser(String email) {
        return reviewRepository.findByRevieweeEmail(email);
    }

    public List<Review> getReviewsByUser(String email) {
        return reviewRepository.findByReviewerEmail(email);
    }
}
