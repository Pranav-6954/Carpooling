package com.example.backend.service;

import com.example.backend.model.Ride;
import com.example.backend.model.User;
import com.example.backend.repository.RideRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RideServiceTest {

    @Mock
    private RideRepository rideRepository;

    @Mock
    private UserService userService;
    
    @Mock
    private BookingService bookingService;
    
    @Mock
    private GoogleMapsService googleMapsService;

    @InjectMocks
    private RideService rideService;

    private Ride ride;
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setName("Test Driver");
        user.setPhone("1234567890");

        ride = new Ride();
        ride.setFromLocation("New York");
        ride.setToLocation("Boston");
        ride.setDate("2023-10-10");
        ride.setTickets(3);
    }

    @Test
    void testCreatePost_Success() {
        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(rideRepository.save(any(Ride.class))).thenReturn(ride);

        Ride createdRide = rideService.createPost(ride, "test@example.com");

        assertNotNull(createdRide);
        assertEquals("test@example.com", ride.getDriverEmail());
        assertEquals("Test Driver", ride.getDriverName());
        verify(rideRepository, times(1)).save(ride);
    }

    @Test
    void testSearchRides() {
        when(rideRepository.searchRides("New York", "Boston")).thenReturn(Collections.singletonList(ride));

        List<Ride> results = rideService.searchRides("New York", "Boston");

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("New York", results.get(0).getFromLocation());
    }
}
