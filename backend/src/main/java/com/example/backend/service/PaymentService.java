package com.example.backend.service;

import com.example.backend.model.Payment;
import com.example.backend.model.Booking;
import com.example.backend.repository.PaymentRepository;
import com.example.backend.repository.BookingRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository, BookingRepository bookingRepository, NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.notificationService = notificationService;
    }

    public Payment logPaymentIntent(Long bookingId, String userEmail, Double amount, String stripePaymentIntentId) {
        Payment p = new Payment();
        p.setBookingId(bookingId);
        p.setUserEmail(userEmail);
        p.setAmount(amount);
        p.setStripePaymentIntentId(stripePaymentIntentId);
        p.setStatus("PENDING");
        return paymentRepository.save(p);
    }

    public Payment logCashPayment(Long bookingId, String userEmail, Double amount) {
        Payment p = new Payment();
        p.setBookingId(bookingId);
        p.setUserEmail(userEmail);
        p.setAmount(amount);
        p.setStatus("CONFIRMED"); // Cash is considered confirmed if the driver accepts
        p.setStripePaymentIntentId("CASH_" + System.currentTimeMillis());
        Payment saved = paymentRepository.save(p);
        sendPaymentSuccessNotifications(saved);
        return saved;
    }

    public Payment confirmPayment(String stripePaymentIntentId, String stripePaymentMethodId) {
        Payment p = paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId);
        if (p != null) {
            p.setStripePaymentMethodId(stripePaymentMethodId);
            p.setStatus("CONFIRMED");
            Payment saved = paymentRepository.save(p);
            
            // CRITICAL: Also update the Booking status to CONFIRMED
            Booking b = bookingRepository.findById(p.getBookingId()).orElse(null);
            if (b != null && !"CONFIRMED".equalsIgnoreCase(b.getStatus())) {
                b.setStatus("CONFIRMED");
                bookingRepository.save(b);
            }
            
            // Send notifications (Passes booking detail internally)
            sendPaymentSuccessNotifications(saved);
            
            return saved;
        }
        return null;
    }


    public List<Payment> getMyHistory(String email) {
        return paymentRepository.findByUserEmail(email);
    }

    public List<Payment> getDriverHistory(String email) {
        return paymentRepository.findByDriverEmail(email);
    }

    public Payment getPaymentByBookingId(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    private void sendPaymentSuccessNotifications(Payment payment) {
        try {
            // Get booking details
            Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
            if (booking == null) return;

            // Notify passenger (Specialized method handles both DB and Email)
            notificationService.sendPaymentSuccess(payment.getUserEmail(), payment.getAmount(), booking.getSeats());

            // Notify driver (Standard in-app notification)
            if (booking.getVehicle() != null && booking.getVehicle().getDriverEmail() != null) {
                String driverMsg = String.format("Payment received! %s paid ₹%.2f for %d seat(s).", 
                    payment.getUserEmail(), payment.getAmount(), booking.getSeats());
                notificationService.send(booking.getVehicle().getDriverEmail(), driverMsg);
            }
        } catch (Exception e) {
            // Log error but don't fail the payment
            System.err.println("Failed to send payment notifications: " + e.getMessage());
        }
    }
}
