package com.example.backend.repository;

import com.example.backend.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByDriverEmail(String driverEmail);

    @Query("SELECT v FROM Vehicle v WHERE " +
            "(LOWER(v.fromLocation) LIKE LOWER(CONCAT('%', :from, '%')) OR LOWER(v.route) LIKE LOWER(CONCAT('%', :from, '%'))) AND "
            +
            "(LOWER(v.toLocation) LIKE LOWER(CONCAT('%', :to, '%')) OR LOWER(v.route) LIKE LOWER(CONCAT('%', :to, '%')))")
    List<Vehicle> searchVehicles(@Param("from") String from, @Param("to") String to);
}
