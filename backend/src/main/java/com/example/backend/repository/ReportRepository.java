package com.example.backend.repository;

import com.example.backend.model.Report;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByStatus(String status);
    List<Report> findByReportedUserEmail(String email);
    List<Report> findAllByOrderByCreatedAtDesc();
}
