package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reviewerEmail; // Who wrote the review
    private String revieweeEmail; // Who is being reviewed
    private Long bookingId;       // Link to specific ride

    private Integer rating;       // 1-5
    private String comment;
    
    private LocalDateTime createdAt = LocalDateTime.now();

    public Review() {}

    public Review(String reviewerEmail, String revieweeEmail, Long bookingId, Integer rating, String comment) {
        this.reviewerEmail = reviewerEmail;
        this.revieweeEmail = revieweeEmail;
        this.bookingId = bookingId;
        this.rating = rating;
        this.comment = comment;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getReviewerEmail() { return reviewerEmail; }
    public void setReviewerEmail(String reviewerEmail) { this.reviewerEmail = reviewerEmail; }

    public String getRevieweeEmail() { return revieweeEmail; }
    public void setRevieweeEmail(String revieweeEmail) { this.revieweeEmail = revieweeEmail; }

    public Long getBookingId() { return bookingId; }
    public void setBookingId(Long bookingId) { this.bookingId = bookingId; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
