package com.example.backend.service;

import com.example.backend.model.Report;
import com.example.backend.repository.ReportRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ReportService {
    private final ReportRepository reportRepository;

    public ReportService(ReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    public Report createReport(Report report) {
        return reportRepository.save(report);
    }

    public List<Report> getAllReports() {
        return reportRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<Report> getReportById(Long id) {
        return reportRepository.findById(id);
    }
    
    public Report updateReport(Report r) {
        return reportRepository.save(r);
    }
}
