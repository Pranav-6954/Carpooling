package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody com.example.backend.dto.RegisterRequest request) {
        System.out.println("Registration attempt for: " + request.getEmail());
        try {
            User u = new User();
            u.setName(request.getName());
            u.setEmail(request.getEmail());
            u.setPassword(request.getPassword());
            u.setRole(request.getRole() != null ? request.getRole() : "ROLE_USER");
            u.setGender(request.getGender() != null ? request.getGender() : "Other");
            u.setProfileImage(request.getProfileImage() != null ? request.getProfileImage() : "");
            u.setPhone(request.getPhone());

            // Driver details
            u.setCarModel(request.getCarModel());
            u.setLicensePlate(request.getLicensePlate());
            if (request.getCapacity() != null) {
                u.setCapacity(request.getCapacity());
            }

            User saved = userService.register(u);
            return ResponseEntity
                    .ok(Map.of("message", "Registered", "email", saved.getEmail(), "role", saved.getRole()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody com.example.backend.dto.LoginRequest request) {
        System.out.println("Login attempt for: " + request.getEmail());
        try {
            String token = userService.login(request.getEmail(), request.getPassword());
            User u = userService.findByEmail(request.getEmail()).orElseThrow();
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "email", u.getEmail(),
                    "role", u.getRole(),
                    "name", u.getName(),
                    "verified", u.isVerified() != null && u.isVerified(),
                    "profileImage", u.getProfileImage() != null ? u.getProfileImage() : ""));
        } catch (Exception ex) {
            return ResponseEntity.status(401).body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        String email = principal.getName();
        Optional<User> userOpt = userService.findByEmail(email);
        return userOpt.map(u -> ResponseEntity.ok(Map.of(
                "email", u.getEmail(),
                "name", u.getName(),
                "role", u.getRole(),
                "superAdmin", u.isSuperAdmin(),
                "verified", u.isVerified() != null && u.isVerified(),
                "profileImage", u.getProfileImage() != null ? u.getProfileImage() : "",
                "phone", u.getPhone() != null ? u.getPhone() : "",
                "carModel", u.getCarModel() != null ? u.getCarModel() : "",
                "licensePlate", u.getLicensePlate() != null ? u.getLicensePlate() : "",
                "capacity", u.getCapacity() != null ? u.getCapacity() : 0)))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }
}
