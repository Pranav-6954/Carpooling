package com.example.backend.service;

import com.example.backend.model.Payment;
import com.example.backend.model.Booking;
import com.example.backend.repository.PaymentRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;
    private final NotificationService notificationService;

    public PaymentService(PaymentRepository paymentRepository, BookingService bookingService, NotificationService notificationService) {
        this.paymentRepository = paymentRepository;
        this.bookingService = bookingService;
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

    public Payment confirmPayment(String stripePaymentIntentId, String stripePaymentMethodId) {
        Payment p = paymentRepository.findByStripePaymentIntentId(stripePaymentIntentId);
        if (p != null) {
            p.setStripePaymentMethodId(stripePaymentMethodId);
            p.setStatus("CONFIRMED");
            Payment saved = paymentRepository.save(p);

            // Update Booking Status
            if (p.getBookingId() != null) {
                Booking b = bookingService.findById(p.getBookingId()).orElse(null);
                if (b != null) {
                    b.setPaymentStatus("PAID");
                    b.setStatus("COMPLETED"); 
                    b.setTransactionId(stripePaymentIntentId); // Save Real Transaction ID
                    bookingService.updateBooking(b);

                    // Notify Driver
                    if (b.getRide() != null) {
                        notificationService.createNotification(
                            b.getRide().getDriverEmail(), 
                            "Passenger Done the Payment: ₹" + b.getTotalPrice() + " from " + b.getUserEmail(), 
                            "PAYMENT_RECEIVED"
                        );
                    }

                    // Notify Passenger (Explicitly)
                    notificationService.createNotification(
                        b.getUserEmail(), 
                        "Payment Successful! Your ride to " + b.getDropoffLocation() + " is CONFIRMED.", 
                        "PAYMENT_CONFIRMED"
                    );
                }
            }
            return saved;
        }
        return null;
    }


    public com.example.backend.model.Booking simulatePayment(Long bookingId, String userEmail, Double amount) {
        // Create Mock Payment
        Payment p = new Payment();
        p.setBookingId(bookingId);
        p.setUserEmail(userEmail);
        p.setAmount(amount);
        p.setStripePaymentIntentId("SIMULATED_INTENT_" + System.currentTimeMillis());
        p.setStripePaymentMethodId("SIMULATED_METHOD");
        p.setStatus("CONFIRMED");
        paymentRepository.save(p);

        // Update Booking
        if (bookingId != null) {
            Booking b = bookingService.findById(bookingId).orElse(null);
            if (b != null) {
                b.setPaymentStatus("PAID");
                b.setStatus("COMPLETED");
                b.setTransactionId(p.getStripePaymentIntentId()); // Save Simulated Transaction ID
                bookingService.updateBooking(b);

                // Notify Driver
                if (b.getRide() != null) {
                    notificationService.createNotification(
                        b.getRide().getDriverEmail(), 
                        "Simulated Payment Received: ₹" + b.getTotalPrice() + " from " + b.getUserEmail(), 
                        "PAYMENT_RECEIVED"
                    );
                }

                // Notify Passenger (Explicitly)
                notificationService.createNotification(
                    b.getUserEmail(), 
                    "Payment Successful! Your ride to " + b.getDropoffLocation() + " is CONFIRMED.", 
                    "PAYMENT_CONFIRMED"
                );
                return b;
            }
        }
        return null;
    }

    public List<Payment> getMyHistory(String email) {
        return paymentRepository.findByUserEmail(email);
    }

    public List<Payment> getDriverHistory(String email) {
        return paymentRepository.findByDriverEmail(email);
    }
}
