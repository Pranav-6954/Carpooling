import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/jwt";
import Pagination from "../common/Pagination";
import { useNavigate } from "react-router-dom";
import { useToast } from "../common/ToastContainer";
import ConfirmModal from "../common/ConfirmModal";

const UserBookings = () => {
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
  const [cancelling, setCancelling] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(null); // id of booking showing breakdown

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "primary",
    confirmText: "Confirm"
  });

  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));

  const openConfirm = (title, message, onConfirm, type = "primary", confirmText = "Confirm") => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      },
      type,
      confirmText
    });
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const b = bookings.find(x => x.id === reporting);
      await apiFetch("/api/reports", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: b.ride.id,
          reportedUserEmail: b.ride.driverEmail,
          reason: reportReason,
          description: reportDesc
        })
      });
      showToast("Report submitted. We will investigate.", 'success');
      setReporting(null);
      setReportReason("");
      setReportDesc("");
    } catch (err) {
      showToast(err.message || "Failed to submit report", 'error');
    }
  };

  const handleBookingCancel = async (e) => {
    e.preventDefault();
    if (!cancelling) return;

    openConfirm(
      "Confirm Cancellation",
      "Are you sure you want to cancel this booking? This action cannot be undone.",
      async () => {
        try {
          await apiFetch(`/api/bookings/${cancelling}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason: cancelReason || "No reason provided" })
          });
          showToast("Booking cancelled", 'success');
          setCancelling(null);
          setCancelReason("");
          fetchBookings();
        } catch (err) {
          showToast(err.message || "Failed to cancel", 'error');
        }
      },
      "danger",
      "Yes, Cancel It"
    );
  };

  const fetchBookings = () => {
    setLoading(true);
    apiFetch("/api/bookings/me")
      .then(data => {
        // Keep only ACTIVE statuses
        // COMPLETED, PAID, DRIVER_COMPLETED should move to History
        const recent = data.filter(b =>
          ["PENDING", "ACCEPTED", "PAYMENT_PENDING", "CASH_PAYMENT_PENDING"].includes(b.status)
        );
        setBookings(recent);
      })
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, []);

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const rideDate = new Date(dateStr);
    const today = new Date();

    // Normalize both to midnight local time to compare purely dates
    rideDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // Handle timezone offset issues by treating the string as local date components
    // If dateStr is "2025-12-31", new Date() might parse as UTC. 
    // Safer: Parse YYYY-MM-DD manually
    const [y, m, d] = dateStr.split('-').map(Number);
    const rideLocal = new Date(y, m - 1, d); // Local midnight

    const diffTime = rideLocal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

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

  const handleConfirmDropoff = async (id) => {
    try {
      await apiFetch(`/api/bookings/${id}/confirm-dropoff`, { method: 'PUT' });
      showToast("Drop-off Confirmed!", 'success');
      fetchBookings();
    } catch (err) {
      showToast(err.message || "Failed to confirm", 'error');
    }
  };

  if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading your journeys...</div>;

  const paginatedBookings = bookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div className="animate-slide-up" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>My Recent Bookings</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage your bookings and share your experience</p>
        </div>
        <button className="btn btn-outline" onClick={() => nav('/my-reviews')}>View My Feedback</button>
      </div>

      {bookings.length === 0 ? (
        <div className="card glass animate-slide-up" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
          <h3>No journeys found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', marginLeft: 'auto', marginRight: 'auto' }}>Start your adventure by booking a ride today.</p>
          <button className="btn btn-primary" onClick={() => window.location.href = '/user-rides'}>Find a Ride</button>
        </div>
      ) : (
        <>
          <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {paginatedBookings.map((b, idx) => {
              const daysLeft = getDaysLeft(b.ride?.date);
              const isCompleted = daysLeft < 0;
              return (
                <div key={b.id} className="card glass animate-slide-up" style={{ padding: '1.5rem', animationDelay: `${idx * 0.1}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <span className={`badge badge-${(b.status === 'ACCEPTED' || b.status === "PAID" || b.status === "COMPLETED") ? 'success' : b.status === 'PENDING' ? 'warning' : b.status.includes('COMPLETED') ? 'info' : 'danger'}`}>
                          {b.status === 'COMPLETED' ? "Ride Complete & Payment Done" :
                            b.status === 'CASH_PAYMENT_PENDING' ? "Waiting for Cash Payment" :
                              b.status === 'DRIVER_COMPLETED' ? "Ride is Completed" :
                                b.status.replace('_', ' ')}
                        </span>
                        {isCompleted && b.status === 'COMPLETED' && <span className="badge" style={{ background: 'var(--neutral-100)' }}>Past Journey</span>}
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
                        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Total Paid: ₹{b.totalPrice}</div>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '0 4px', fontSize: '0.75rem', height: 'auto', color: 'var(--primary)', textDecoration: 'underline' }}
                          onClick={() => setShowBreakdown(showBreakdown === b.id ? null : b.id)}
                        >
                          {showBreakdown === b.id ? "Hide Breakdown" : "View Receipt Details"}
                        </button>
                      </div>

                      {showBreakdown === b.id && (
                        <div className="animate-slide-up" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--neutral-50)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Base Ride Fare</span>
                            <span>₹{(b.totalPrice / 1.07).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>GST (5%)</span>
                            <span>₹{(b.totalPrice / 1.07 * 0.05).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Platform Fee (2%)</span>
                            <span>₹{(b.totalPrice / 1.07 * 0.02).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                            <span>Total</span>
                            <span style={{ color: 'var(--primary)' }}>₹{b.totalPrice.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {(b.status === 'COMPLETED' || b.status === "PAID") && !reviewing && (
                        <button className="btn btn-primary" onClick={() => setReviewing(b.id)}>⭐ Rate Driver</button>
                      )}

                      {/* Cancel Button - Only if not completed/paid */}
                      {(b.status === 'PENDING' || b.status === 'ACCEPTED' || b.status === 'PAYMENT_PENDING') && !cancelling && b.ride?.status !== 'COMPLETED' && (
                        <button className="btn" style={{ background: '#fef2f2', color: '#dc2626', border: 'none', fontWeight: 600, padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={() => setCancelling(b.id)}>Cancel Booking</button>
                      )}

                      {/* Stripe Payment Button - UPDATED for Real-time Payment on Accept */}
                      {((b.status === 'ACCEPTED' || b.status === 'PAYMENT_PENDING' || b.status === 'DRIVER_COMPLETED') && b.paymentMethod !== 'CASH') && (
                        <button className="btn btn-primary" onClick={() => nav('/payment', { state: { amount: b.totalPrice, bookingId: b.id } })}>
                          💳 Pay ₹{b.totalPrice}
                        </button>
                      )}
                      {(b.status === 'REJECTED') && (
                        <button className="btn btn-outline" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setReviewing(b.id)}>Report Issue</button>
                      )}

                      {/* Cash Payment Instruction */}
                      {(b.status === 'CASH_PAYMENT_PENDING' || (b.status === 'DRIVER_COMPLETED' && b.paymentMethod === 'CASH')) && (
                        <div style={{ padding: '0.5rem', border: '1px dashed var(--warning)', borderRadius: '8px', color: 'var(--warning)', fontSize: '0.9rem', textAlign: 'center' }}>
                          ⏳ Please pay cash to Driver. Waiting for Driver confirmation.
                        </div>
                      )}

                      {(b.ride?.driverName || b.ride?.driverPhone) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 700 }}>Driver</span>
                          {b.ride?.driverName && <span style={{ fontWeight: 600, fontSize: '1.05rem' }}>{b.ride.driverName}</span>}
                          {b.ride?.driverPhone && <span style={{ fontSize: '0.9rem' }}>{b.ride.driverPhone}</span>}
                        </div>
                      )}
                      {!isCompleted && daysLeft !== null && (
                        <div style={{ fontSize: '0.85rem', color: daysLeft <= 1 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                          {daysLeft === 0 ? "Leaving Today!" : `${daysLeft} days to go`}
                        </div>
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

                  {cancelling === b.id && (
                    <div className="animate-slide-up" style={{ marginTop: '2rem', padding: '1.5rem', background: '#fef2f2', borderRadius: '16px', border: '1px solid var(--danger)' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Cancel Booking?</h4>
                      <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Please tell us why you are cancelling. This helps us improve.</p>
                      <form onSubmit={handleBookingCancel}>
                        <div className="input-group">
                          <select
                            className="input"
                            value={cancelReason}
                            onChange={e => setCancelReason(e.target.value)}
                            required
                          >
                            <option value="">Select a reason...</option>
                            <option value="Changed plans">Changed my plans</option>
                            <option value="Found another ride">Found another ride</option>
                            <option value="Driver requested cancel">Driver asked to cancel</option>
                            <option value="Long wait time">Wait time too long</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {cancelReason === 'Other' && (
                          <div className="input-group">
                            <input
                              className="input"
                              placeholder="Specific reason..."
                              type="text"
                              onChange={e => setCancelReason(e.target.value)}
                            />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-outline" onClick={() => { setCancelling(null); setCancelReason(""); }}>Keep Booking</button>
                          <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            Confirm Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Report Form */}
                  {reporting === b.id && (
                    <div className="animate-slide-up" style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff1f2', borderRadius: '16px', border: '1px solid var(--danger)' }}>
                      <h4 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Report an Issue</h4>
                      <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Please describe the issue with this ride/driver.</p>
                      <form onSubmit={handleReportSubmit}>
                        <div className="input-group">
                          <select className="input" required value={reportReason} onChange={e => setReportReason(e.target.value)}>
                            <option value="">Select a reason...</option>
                            <option value="No Show">Driver didn't show up</option>
                            <option value="Rash Driving">Rash Driving / Safety</option>
                            <option value="Harassment">Harassment / Behavior</option>
                            <option value="Vehicle Mismatch">Vehicle didn't match</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <textarea className="input" rows="3" placeholder="Describe what happened..." required value={reportDesc} onChange={e => setReportDesc(e.target.value)}></textarea>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-outline" onClick={() => setReporting(null)}>Cancel</button>
                          <button type="submit" className="btn btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }}>Submit Report</button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Report Button (available for most statuses) */}
                  {!reviewing && !cancelling && !reporting && (
                    <button className="btn btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', alignSelf: 'flex-end' }} onClick={() => setReporting(b.id)}>Report Issue</button>
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
      )
      }
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
      />
    </div >
  );
};

export default UserBookings;
