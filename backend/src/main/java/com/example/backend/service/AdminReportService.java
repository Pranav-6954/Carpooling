package com.example.backend.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.example.backend.model.Booking;
import com.example.backend.model.Ride;
import com.example.backend.model.User;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class AdminReportService {

    private final BookingService bookingService;
    private final RideService rideService;
    private final UserService userService;

    public AdminReportService(BookingService bookingService, RideService rideService, UserService userService) {
        this.bookingService = bookingService;
        this.rideService = rideService;
        this.userService = userService;
    }

    public byte[] generateAdminReport() throws IOException {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);

            document.open();

            // 1. Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("Carpooling System - Admin Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // 2. Summary Statistics
            List<Booking> bookings = bookingService.allBookings();
            List<Ride> rides = rideService.getAllRides();
            List<User> users = userService.allUsers();

            double totalEarnings = bookings.stream()
                .filter(b -> "COMPLETED".equals(b.getStatus()) || "PAID".equals(b.getStatus()) || "ACCEPTED".equals(b.getStatus()))
                .mapToDouble(b -> safeDouble(b.getTotalPrice())) // Null check logic
                .sum();

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setSpacingAfter(20);

            addHeaderCell(summaryTable, "Metric");
            addHeaderCell(summaryTable, "Value");

            addRow(summaryTable, "Total Users", String.valueOf(users.size()));
            addRow(summaryTable, "Total Rides Posted", String.valueOf(rides.size()));
            addRow(summaryTable, "Total Bookings", String.valueOf(bookings.size()));
            addRow(summaryTable, "Total Earnings", String.format("%.2f", totalEarnings));

            document.add(summaryTable);

            // 3. Recent Bookings Table
            Paragraph subTitle = new Paragraph("Recent Bookings", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14));
            subTitle.setSpacingAfter(10);
            document.add(subTitle);

            PdfPTable bookingTable = new PdfPTable(5);
            bookingTable.setWidthPercentage(100);
            bookingTable.setWidths(new float[] { 1, 3, 3, 2, 2 });

            addHeaderCell(bookingTable, "ID");
            addHeaderCell(bookingTable, "Passenger");
            addHeaderCell(bookingTable, "Route");
            addHeaderCell(bookingTable, "Status");
            addHeaderCell(bookingTable, "Price");

            // Show last 50 bookings
            bookings.stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .limit(50)
                .forEach(b -> {
                    String route = "N/A";
                    if(b.getRide() != null) {
                         route = safeString(b.getRide().getFromLocation()) + " -> " + safeString(b.getRide().getToLocation());
                    } else if (b.getPickupLocation() != null) {
                         route = safeString(b.getPickupLocation()) + " -> " + safeString(b.getDropoffLocation());
                    }

                    addRow(bookingTable, 
                        String.valueOf(b.getId()), 
                        safeString(b.getUserEmail()), 
                        route,
                        safeString(b.getStatus()), 
                        String.format("%.2f", safeDouble(b.getTotalPrice()))
                    );
                });

            document.add(bookingTable);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IOException("Error creating PDF", e);
        }
    }

    // Helper to add table header
    private void addHeaderCell(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD)));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setBackgroundColor(java.awt.Color.LIGHT_GRAY);
        cell.setPadding(5);
        table.addCell(cell);
    }

    // Helper to add table row
    private void addRow(PdfPTable table, String... values) {
        for (String value : values) {
            PdfPCell cell = new PdfPCell(new Phrase(value != null ? value : "-"));
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    // Requirement: if any numerical value does not found instead null it should be only 0
    private double safeDouble(Double val) {
        return val != null ? val : 0.0;
    }

    private String safeString(String val) {
        return val != null ? val : "";
    }
}
