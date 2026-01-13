package com.example.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RideControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testSearchRides() throws Exception {
        // This test ensures the Application Context loads and the endpoint is reachable
        mockMvc.perform(get("/api/rides/search")
                .param("from", "New York")
                .param("to", "Boston")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }
}
