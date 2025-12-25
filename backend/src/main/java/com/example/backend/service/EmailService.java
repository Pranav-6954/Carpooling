package com.example.backend.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${spring.mail.username}")
    private String configuredUser;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String subject, String htmlContent) {
        // Skip if credentials not properly configured to avoid app crashes
        if (configuredUser == null || configuredUser.contains("YOUR_EMAIL")) {
            System.out.println("Email skipped: SMTP not configured. To: " + to + ", Subject: " + subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            System.out.println("Email sent successfully to: " + to);
        } catch (MessagingException e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // Helper to wrap content in a basic HTML template
    public String wrapInTemplate(String title, String body) {
        return "<!DOCTYPE html>" +
                "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }" +
                ".container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; }" +
                ".header { text-align: center; margin-bottom: 30px; }" +
                ".brand { font-size: 24px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px; }" +
                ".content { font-size: 16px; }" +
                ".footer { margin-top: 30px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }" +
                ".btn { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<div class='header'><div class='brand'>RIDE SHARE</div></div>" +
                "<div class='content'>" +
                "<h2>" + title + "</h2>" +
                body +
                "</div>" +
                "<div class='footer'>&copy; 2025 Ride Share. All rights reserved.</div>" +
                "</div>" +
                "</body>" +
                "</html>";
    }

    public void sendBookingConfirmation(String to, String passengerName, String from, String toLoc, String date) {
        String title = "Booking Confirmed!";
        String body = "<p>Hi " + passengerName + ",</p>" +
                "<p>Your ride booking from <strong>" + from + "</strong> to <strong>" + toLoc + "</strong> is confirmed for <strong>" + date + "</strong>.</p>" +
                "<p>Thank you for choosing Ride Share!</p>" +
                "<a href='http://localhost:5173/my-bookings' class='btn'>View My Bookings</a>";
        sendEmail(to, title, wrapInTemplate(title, body));
    }

    public void sendPaymentSuccess(String to, double amount, int seats) {
        String title = "Payment Successful";
        String body = "<p>Your payment of <strong>₹" + String.format("%.2f", amount) + "</strong> for " + seats + " seat(s) has been received.</p>" +
                "<p>Your ride is now fully confirmed and paid.</p>";
        sendEmail(to, title, wrapInTemplate(title, body));
    }

    public void sendRideReminder(String to, String from, String toLoc, String time) {
        String title = "Ride Reminder: Upcoming Trip";
        String body = "<p>Just a reminder about your trip from <strong>" + from + "</strong> to <strong>" + toLoc + "</strong> starting in less than 24 hours.</p>" +
                "<p>Please be ready at the scheduled time.</p>";
        sendEmail(to, title, wrapInTemplate(title, body));
    }

    public void sendRideCancellation(String to, String from, String toLoc, String date) {
        String title = "Important: Ride Cancelled";
        String body = "<p>We're sorry to inform you that your ride from <strong>" + from + "</strong> to <strong>" + toLoc + "</strong> on <strong>" + date + "</strong> has been cancelled by the driver.</p>" +
                "<p>The payment (if made) will be refunded automatically. Please search for an alternative ride.</p>" +
                "<a href='http://localhost:5173/user-rides' class='btn'>Find Another Ride</a>";
        sendEmail(to, title, wrapInTemplate(title, body));
    }
}
