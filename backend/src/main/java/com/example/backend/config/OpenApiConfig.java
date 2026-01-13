package com.example.backend.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI rideshareOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("Smart Ride Sharing System API")
                        .description("API documentation for the Ride Sharing Platform. Handles Users, Rides, Bookings, and Payments.")
                        .version("v1.0.0")
                        .contact(new Contact().name("Development Team").email("intern@infosys.com")));
    }
}
