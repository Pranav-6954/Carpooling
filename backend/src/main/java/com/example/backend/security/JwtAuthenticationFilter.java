package com.example.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.Claims;

import java.io.IOException;
import java.util.Base64;
import java.util.Map;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final ObjectMapper mapper = new ObjectMapper();

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        String token = authHeader.substring(7);
        try {
            String email = null;
            String role = null;
            if (token.contains(".")) {
                Claims claims = jwtUtil.extractClaims(token);
                email = claims.getSubject();
                role = claims.get("role", String.class);
            } else {
                try {
                    byte[] decoded = Base64.getDecoder().decode(token);
                    Map<?, ?> obj = mapper.readValue(decoded, Map.class);
                    Object userObj = obj.get("user");
                    if (userObj instanceof Map) {
                        Map<?, ?> userMap = (Map<?, ?>) userObj;
                        if (userMap.get("email") != null)
                            email = userMap.get("email").toString();
                        if (userMap.get("role") != null)
                            role = userMap.get("role").toString();
                    }
                } catch (Exception ex) {
                    throw ex;
                }
            }
            if (email != null && role != null) {
                List<SimpleGrantedAuthority> auths = List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(email, null, auths);
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                SecurityContextHolder.clearContext();
            }
        } catch (Exception ex) {
            System.err.println("JWT Verification Failed: " + ex.getMessage());
            ex.printStackTrace();
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }
}
