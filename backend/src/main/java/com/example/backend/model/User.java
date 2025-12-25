package com.example.backend.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "app_users")
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String role; // "user", "admin", "pending-admin"

    private boolean superAdmin = false;
    private boolean requestedAdmin = false;
    private String gender; // "Male", "Female", "Other"
    private String profileImage; // URL or Base64
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean active = true;

    private Instant createdAt = Instant.now();

    public User() {}

    // getters/setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public boolean isSuperAdmin() { return superAdmin; }
    public void setSuperAdmin(boolean superAdmin) { this.superAdmin = superAdmin; }
    public boolean isRequestedAdmin() { return requestedAdmin; }
    public void setRequestedAdmin(boolean requestedAdmin) { this.requestedAdmin = requestedAdmin; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getProfileImage() { return profileImage; }
    public void setProfileImage(String profileImage) { this.profileImage = profileImage; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
