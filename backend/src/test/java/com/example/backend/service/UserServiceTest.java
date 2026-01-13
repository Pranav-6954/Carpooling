package com.example.backend.service;

import com.example.backend.model.User;
import com.example.backend.repository.UserRepository;
import com.example.backend.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BCryptPasswordEncoder encoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@example.com");
        user.setPassword("password");
        user.setRole("USER");
    }

    @Test
    void testRegister_Success() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(encoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);

        User registeredUser = userService.register(user);

        assertNotNull(registeredUser);
        assertEquals("ROLE_USER", user.getRole());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testLogin_Success() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(encoder.matches("password", "password")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), anyBoolean(), anyBoolean())).thenReturn("mockToken");

        String token = userService.login("user@example.com", "password");

        assertNotNull(token);
        assertEquals("mockToken", token);
    }

    @Test
    void testLogin_InvalidPassword() {
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(encoder.matches("wrongPassword", "password")).thenReturn(false);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            userService.login("user@example.com", "wrongPassword");
        });

        assertEquals("Invalid credentials", exception.getMessage());
    }
}
