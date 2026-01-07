package com.example.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendEmail(String to, String subject, String content) {
        if (mailSender == null) {
            System.out.println("❌ Mail Sender not configured. Skipping email to " + to);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(content);
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email: " + e.getMessage());
        }
    }

    public void sendRideConfirmationEmail(String to, com.example.backend.model.Ride ride, com.example.backend.model.User driver, com.example.backend.model.Booking booking) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hello ").append(to.split("@")[0]).append(",\n\n");
        sb.append("Good news! Your ride request has been ACCEPTED by the driver.\n\n");
        sb.append("🔹 RIDE DETAILS:\n");
        sb.append("   • From: ").append(ride.getFromLocation()).append("\n");
        sb.append("   • To:   ").append(ride.getToLocation()).append("\n");
        sb.append("   • Date: ").append(ride.getDate()).append("\n");
        sb.append("   • Time: ").append(formatTo12Hour(ride.getTime())).append("\n\n");
        sb.append("🔹 DRIVER INFO:\n");
        sb.append("   • Name:  ").append(driver != null ? driver.getName() : ride.getDriverName()).append("\n");
        sb.append("   • Phone: ").append(driver != null ? driver.getPhone() : ride.getDriverPhone()).append("\n");
        sb.append("   • Car:   ").append(driver != null ? driver.getCarModel() : ride.getVehicleType()).append("\n\n");
        sb.append("🔹 PAYMENT:\n");
        sb.append("   • Cost:  ₹").append(booking.getTotalPrice()).append("\n");
        sb.append("   • Status: ").append(booking.getPaymentStatus()).append("\n\n");
        sb.append("Safe travels!\n");
        sb.append("- RideShare Team");

        String subject = "Ride Confirmed! 🚗 Route: " + ride.getFromLocation() + " -> " + ride.getToLocation();
        
        // Use the existing sendEmail method which handles the actual sending
        sendEmail(to, subject, sb.toString());
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (mailSender == null) return;
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // true for HTML
            mailSender.send(message);
            System.out.println("✅ HTML Email sent successfully to " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send HTML email: " + e.getMessage());
        }
    }

    public void sendPaymentReceivedEmail(String to, com.example.backend.model.Booking booking) {
        String invoiceNo = "INV-" + java.time.Year.now().getValue() + "-" + String.format("%06d", booking.getId());
        String date = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy"));
        String amount = String.format("%.2f", booking.getTotalPrice());

        StringBuilder html = new StringBuilder();
        html.append("<html>");
        html.append("<body style='font-family: Arial, sans-serif; color: #333;'>");
        html.append("<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;'>");
        html.append("    <div style='border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px;'>");
        html.append("        <h1 style='color: #2563eb; margin: 0;'>RideShare</h1>");
        html.append("        <p style='margin: 5px 0 0; color: #666;'>Passenger Invoice</p>");
        html.append("    </div>");
        
        html.append("    <table style='width: 100%; margin-bottom: 20px;'>");
        html.append("        <tr>");
        html.append("            <td>");
        html.append("                <strong>Bill To:</strong><br/>");
        html.append("                ").append(to.split("@")[0]).append("<br/>");
        html.append("                ").append(to);
        html.append("            </td>");
        html.append("            <td style='text-align: right;'>");
        html.append("                <strong>Invoice No:</strong> ").append(invoiceNo).append("<br/>");
        html.append("                <strong>Date:</strong> ").append(date).append("<br/>");
        html.append("                <strong>Status:</strong> <span style='color: #22c55e;'>PAID</span>");
        html.append("            </td>");
        html.append("        </tr>");
        html.append("    </table>");

        html.append("    <table style='width: 100%; border-collapse: collapse; margin-bottom: 20px;'>");
        html.append("        <tr style='background-color: #f8fafc; color: #1e293b;'>");
        html.append("            <th style='text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0;'>Description</th>");
        html.append("            <th style='text-align: left; padding: 12px; border-bottom: 1px solid #e2e8f0;'>Details</th>");
        html.append("        </tr>");
        html.append("        <tr>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>Source</td>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>").append(booking.getPickupLocation()).append("</td>");
        html.append("        </tr>");
        html.append("        <tr>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>Destination</td>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>").append(booking.getDropoffLocation()).append("</td>");
        html.append("        </tr>");
        html.append("        <tr>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>Payment Method</td>");
        String pMethod = booking.getPaymentMethod();
        if (pMethod == null) pMethod = "N/A";
        else if (pMethod.toUpperCase().contains("STRIPE") || pMethod.toUpperCase().contains("ONLINE")) pMethod = "Online (Stripe)";
        else if (pMethod.toUpperCase().contains("CASH")) pMethod = "Cash";
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>").append(pMethod).append("</td>");
        html.append("        </tr>");
        html.append("        <tr>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>Seats</td>");
        html.append("            <td style='padding: 12px; border-bottom: 1px solid #eee;'>").append(booking.getSeats()).append("</td>");
        html.append("        </tr>");
        html.append("    </table>");

        html.append("    <div style='border-top: 2px solid #eee; padding-top: 15px;'>");
        html.append("        <div style='display: flex; justify-content: space-between; font-weight: bold; font-size: 1.1em;'>");
        html.append("            <span>Total Paid</span>");
        html.append("            <span>Rs. ").append(amount).append("</span>");
        html.append("        </div>");
        html.append("    </div>");

        html.append("    <div style='margin-top: 30px; padding-top: 20px; border-top: 1px dashed #ccc; text-align: center; color: #888; font-size: 0.9em;'>");
        html.append("        <p>Thank you for choosing RideShare! Safe travels.</p>");
        html.append("        <p>- RideShare Team</p>");
        html.append("    </div>");
        html.append("</div>");
        html.append("</body></html>");

        String subject = "Payment Receipt: Rs. " + amount;
        sendHtmlEmail(to, subject, html.toString());
    }

    private String formatTo12Hour(String time) {
        if (time == null || time.isEmpty()) return "N/A";
        try {
            // Check if already in 12-hour format
            if (time.toUpperCase().contains("AM") || time.toUpperCase().contains("PM")) {
                return time;
            }
            
            // Handle 24-hour format (e.g., "19:00" or "19:00:00")
            java.time.LocalTime localTime = java.time.LocalTime.parse(time.split(":")[0].length() == 1 ? "0" + time : time, 
                java.time.format.DateTimeFormatter.ofPattern(time.contains(":") && time.split(":").length > 2 ? "HH:mm:ss" : "HH:mm"));
            
            return localTime.format(java.time.format.DateTimeFormatter.ofPattern("h.mm a")).toUpperCase().replace(" ", "");
        } catch (Exception e) {
            System.err.println("Error formatting time: " + time + " - " + e.getMessage());
            return time; // Return original if parsing fails
        }
    }
}
