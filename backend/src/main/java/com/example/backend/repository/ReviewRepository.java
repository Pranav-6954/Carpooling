package com.example.backend.repository;

import com.example.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByRevieweeEmail(String revieweeEmail);
    List<Review> findByReviewerEmail(String reviewerEmail);
    List<Review> findByBookingId(Long bookingId);
}
