package com.example.backend.repository;

import com.example.backend.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserEmailOrderByCreatedAtDesc(String email);
}
