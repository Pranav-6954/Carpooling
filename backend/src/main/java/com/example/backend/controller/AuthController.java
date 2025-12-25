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
    public ResponseEntity<?> register(@RequestBody Map<String, Object> body) {
        System.out.println("Registration attempt for: " + body.get("email"));
        try {
            String name = (String) body.get("name");
            String email = (String) body.get("email");
            String password = (String) body.get("password");
            String role = (String) body.getOrDefault("role", "user");
            String gender = (String) body.getOrDefault("gender", "Other");

            User u = new User();
            u.setName(name);
            u.setEmail(email);
            u.setPassword(password);
            u.setRole(role);

            u.setGender(gender);
            u.setProfileImage((String) body.getOrDefault("profileImage", ""));

            User saved = userService.register(u);
            return ResponseEntity
                    .ok(Map.of("message", "Registered", "email", saved.getEmail(), "role", saved.getRole()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        System.out.println("Login attempt for: " + body.get("email"));
        try {
            String email = body.get("email");
            String password = body.get("password");
            String token = userService.login(email, password);
            User u = userService.findByEmail(email).orElseThrow();
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "email", u.getEmail(),
                    "role", u.getRole(),
                    "name", u.getName(),
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
                "profileImage", u.getProfileImage() != null ? u.getProfileImage() : "")))
                .orElseGet(() -> ResponseEntity.status(404).body(Map.of("error", "User not found")));
    }
}
