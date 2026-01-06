package com.example.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String reporterEmail;
    private String reportedUserEmail; 
    
    // Optional: link to a specific ride
    private Long rideId;

    private String reason; // "Fraud", "Harassment", "No Show", "Other"
    
    @Column(length = 1000)
    private String description;

    private String status = "OPEN"; // OPEN, RESOLVED, DISMISSED
    private Instant createdAt = Instant.now();

    public Report() {}

    public Report(String reporterEmail, String reportedUserEmail, Long rideId, String reason, String description) {
        this.reporterEmail = reporterEmail;
        this.reportedUserEmail = reportedUserEmail;
        this.rideId = rideId;
        this.reason = reason;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getReporterEmail() { return reporterEmail; }
    public void setReporterEmail(String reporterEmail) { this.reporterEmail = reporterEmail; }
    public String getReportedUserEmail() { return reportedUserEmail; }
    public void setReportedUserEmail(String reportedUserEmail) { this.reportedUserEmail = reportedUserEmail; }
    public Long getRideId() { return rideId; }
    public void setRideId(Long rideId) { this.rideId = rideId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
