import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/jwt";
import Pagination from "../common/Pagination";
import { useToast } from "../common/ToastContainer";
import ConfirmModal from "../common/ConfirmModal";
import StarRating from "../common/StarRating";

const DriverAllBookings = () => {
    const { showToast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Rate Modal State
    const [rateModalOpen, setRateModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

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

    // Cancel Modal State
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancellingBooking, setCancellingBooking] = useState(null);
    const [cancelReason, setCancelReason] = useState("");

    const handleOpenCancel = (booking) => {
        setCancellingBooking(booking);
        setCancelReason("");
        setCancelModalOpen(true);
    };

    const handleSubmitCancel = async () => {
        if (!cancellingBooking) return;
        try {
            await apiFetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
                method: "PUT",
                body: JSON.stringify({ reason: cancelReason || "Cancelled by Driver" })
            });
            showToast("Booking cancelled successfully", 'success');
            setCancelModalOpen(false);
            fetchBookings();
        } catch (err) {
            showToast("Failed to cancel: " + err.message, 'error');
        }
    };

    const fetchBookings = () => {
        setLoading(true);
        apiFetch("/api/bookings/driver", { cache: "no-store" })
            .then(data => {
                if (!Array.isArray(data)) {
                    setBookings([]);
                } else {
                    // Sort by newest first
                    const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    setBookings(sorted);
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await apiFetch(`/api/bookings/${id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status })
            });
            showToast(`Booking ${status.toLowerCase()} successfully!`, 'success');
            fetchBookings();
        } catch (err) {
            showToast("Failed to update: " + err.message, 'error');
        }
    };

    const handleConfirmCash = async (bookingId) => {
        openConfirm(
            "Confirm Cash Payment",
            "Confirm you received CASH payment from this passenger?",
            async () => {
                try {
                    await apiFetch(`/api/bookings/${bookingId}/confirm-cash`, { method: "PUT" });
                    showToast("Payment Confirmed!", 'success');
                    fetchBookings();
                } catch (err) {
                    showToast("Failed to confirm cash: " + err.message, 'error');
                }
            },
            "success",
            "Confirm Received"
        );
    };

    const handleOpenRate = (booking) => {
        setSelectedBooking(booking);
        setRating(5);
        setComment("");
        setRateModalOpen(true);
    };

    const handleSubmitRate = async () => {
        if (!selectedBooking) return;
        try {
            await apiFetch("/api/reviews", {
                method: "POST",
                body: JSON.stringify({
                    revieweeEmail: selectedBooking.userEmail,
                    bookingId: selectedBooking.id,
                    rating: parseInt(rating),
                    comment: comment
                })
            });
            showToast("Passenger rated successfully!", 'success');
            setRateModalOpen(false);
        } catch (err) {
            showToast("Failed to submit rating: " + err.message, 'error');
        }
    };

    const getStatusLabel = (b) => {
        if (b.status === "DRIVER_COMPLETED") return "Ride Completed";
        if (b.status === "PAYMENT_PENDING") return "Payment Pending";
        if (b.status === "CASH_PAYMENT_PENDING") return "Cash Payment Pending";
        if (b.status === "PAID" || b.status === "COMPLETED") return "Payment Completed";
        if (b.status === "ACCEPTED") return "Accepted";
        if (b.status === "PENDING") return "Pending Approval";
        if (b.status === "EXPIRED") return "Expired";
        return b.status;
    };

    const filtered = bookings.filter(b => {
        const matchesSearch = (b.userEmail?.toLowerCase().includes(searchText.toLowerCase()) ||
            b.passengers?.[0]?.name?.toLowerCase().includes(searchText.toLowerCase()));

        if (statusFilter === "ALL") return matchesSearch;
        return matchesSearch && b.status === statusFilter;
    });

    const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="container mt-4 pb-20">
            <h1 style={{ marginBottom: '2rem' }}>My Rides (Passenger Requests)</h1>

            <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {["ALL", "PENDING", "ACCEPTED", "COMPLETED", "CANCELLED", "EXPIRED"].map(s => (
                        <button
                            key={s}
                            className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
                            style={{ fontSize: '0.8rem', padding: '0.3rem 0.8rem' }}
                            onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', width: '250px' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                    <input
                        className="input"
                        style={{ padding: '8px 12px 8px 32px', width: '100%' }}
                        placeholder="Search passenger..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="table-wrapper">
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Passenger Profile</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Route</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Method</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Seats</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan="6" className="text-center p-10">Loading...</td></tr>}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan="6" className="text-center p-10 text-muted">No bookings found.</td></tr>
                            )}
                            {paginated.map(b => (
                                <tr key={b.id} className="hover-trigger" style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>
                                                {(b.userEmail || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {b.passengers?.[0]?.name || "User"}
                                                    <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>
                                                        {b.userRating > 0 ? `⭐ ${b.userRating.toFixed(1)}` : `⭐ New`}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{b.userEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {b.ride?.fromLocation} &rarr; {b.ride?.toLocation}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge ${b.paymentMethod === 'CASH' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.75rem' }}>
                                            {b.paymentMethod === 'CASH' ? '💵 Cash' : '💳 Stripe'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{new Date(b.ride?.date || b.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {b.ride?.time}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <span className="badge">{b.seats}</span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        {b.status === "CANCELLED" && <span className="text-muted text-xs opacity-50 italic">Cancelled</span>}
                                        {b.status === "REJECTED" && <span className="text-danger text-xs opacity-50 italic" style={{ color: 'var(--danger)' }}>Rejected</span>}

                                        {b.status === "CASH_PAYMENT_PENDING" && (
                                            <button
                                                className="btn btn-success"
                                                style={{ fontSize: '0.7rem', padding: '0.3rem 0.6rem', marginLeft: '0.5rem' }}
                                                onClick={() => handleConfirmCash(b.id)}
                                            >
                                                💵 Confirm Cash
                                            </button>
                                        )}
                                        <span className={`badge badge-${(b.status === "ACCEPTED" || b.status === "PAID" || b.status === "COMPLETED") ? "success" : b.status === "PENDING" ? "warning" : b.status === "EXPIRED" ? "secondary" : b.status === "DRIVER_COMPLETED" ? "info" : "danger"}`}>
                                            {getStatusLabel(b)}
                                        </span>
                                        {(b.status === "PENDING" || b.status === "ACCEPTED") && (
                                            <button
                                                className="btn btn-outline"
                                                style={{ marginLeft: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                onClick={() => handleOpenCancel(b)}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filtered.length > itemsPerPage && (
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                )}
            </div>

            {/* Cancel Modal */}
            {cancelModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass slide-up" style={{ width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', background: '#fef2f2', borderBottom: '1px solid var(--danger)', textAlign: 'center' }}>
                            <h3 className="mb-0" style={{ color: 'var(--danger)' }}>Cancel Booking</h3>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <p className="text-center mb-4">Are you sure you want to cancel this booking?</p>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Reason for cancellation</label>
                            <select
                                className="input w-full mb-4"
                                style={{ width: '100%', marginBottom: '1rem' }}
                                value={cancelReason}
                                onChange={e => setCancelReason(e.target.value)}
                            >
                                <option value="">Select a reason...</option>
                                <option value="Vehicle Issue">Vehicle Breakdown/Issue</option>
                                <option value="Personal Emergency">Personal Emergency</option>
                                <option value="Route Change">Route Changed</option>
                                <option value="Passenger Unresponsive">Passenger Unresponsive</option>
                                <option value="Other">Other</option>
                            </select>

                            <div className="flex gap-3" style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCancelModalOpen(false)}>Back</button>
                                <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleSubmitCancel}>Confirm Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Rate Modal */}
            {rateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass slide-up" style={{ width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', background: 'var(--primary-glow)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                            <h3 className="mb-0">Rate Passenger</h3>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div className="flex justify-center mb-6" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <StarRating rating={rating} setRating={setRating} />
                            </div>
                            <textarea
                                className="input w-full mb-4"
                                style={{ height: '100px', width: '100%', marginBottom: '1rem' }}
                                placeholder="Comments..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            />
                            <div className="flex gap-3" style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRateModalOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmitRate}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeConfirm}
                type={confirmModal.type}
                confirmText={confirmModal.confirmText}
            />
        </div>
    );
};

export default DriverAllBookings;
