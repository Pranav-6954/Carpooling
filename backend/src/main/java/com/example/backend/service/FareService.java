package com.example.backend.service;

import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class FareService {

    private final GoogleMapsService googleMapsService;

    // Constants (Ideally configurable)
    private static final double BASE_FARE = 50.0;
    private static final double RATE_PER_KM = 2.0;

    public FareService(GoogleMapsService googleMapsService) {
        this.googleMapsService = googleMapsService;
    }

    public Map<String, Object> calculateFare(String from, String to) {
        return calculateFare(from, to, null);
    }

    public Map<String, Object> calculateFare(String from, String to, String via) {
        long distMeters = googleMapsService.getDistanceInMeters(from, to, via);
        double distKm = distMeters / 1000.0;

        // Get suggested route string
        java.util.List<String> majorCities = googleMapsService.identifyMajorCities(from, to);
        String suggestedRoute = String.join(" -> ", majorCities);

        if (via != null && !via.isEmpty()) {
            suggestedRoute = via; // Override if user manually edited
            // Also attempt to split back into list for frontend consistency if needed,
            // but for now relying on the string representation for display in the chip
            // editor is fine,
            // or we can overwrite majorCities list.
            majorCities = java.util.Arrays.asList(via.split(" -> "));
        }

        double calculatedPrice = BASE_FARE + (RATE_PER_KM * distKm);

        // Round to 2 decimals
        calculatedPrice = Math.round(calculatedPrice * 100.0) / 100.0;

        return Map.of(
                "distanceKm", distKm,
                "recommendedPrice", calculatedPrice,
                "suggestedRoute", suggestedRoute,
                "waypoints", majorCities);
    }

    public double calculateSegmentPrice(double fullRoutePrice, double fullDistanceKm, String routeString,
            String userFrom, String userTo) {
        // 1. If full match, return full price
        if (routeString == null || routeString.isEmpty())
            return fullRoutePrice;

        // 2. Parse Route to find indices
        // Assumes routeString is "Start -> Stop1 -> Stop2 -> End"
        String[] stops = routeString.split(" -> ");
        java.util.List<String> stopList = java.util.Arrays.asList(stops);

        int startIndex = -1;
        int endIndex = -1;

        // Simple fuzzy match for names
        for (int i = 0; i < stopList.size(); i++) {
            if (stopList.get(i).toLowerCase().contains(userFrom.toLowerCase()))
                startIndex = i;
            if (stopList.get(i).toLowerCase().contains(userTo.toLowerCase()))
                endIndex = i;
        }

        if (startIndex == -1 || endIndex == -1 || startIndex >= endIndex) {
            // Fallback: If points not found in clean route, assume full price or handle
            // error.
            // For now, return full price to be safe, or maybe 75% if we know it's a partial
            // match from search.
            return fullRoutePrice;
        }

        // 3. Proportional Pricing
        // In reality, distances between stops vary.
        // Heuristic: Each segment (hop) is roughly equal for this demo, OR we use the
        // indexes.
        int totalHops = stops.length - 1;
        int userHops = endIndex - startIndex;

        if (totalHops <= 0)
            return fullRoutePrice;

        double fraction = (double) userHops / totalHops;
        double estimatedPrice = fullRoutePrice * fraction;

        // Ensure minimum fare (e.g., 20% of full price)
        return Math.max(estimatedPrice, fullRoutePrice * 0.2);
    }
}
