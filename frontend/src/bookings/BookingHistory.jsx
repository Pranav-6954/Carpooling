import React, { useEffect, useState } from "react";
import { apiFetch, verifyJWT, getToken } from "../utils/jwt";
import Pagination from "../common/Pagination";
import { useNavigate } from "react-router-dom";
import { useToast } from "../common/ToastContainer";
import ReceiptModal from "./ReceiptModal";

const BookingHistory = () => {
  const nav = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null); // id of booking being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const { showToast } = useToast();
  const [receiptBooking, setReceiptBooking] = useState(null);

  const fetchBookings = () => {
    setLoading(true);
    // Fetch all bookings and filter client-side for now
    apiFetch("/api/bookings/me")
      .then(data => {
        if (!Array.isArray(data)) {
          setBookings([]);
          return;
        }
        // Keep only history statuses
        const history = data.filter(b =>
          ["COMPLETED", "PAID", "REJECTED", "CANCELLED", "DRIVER_COMPLETED"].includes(b.status)
        );
        setBookings(history);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const b = bookings.find(x => x.id === reviewing);
      await apiFetch("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          revieweeEmail: b.ride.driverEmail,
          rating,
          comment,
          ride: { id: b.ride.id }
        })
      });
      showToast("Thank you for your review!", 'success');
      setReviewing(null);
      setComment("");
      setRating(5);
    } catch (err) {
      showToast(err.message || "Failed to submit review", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading your history...</div>;

  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div className="animate-slide-up" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Booking History</h1>
          <p style={{ color: 'var(--text-muted)' }}>Your past rides and cancellations</p>
        </div>
        <button className="btn btn-outline" onClick={() => nav('/my-reviews')}>View My Feedback</button>
      </div>

      {bookings.length === 0 ? (
        <div className="card glass animate-slide-up" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📜</div>
          <h3>No history found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>You haven't completed any rides yet.</p>
          <button className="btn btn-primary" onClick={() => nav('/user-rides')}>Find a Ride</button>
        </div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {paginatedBookings.map((b, idx) => {
              return (
                <div key={b.id} className="card glass animate-slide-up" style={{ padding: '1.5rem', animationDelay: `${idx * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className={`badge badge-${(b.status === 'ACCEPTED' || b.status === "PAID" || b.status === "COMPLETED") ? 'success' : b.status === 'PENDING' ? 'warning' : 'danger'}`}>
                          {b.status === 'COMPLETED' ? "Ride Complete & Payment Done" : b.status.replace('_', ' ')}
                        </span>
                        <span className="badge" style={{ background: 'var(--neutral-100)' }}>Past Journey</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', boxShadow: '0 0 0 2px var(--primary)' }}></div>
                          <div style={{ width: '2px', height: '40px', background: 'var(--border)' }}></div>
                          <div style={{ width: '12px', height: '12px', border: '2px solid var(--primary)', background: 'white' }}></div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pick up at</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.ride?.fromLocation}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Drop off at</div>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{b.ride?.toLocation}</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <div><strong>Date:</strong> {b.ride?.date}</div>
                        <div><strong>Seats:</strong> {b.seats}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Total: ₹{b.totalPrice}</div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(b.ride?.driverName || b.ride?.driverPhone) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700 }}>Driver</span>
                          {b.ride?.driverName && <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{b.ride.driverName}</span>}
                          {b.ride?.driverPhone && <span style={{ fontSize: '0.9rem' }}>{b.ride.driverPhone}</span>}
                        </div>
                      )}

                      {(b.status === 'COMPLETED' || b.status === 'PAID' || b.status === 'DRIVER_COMPLETED') && !reviewing && (
                        <button className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => setReviewing(b.id)}>
                          ⭐ Rate Driver
                        </button>
                      )}

                      {(b.status === 'COMPLETED' || b.status === 'PAID' || b.status === 'DRIVER_COMPLETED') && (
                        <button className="btn btn-outline"
                          style={{
                            marginTop: '0.5rem',
                            width: '100%',
                            fontSize: '0.9rem',
                            borderColor: 'rgba(0,0,0,0.3)',
                            color: 'var(--color-text-main)',
                            fontWeight: 600
                          }}
                          onClick={() => {
                            console.log("Opening receipt for:", b);
                            setReceiptBooking(b);
                            showToast("Opening Receipt...", "info");
                          }}>
                          📄 View Receipt
                        </button>
                      )}
                    </div>
                  </div>

                  {reviewing === b.id && (
                    <div className="animate-slide-up" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--neutral-50)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <h4 style={{ marginBottom: '1rem' }}>How was your ride with {b.ride.driverName || b.ride.driverEmail}?</h4>
                      <form onSubmit={handleReviewSubmit}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                          <button type="button" className="btn btn-outline"
                            style={{ padding: '0.4rem', minWidth: '40px', fontSize: '1.2rem' }}
                            onClick={() => setRating(Math.max(1, rating - 1))}>−</button>

                          <div style={{ display: 'flex', gap: '0.25rem', fontSize: '1.5rem' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <span key={s}
                                style={{ cursor: 'pointer', color: s <= rating ? '#fbbf24' : '#d1d5db', transition: 'all 0.2s' }}
                                onClick={() => setRating(s)}>★</span>
                            ))}
                          </div>

                          <button type="button" className="btn btn-outline"
                            style={{ padding: '0.4rem', minWidth: '40px', fontSize: '1.2rem' }}
                            onClick={() => setRating(Math.min(5, rating + 1))}>+</button>

                          <span style={{ fontWeight: 700, color: 'var(--primary)', marginLeft: '0.5rem' }}>{rating}/5 Stars</span>
                        </div>
                        <div className="input-group">
                          <textarea className="input"
                            placeholder="Share your experience (optional)"
                            rows="3"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            style={{ resize: 'none' }}></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-outline" onClick={() => setReviewing(null)}>Cancel</button>
                          <button type="submit" className="btn btn-primary" disabled={submitting}>
                            {submitting ? "Posting..." : "Submit Review"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={bookings.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      <ReceiptModal isOpen={!!receiptBooking} booking={receiptBooking} onClose={() => setReceiptBooking(null)} />
    </div>
  );
};

export default BookingHistory;
