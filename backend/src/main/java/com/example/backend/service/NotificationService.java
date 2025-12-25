package com.example.backend.service;

import com.example.backend.model.Notification;
import com.example.backend.repository.NotificationRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository repo;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;

    public NotificationService(NotificationRepository repo, SimpMessagingTemplate messagingTemplate, EmailService emailService) {
        this.repo = repo;
        this.messagingTemplate = messagingTemplate;
        this.emailService = emailService;
    }

    public void send(String recipientEmail, String message) {
        // 1. Save to DB
        Notification n = new Notification(recipientEmail, message);
        repo.save(n);

        // 2. Push Real-time
        // Topic convention: /topic/notifications/{email}
        if(messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + recipientEmail, message);
        }
    }

    public List<Notification> getMyNotifications(String email) {
        return repo.findByRecipientEmailOrderByCreatedAtDesc(email);
    }

    public void markAsRead(Long id) {
        repo.findById(id).ifPresent(n -> {
            n.setRead(true);
            repo.save(n);
        });
    }

    // Phase 3: Email specialized methods
    public void sendBookingConfirmation(String to, String passengerName, String from, String toLoc, String date) {
        send(to, "Booking Confirmed! Ride from " + from + " to " + toLoc + " on " + date);
        emailService.sendBookingConfirmation(to, passengerName, from, toLoc, date);
    }

    public void sendPaymentSuccess(String to, double amount, int seats) {
        send(to, "Payment Successful! Amount: ₹" + amount + " for " + seats + " seats.");
        emailService.sendPaymentSuccess(to, amount, seats);
    }

    public void sendRideCancellation(String to, String from, String toLoc, String date) {
        send(to, "Ride Cancelled! The ride from " + from + " to " + toLoc + " on " + date + " has been cancelled.");
        emailService.sendRideCancellation(to, from, toLoc, date);
    }
}
