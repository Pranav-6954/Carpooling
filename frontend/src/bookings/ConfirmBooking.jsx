import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { verifyJWT, apiFetch } from "../utils/jwt";
import { useToast } from "../common/ToastContainer";

const ConfirmBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = verifyJWT(token);

  const bookingData = location.state?.bookingData || null;
  const [offerPrice, setOfferPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("STRIPE"); // STRIPE or CASH
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (!user || user.role !== "ROLE_USER") {
      navigate("/login");
      return;
    }
    if (!bookingData) {
      navigate("/user-rides");
      return;
    }
    if (bookingData) {
      const initialPrice = bookingData.totalPrice || (Number(bookingData.bus.price || 0) * Number(bookingData.seats || 0));
      setOfferPrice(initialPrice);
    }
  }, [bookingData, navigate, user]);

  if (!bookingData || !bookingData.bus) {
    return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}><h3>Awaiting booking session...</h3></div>;
  }

  const { bus, seats, passengerNames } = bookingData;
  const standardTotal = Number(bus.price) * Number(seats || 0);

  const handlePayment = async () => {
    setSubmitting(true);
    try {
      if (offerPrice <= 0) {
        showToast("Price must be greater than 0", 'error');
        setSubmitting(false);
        return;
      }

      const bookingBody = {
        rideId: bus.id,
        seats: Number(seats),
        pickupLocation: bookingData.pickup || bus.fromLocation,
        dropoffLocation: bookingData.dropoff || bus.toLocation,
        totalPrice: Number(offerPrice),
        paymentMethod: paymentMethod,
        passengers: passengerNames.map(name => ({ name, age: 30, gender: 'Other' }))
      };

      const bookingRes = await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify(bookingBody)
      });

      if (paymentMethod === "CASH") {
        navigate("/booking-success", { state: { booking: bookingRes, message: "Request sent to Driver. Please wait for approval." } });
      } else {
        // For Stripe too, we now wait for approval first.
        navigate("/booking-success", { state: { booking: bookingRes, message: "Request sent. Payment will be unlocked after the ride." } });
      }

    } catch (err) {
      showToast("Process Failed: " + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem', maxWidth: '700px' }}>
      <div className="animate-slide-up" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Review & Confirm</h1>
        <p style={{ color: 'var(--text-muted)' }}>One last look before we secure your journey</p>
      </div>

      <div className="card glass animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '2rem', background: 'rgba(var(--primary-rgb), 0.03)', borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: '1rem', opacity: 0.6 }}>Journey Summary</h4>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{bus.fromLocation} → {bus.toLocation}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Scheduled for {bus.date}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2rem' }}>
              <div style={{ fontWeight: 700 }}>{seats} Seats</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{passengerNames.length} Passenger(s)</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <h4 style={{ marginBottom: '1.5rem', opacity: 0.6 }}>Financial Negotiation</h4>
          <div className="card" style={{ background: 'var(--neutral-50)', padding: '1.5rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontWeight: 600 }}>Standard Fare Total</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Based on base price ₹{bus.price}</div>
              </div>
              <div style={{ textDecoration: 'line-through', opacity: 0.5 }}>₹{standardTotal}</div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Fair Offer</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>Negotiated Segment Price</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'white', padding: '0.5rem 1rem', borderRadius: '12px', border: '2px solid var(--primary)' }}>
                  <span style={{ fontWeight: 900, color: 'var(--primary)' }}>₹</span>
                  <input
                    type="number"
                    className="input"
                    style={{ width: '100px', border: 'none', padding: 0, margin: 0, fontWeight: 900, fontSize: '1.25rem', color: 'var(--primary)' }}
                    value={offerPrice}
                    min="1"
                    onChange={e => setOfferPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* New Itemized Breakdown logic for Option A */}
              <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Base Ride Fare</span>
                  <span>₹{(offerPrice / 1.07).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST (5%)</span>
                  <span>₹{(offerPrice / 1.07 * 0.05).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Platform Fee (2%)</span>
                  <span>₹{(offerPrice / 1.07 * 0.02).toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem', background: 'rgba(var(--primary-rgb), 0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                  <span>Total Payable</span>
                  <span>₹{offerPrice.toFixed(2)}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                * Drivers are more likely to accept offers close to the segment price.
              </p>
            </div>
          </div>

          <h4 style={{ margin: '2rem 0 1rem', opacity: 0.6 }}>Transaction Method</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className={`card glass`}
              onClick={() => setPaymentMethod('STRIPE')}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '2px solid',
                borderColor: paymentMethod === 'STRIPE' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                background: paymentMethod === 'STRIPE' ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.02)',
                position: 'relative',
                transform: paymentMethod === 'STRIPE' ? 'translateY(-4px)' : 'none',
                boxShadow: paymentMethod === 'STRIPE' ? '0 10px 25px -5px rgba(var(--primary-rgb), 0.2)' : 'none'
              }}>
              {paymentMethod === 'STRIPE' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--primary)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>✓</div>
              )}
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💳</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Digital Gateway</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.4 }}>Instant confirmation via Stripe Secure</div>
            </div>

            <div className={`card glass`}
              onClick={() => setPaymentMethod('CASH')}
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                border: '2px solid',
                borderColor: paymentMethod === 'CASH' ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                background: paymentMethod === 'CASH' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.02)',
                position: 'relative',
                transform: paymentMethod === 'CASH' ? 'translateY(-4px)' : 'none',
                boxShadow: paymentMethod === 'CASH' ? '0 10px 25px -5px rgba(34, 197, 94, 0.2)' : 'none'
              }}>
              {paymentMethod === 'CASH' && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--success)', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 900 }}>✓</div>
              )}
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💵</div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Cash on Arrival</div>
              <div style={{ fontSize: '0.8rem', opacity: 0.7, lineHeight: 1.4 }}>Pay the driver directly at pickup</div>
            </div>
          </div>

          <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => navigate(-1)}>Back</button>
            <button className="btn btn-primary" style={{ flex: 2, padding: '1rem' }} onClick={handlePayment} disabled={submitting}>
              {submitting ? "Processing..." : paymentMethod === 'STRIPE' ? "Request Ride (Pay After Trip)" : "Request Ride (Pay Cash)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBooking;
