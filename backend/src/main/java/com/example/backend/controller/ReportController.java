package com.example.backend.controller;

import com.example.backend.model.Report;
import com.example.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @PostMapping("/reports")
    public ResponseEntity<?> createReport(@RequestBody Report report, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        report.setReporterEmail(auth.getName());
        return ResponseEntity.ok(reportService.createReport(report));
    }

    @GetMapping("/admin/reports")
    public ResponseEntity<?> getAllReports(Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @PostMapping("/admin/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(@PathVariable Long id, Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        
        Report r = reportService.getReportById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        
        r.setStatus("RESOLVED");
        return ResponseEntity.ok(reportService.updateReport(r));
    }
    
    @PostMapping("/admin/reports/{id}/dismiss")
    public ResponseEntity<?> dismissReport(@PathVariable Long id, Authentication auth) {
        if (auth == null || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin required"));
        }
        
        Report r = reportService.getReportById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();
        
        r.setStatus("DISMISSED");
        return ResponseEntity.ok(reportService.updateReport(r));
    }
}
