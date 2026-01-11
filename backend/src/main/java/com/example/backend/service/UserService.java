package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    private final UserRepository repo;
    private final BCryptPasswordEncoder encoder;
    private final JwtUtil jwtUtil;

    public UserService(UserRepository repo, BCryptPasswordEncoder encoder, JwtUtil jwtUtil) {
        this.repo = repo;
        this.encoder = encoder;
        this.jwtUtil = jwtUtil;
    }

    public User register(User u) {
        if (repo.findByEmail(u.getEmail()).isPresent())
            throw new RuntimeException("User exists");

        String role = u.getRole();
        if (role == null || role.isEmpty()) {
            u.setRole("ROLE_USER");
        } else if (!role.startsWith("ROLE_")) {
            u.setRole("ROLE_" + role.toUpperCase());
        }

        boolean anyAdmin = repo.existsByRole("ROLE_ADMIN") || repo.existsByRole("admin");

        if ("ROLE_ADMIN".equals(u.getRole())) {
            if (!anyAdmin) {
                u.setRole("ROLE_ADMIN");
                u.setSuperAdmin(true);
            } else {
                u.setRole("ROLE_PENDING-ADMIN");
                u.setRequestedAdmin(true);
            }
        }

        u.setPassword(encoder.encode(u.getPassword()));
        return repo.save(u);
    }

    public String login(String email, String rawPassword) {
        User u = repo.findByEmail(email).orElseThrow(() -> new RuntimeException("Invalid credentials"));
        if (!encoder.matches(rawPassword, u.getPassword()))
            throw new RuntimeException("Invalid credentials");
        if ("ROLE_PENDING-ADMIN".equals(u.getRole()))
            throw new RuntimeException("Admin approval pending");
        return jwtUtil.generateToken(u.getEmail(), u.getRole(), u.isSuperAdmin(), u.isVerified() != null && u.isVerified());
    }

    public Optional<User> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    public List<User> allUsers() {
        return repo.findAll();
    }

    public Optional<User> findById(Long id) {
        return repo.findById(id);
    }

    public User save(User u) {
        return repo.save(u);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}
