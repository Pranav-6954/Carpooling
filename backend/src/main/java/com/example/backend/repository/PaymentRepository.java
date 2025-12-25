package com.example.backend.repository;

import com.example.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByUserEmail(String userEmail);

    Payment findByStripePaymentIntentId(String stripePaymentIntentId);

    Payment findByBookingId(Long bookingId);

    @Query("SELECT p FROM Payment p WHERE p.bookingId IN (SELECT b.id FROM Booking b JOIN b.vehicle v WHERE v.driverEmail = :email)")
    List<Payment> findByDriverEmail(@Param("email") String email);
}
