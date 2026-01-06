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
        Stripe.setConnectTimeout(10000); // 10s connect timeout
        Stripe.setReadTimeout(10000);    // 10s read timeout
    }

    @PostMapping("/create-payment-intent")
    public Map<String, String> createPaymentIntent(@RequestBody Map<String, Object> data,
            org.springframework.security.core.Authentication auth) throws StripeException {
        System.out.println("PaymentController: Request received to create intent. Data: " + data);
        Integer amountINR = Integer.parseInt(data.getOrDefault("amount", 100).toString());
        if (amountINR < 1)
            amountINR = 1; // Stripe minimum is ~₹0.50, but let's be safe

        Long bookingId = data.containsKey("bookingId") ? Long.parseLong(data.get("bookingId").toString()) : null;
        String userEmail = (auth != null) ? auth.getName() : "anonymous";
        System.out.println("PaymentController: Creating intent for Email: " + userEmail + ", Amount: " + amountINR
                + ", BookingId: " + bookingId);

        long amountInPaise = amountINR * 100L;
        System.out.println("PaymentController: Amount in Paise: " + amountInPaise);

        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountInPaise)
                .setCurrency("inr")
                .setDescription("Ride Booking Payment")
                .setAutomaticPaymentMethods(
                        PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                .setEnabled(true)
                                .build())
                .build();

        PaymentIntent paymentIntent = PaymentIntent.create(params);

        // PERSISTENCE: Log the intent in our database
        paymentService.logPaymentIntent(bookingId, userEmail, (double) amountINR, paymentIntent.getId());

        Map<String, String> response = new HashMap<>();
        response.put("clientSecret", paymentIntent.getClientSecret());

        return response;
    }


    @PostMapping("/simulate")
    public ResponseEntity<?> simulatePayment(@RequestBody Map<String, Object> data, org.springframework.security.core.Authentication auth) {
        Long bookingId = data.containsKey("bookingId") ? Long.parseLong(data.get("bookingId").toString()) : null;
        Double amount = Double.parseDouble(data.getOrDefault("amount", 0.0).toString());
        String userEmail = (auth != null) ? auth.getName() : "anonymous";
        
        com.example.backend.model.Booking b = paymentService.simulatePayment(bookingId, userEmail, amount);
        return ResponseEntity.ok(Map.of("success", true, "booking", b));
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

    @GetMapping("/driver-history")
    public java.util.List<com.example.backend.model.Payment> getDriverHistory(org.springframework.security.core.Authentication auth) {
        if (auth == null) return java.util.List.of();
        return paymentService.getDriverHistory(auth.getName());
    }
}
