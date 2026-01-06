import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { formatBookingId } from "../utils/formatters";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <div className="container" style={{ paddingTop: '6rem', paddingBottom: '5rem', maxWidth: '600px' }}>
      <div className="card glass animate-slide-up" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'var(--success)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 2rem',
          fontSize: '3rem',
          color: 'white',
          boxShadow: '0 10px 30px rgba(var(--success-rgb), 0.3)'
        }}>
          ✓
        </div>

        <h1 style={{ marginBottom: '1rem' }}>Booking Confirmed!</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
          Your journey has been successfully logged. {booking ? `Booking Reference: ${formatBookingId(booking)}` : "The driver has been notified of your reservation."}
        </p>

        {booking && (
          <div style={{ background: 'rgba(var(--primary-rgb), 0.05)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>Next Destination</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{booking.pickupLocation} → {booking.dropoffLocation}</div>
          </div>
        )}

        {location.state?.transactionId && (
          <div style={{ marginBottom: "2.5rem", padding: "1rem", background: "rgba(34, 197, 94, 0.1)", borderRadius: "8px", border: "1px solid rgba(34, 197, 94, 0.2)" }}>
            <div style={{ fontSize: "0.8rem", color: "var(--success)", fontWeight: "600", marginBottom: "0.2rem" }}>TRANSACTION ID</div>
            <div style={{ fontFamily: "monospace", fontSize: "1.1rem", color: "var(--text)" }}>{location.state.transactionId}</div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate("/my-bookings")}>View My Bookings</button>
          <button className="btn btn-outline" onClick={() => navigate("/user-rides")}>Plan Another Trip</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
