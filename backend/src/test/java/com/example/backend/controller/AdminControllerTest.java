package com.example.backend.controller;

import com.example.backend.model.User;
import com.example.backend.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AdminControllerTest {

    @Mock
    private UserService userService;
    @Mock
    private ReviewService reviewService;
    @Mock
    private BookingService bookingService;
    @Mock
    private RideService rideService;
    @Mock
    private AdminReportService reportService;

    @Mock
    private Authentication auth;

    @InjectMocks
    private AdminController adminController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @SuppressWarnings("unchecked")
    private void mockAdminAuth() {
        Collection<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_ADMIN"));
        doReturn(authorities).when(auth).getAuthorities();
    }

    @Test
    void allUsers_AsAdmin_ReturnsUsers() {
        mockAdminAuth();
        when(userService.allUsers()).thenReturn(List.of(new User()));
        
        ResponseEntity<?> response = adminController.all(auth);
        
        assertEquals(200, response.getStatusCodeValue());
        verify(userService, times(1)).allUsers();
    }

    @Test
    void allUsers_NoAuth_Returns403() {
        ResponseEntity<?> response = adminController.all(null);
        assertEquals(403, response.getStatusCodeValue());
    }
}
