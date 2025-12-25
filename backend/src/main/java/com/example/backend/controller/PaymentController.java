package com.example.backend.controller;

import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private final com.example.backend.service.PaymentService paymentService;

    public PaymentController(com.example.backend.service.PaymentService paymentService,
            @org.springframework.beans.factory.annotation.Value("${stripe.api.key}") String stripeApiKey) {
        this.paymentService = paymentService;
        Stripe.apiKey = stripeApiKey;
    }

    @PostMapping("/create-payment-intent")
    public Map<String, String> createPaymentIntent(@RequestBody Map<String, Object> data,
            org.springframework.security.core.Authentication auth) throws StripeException {
        System.out.println("PaymentController: Request received to create intent. Data: " + data);
        
        double amountDouble = 100.0;
        try {
            Object amtObj = data.get("amount");
            if (amtObj != null) {
                amountDouble = Double.parseDouble(amtObj.toString());
            }
        } catch (NumberFormatException e) {
            System.err.println("Invalid amount received: " + data.get("amount"));
        }

        if (amountDouble < 1.0) amountDouble = 1.0; 
        
        long amountInPaise = Math.round(amountDouble * 100.0);

        Long bookingId = data.containsKey("bookingId") ? Long.parseLong(data.get("bookingId").toString()) : null;
        String userEmail = (auth != null) ? auth.getName() : "anonymous";
        System.out.println("PaymentController: Creating intent for Email: " + userEmail + ", Amount: " + amountDouble
                + ", BookingId: " + bookingId);

        System.out.println("PaymentController: Amount in Paise: " + amountInPaise);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInPaise)
                .setCurrency("inr")
                .setDescription("Ride Booking #" + bookingId)
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        // PERSISTENCE: Log the intent in our database
        paymentService.logPaymentIntent(bookingId, userEmail, amountDouble, paymentIntent.getId());

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", paymentIntent.getClientSecret());

        return response;
    }

    @PostMapping("/confirm")
    public Map<String, Object> confirmPayment(@RequestBody Map<String, String> data) {
        String intentId = data.get("paymentIntentId");
        String methodId = data.get("paymentMethodId");

        com.example.backend.model.Payment p = paymentService.confirmPayment(intentId, methodId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", p != null);
        if (p != null)
            response.put("paymentId", p.getId());

        return response;
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<?> getPaymentByBookingId(@PathVariable Long bookingId) {
        com.example.backend.model.Payment p = paymentService.getPaymentByBookingId(bookingId);
        if (p == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Payment not found"));
        }
        return ResponseEntity.ok(p);
    }
}
