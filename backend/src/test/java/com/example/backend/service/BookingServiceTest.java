package com.example.backend.service;

import com.example.backend.model.Booking;
import com.example.backend.model.Ride;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.RideRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Optional;
import java.util.List;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private RideRepository rideRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private EmailService emailService;

    @Mock
    private GoogleMapsService googleMapsService;

    @InjectMocks
    private BookingService bookingService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void createBooking_Success() {
        Booking booking = new Booking();
        booking.setSeats(2);
        Ride ride = new Ride();
        ride.setId(1L);
        ride.setTickets(5); // Available seats
        booking.setRide(ride);

        when(rideRepository.findById(1L)).thenReturn(Optional.of(ride));
        when(bookingRepository.save(any(Booking.class))).thenReturn(booking);

        Booking created = bookingService.createBooking(booking);

        assertNotNull(created);
        verify(rideRepository, times(1)).save(ride); // Seats should be updated
        verify(bookingRepository, times(1)).save(booking);
    }

    @Test
    void createBooking_NotEnoughSeats() {
        Booking booking = new Booking();
        booking.setSeats(5);
        Ride ride = new Ride();
        ride.setId(1L);
        ride.setTickets(2); // Only 2 available
        booking.setRide(ride);

        when(rideRepository.findById(1L)).thenReturn(Optional.of(ride));

        assertThrows(RuntimeException.class, () -> bookingService.createBooking(booking));
    }

    @Test
    void allBookings_ReturnsList() {
        when(bookingRepository.findAll()).thenReturn(new ArrayList<>());
        List<Booking> bookings = bookingService.allBookings();
        assertNotNull(bookings);
        verify(bookingRepository, times(1)).findAll();
    }
}
