import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import { apiFetch, verifyJWT } from "../utils/jwt";
import StarRating from "../common/StarRating";
import { useToast } from "../common/ToastContainer";
import ConfirmModal from "../common/ConfirmModal";

const DriverDashboard = () => {
    const nav = useNavigate();
    const token = localStorage.getItem("token");
    const user = verifyJWT(token);
    const { showToast } = useToast();

    useEffect(() => {
        if (!user) nav("/login");
    }, [user, nav]);

    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, confirmed: 0 });

    const [myRides, setMyRides] = useState([]);
    const [myReviews, setMyReviews] = useState([]);
    const [loadingRides, setLoadingRides] = useState(false);

    const [errorMsg, setErrorMsg] = useState("");
    const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });
    const [searchText, setSearchText] = useState("");
    const [sortOrder, setSortOrder] = useState("desc");

    // Pagination states
    const [ridesPage, setRidesPage] = useState(1);
    const [requestsPage, setRequestsPage] = useState(1);
    const [reviewsPage, setReviewsPage] = useState(1);
    const [rateModalOpen, setRateModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const itemsPerPage = 5;

    // Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: null,
        type: "primary",
        confirmText: "Confirm"
    });

    // Cancel Modal State
    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        rideId: null,
        reason: ""
    });

    const handleOpenCancel = (rideId) => {
        setCancelModal({ isOpen: true, rideId, reason: "" });
    };

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

    const confirmCancelRide = async () => {
        if (!cancelModal.rideId) return;
        try {
            await apiFetch(`/api/rides/${cancelModal.rideId}/cancel`, {
                method: "PUT",
                body: JSON.stringify({ reason: cancelModal.reason || "Driver cancelled" })
            });
            showToast("Ride cancelled successfully", "success");
            setCancelModal({ isOpen: false, rideId: null, reason: "" });
            fetchBookings();
        } catch (err) {
            showToast(err.message || "Failed to cancel ride", "error");
        }
    };

    // WebSocket Connection
    useEffect(() => {
        if (!user || user.role !== "ROLE_DRIVER") return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE || "http://localhost:8084"}/ws`),
            onConnect: () => {
                client.subscribe("/topic/driver/" + user.email, (msg) => {
                    setStatusMsg({ type: "success", text: "New Request: " + msg.body });
                    fetchBookings();
                });
            },
            onStompError: (err) => console.error("WebSocket Error:", err),
        });

        client.activate();

        return () => {
            try { client.deactivate(); } catch (e) { }
        };
    }, []);

    const fetchBookings = async () => {
        setLoadingRides(true);
        setErrorMsg("");
        try {
            // Fetch Bookings with Stats
            const bookingData = await apiFetch("/api/bookings/driver");
            setBookings(bookingData);
            const total = bookingData.length;
            const pending = bookingData.filter(b => b.status === "PENDING").length;
            const confirmed = bookingData.filter(b => b.status === "ACCEPTED" || b.status === "PAID").length;
            setStats({ total, pending, confirmed });

            // Fetch My Rides
            const rideData = await apiFetch("/api/rides/driver-posts", { cache: "no-store" });

            // Filter: Show OPEN rides OR rides that are technically OPEN but past date (Expired)
            // We can just show all non-cancelled/completed? Or just show all and let UI badge handle it?
            // User query implies they want to see it in the list.
            // Let's filter to exclude CANCELLED/COMPLETED if we want "Active" but include everything if we rename section.
            // But for "Active Rides" section, maybe just OPEN is correct?
            // The user says "expired as driver post ride but he did not get passenger request and date is passed so it is in field of expired"
            // So we should capture rides that are OPEN but date < today.

            // Let's just show ALL rides that are not explicitly cancelled/deleted so user sees them? 
            // Better: update the list to show everything but handle status display.
            // "My Active Rides" title might need change if we show everything.
            // But let's stick to showing: OPEN, and if OPEN + Past Date -> Treat as Expired.

            setMyRides(rideData.filter(r => r.status === "OPEN"));

            // Fetch My Reviews
            const reviewData = await apiFetch(`/api/reviews/user/${user.email}`);
            setMyReviews(reviewData);

        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
            setErrorMsg(err.message || "Failed to load dashboard data");
        } finally {
            setLoadingRides(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);

    // toggleSort definition
    const toggleSort = () => setSortOrder(prev => prev === "asc" ? "desc" : "asc");

    // Derived state for filtering and sorting
    const filteredBookings = bookings
        .filter(b => {
            // Show ONLY Pending requests here
            if (b.status !== "PENDING") return false;

            const name = b.passengers && b.passengers.length > 0 ? b.passengers[0].name : (b.userEmail || "Unknown");
            return (name && name.toLowerCase().includes(searchText.toLowerCase())) ||
                (b.userEmail && b.userEmail.toLowerCase().includes(searchText.toLowerCase()));
        })
        .sort((a, b) => {
            // Sort by Booking Creation Date (Newest Request First)
            // Fallback to ID if date is missing
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
            return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        });

    // Auto-clear message after 3 seconds
    useEffect(() => {
        if (statusMsg.text) {
            const timer = setTimeout(() => setStatusMsg({ type: "", text: "" }), 4000);
            return () => clearTimeout(timer);
        }
    }, [statusMsg]);

    const getStatusLabel = (b) => {
        if (b.status === "DRIVER_COMPLETED") return "Ride Completed";
        if (b.status === "PAYMENT_PENDING") return "Payment Pending";
        if (b.status === "CASH_PAYMENT_PENDING") return "Cash Payment Pending";
        if (b.status === "PAID" || b.status === "COMPLETED") return "Payment Completed";
        if (b.status === "ACCEPTED") return "Accepted";
        if (b.status === "PENDING") return "Pending Approval";
        return b.status; // Fallback
    };

    // ... updateStatus ...

    const updateStatus = async (id, status) => {
        try {
            await apiFetch(`/api/bookings/${id}/status`, {
                method: "PUT",
                body: JSON.stringify({ status })
            });
            setStatusMsg({ type: "success", text: `Booking Request ${status.toLowerCase()} successfully!` });
            fetchBookings(); // Full refresh ensures stats are correct
        } catch (err) {
            setStatusMsg({ type: "error", text: "Failed to update: " + err.message });
        }
    };



    const handleCompleteRide = async (rideId) => {
        openConfirm(
            "Complete Ride?",
            "Mark this ride as COMPLETED? This will notify passengers to confirm drop-off.",
            async () => {
                try {
                    await apiFetch(`/api/rides/${rideId}/complete`, {
                        method: "PUT",
                    });
                    setStatusMsg({ type: "success", text: "Ride marked as Completed!" });
                    fetchBookings();
                } catch (err) {
                    setStatusMsg({ type: "error", text: "Failed to complete ride: " + err.message });
                }
            },
            "primary",
            "Mark Completed"
        );
    };

    const handleConfirmCash = async (bookingId) => {
        openConfirm(
            "Confirm Cash Payment",
            "Confirm you received CASH payment from this passenger?",
            async () => {
                try {
                    await apiFetch(`/api/bookings/${bookingId}/confirm-cash`, { method: "PUT" });
                    setStatusMsg({ type: "success", text: "Payment Confirmed!" });
                    fetchBookings();
                } catch (err) {
                    setStatusMsg({ type: "error", text: "Failed to confirm cash: " + err.message });
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
                    bookingId: selectedBooking.id, // Optional based on backend
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

    return (
        <div className="container mt-4 pb-20">
            <header className="mb-10 flex justify-between items-end" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, var(--primary), #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                        Driver Command Center
                    </h1>
                    <p className="text-muted mb-0" style={{ color: 'var(--text-muted)' }}>Manage your deployments, requests, and performance</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className={`btn ${user?.verified ? 'btn-primary' : 'btn-disabled opacity-50 cursor-not-allowed'}`}
                        style={!user?.verified ? { background: '#ccc', borderColor: '#ccc', color: '#666' } : {}}
                        onClick={() => user?.verified ? nav("/driver/add-ride") : showToast("Wait for admin verification", "error")}
                        title={user?.verified ? "Post a new ride" : "Verification Pending"}
                    >
                        + Post New Ride
                    </button>
                </div>
            </header>

            {statusMsg.text && (
                <div className={`glass-card mb-8 slide-up`} style={{
                    background: statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                    border: `1px solid ${statusMsg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
                    color: statusMsg.type === 'error' ? '#ef4444' : '#22c55e',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '2rem'
                }}>
                    <div className="flex items-center gap-2 font-bold">
                        {statusMsg.type === 'error' ? '⚠️' : '✅'} {statusMsg.text}
                    </div>
                </div>
            )}

            {!user?.verified && (
                <div className="glass-card mb-8 slide-up" style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--warning)',
                    padding: '1rem',
                    borderRadius: '12px',
                    marginBottom: '2rem'
                }}>
                    <div className="flex items-center gap-3">
                        <span style={{ fontSize: '1.5rem' }}>⏳</span>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: 800 }}>Account Verification Pending</h4>
                            <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem' }}>
                                You cannot post rides until an administrator verifies your driver profile. Please check back later.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <div className="card glass text-center transition-all hover:-translate-y-1">
                    <div style={{ padding: '20px', background: 'var(--primary-glow)', borderRadius: '16px', color: 'var(--primary)', width: 'fit-content', margin: '0 auto 1.5rem', border: '2px solid var(--primary)' }}>
                        📝
                    </div>
                    <h3 className="text-primary mb-1" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{stats.total}</h3>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest opacity-60" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>Total Requests</p>
                </div>
                <div className="card glass text-center transition-all hover:-translate-y-1">
                    <div style={{ padding: '20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '16px', color: 'var(--warning)', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                        ⏳
                    </div>
                    <h3 className="text-warning mb-1" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--warning)' }}>{stats.pending}</h3>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest opacity-60" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>Awaiting Action</p>
                </div>
                <div className="card glass text-center transition-all hover:-translate-y-1">
                    <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '16px', color: 'var(--success)', width: 'fit-content', margin: '0 auto 1.5rem' }}>
                        🚀
                    </div>
                    <h3 className="text-success mb-1" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{stats.confirmed}</h3>
                    <p className="text-muted text-xs font-bold uppercase tracking-widest opacity-60" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>Active Bookings</p>
                </div>
            </div>

            <div className="card glass mb-12 slide-up" style={{ padding: '0', overflow: 'hidden', animationDelay: '0.1s', marginBottom: '3rem' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="mb-0" style={{ fontSize: '1.25rem', margin: 0 }}>My Active Rides</h3>
                    <div className="badge badge-success">{myRides.length} Active</div>
                </div>
                <div className="table-wrapper">
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem', textAlign: 'left', padding: '1rem' }}>Route</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Fare</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Seats</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem', padding: '1rem' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {errorMsg && <tr><td colSpan="5" className="text-center py-10 text-danger" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>{errorMsg}</td></tr>}
                            {loadingRides && <tr><td colSpan="5" className="text-center py-10" style={{ padding: '2rem', textAlign: 'center' }}>
                                <div className="animate-spin" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent' }}></div>
                                <span className="text-muted" style={{ marginLeft: '10px' }}>Loading your fleet...</span>
                            </td></tr>}
                            {!loadingRides && !errorMsg && myRides.length === 0 && <tr><td colSpan="5" className="text-center py-10 text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No rides posted yet. Start by creating one!</td></tr>}
                            {!loadingRides && !errorMsg && myRides.slice((ridesPage - 1) * itemsPerPage, ridesPage * itemsPerPage).map(r => (
                                <tr key={r.id} className="hover-trigger transition-all">
                                    <td style={{ paddingLeft: '1.5rem', fontWeight: 600, padding: '1rem' }}>{r.fromLocation} &rarr; {r.toLocation}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{new Date(r.date).toLocaleDateString()}</div>
                                        {r.time && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.time}</div>}
                                    </td>
                                    <td className="text-success font-bold" style={{ padding: '1rem', color: 'var(--success)' }}>₹{r.price}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div className="badge">{r.tickets} Left</div>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '1.5rem', padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleCompleteRide(r.id)}>
                                            Mark Completed
                                        </button>

                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination My Rides */}
                {myRides.length > itemsPerPage && (
                    <div className="flex justify-center items-center py-4 gap-4" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--border)' }}>
                        <button className="btn btn-outline" disabled={ridesPage === 1} onClick={() => setRidesPage(p => p - 1)}>&larr;</button>
                        <span className="text-xs font-bold opacity-60" style={{ fontSize: '0.8rem' }}>Page {ridesPage} of {Math.ceil(myRides.length / itemsPerPage)}</span>
                        <button className="btn btn-outline" disabled={ridesPage === Math.ceil(myRides.length / itemsPerPage)} onClick={() => setRidesPage(p => p + 1)}>&rarr;</button>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 className="mb-0" style={{ margin: 0 }}>Incoming Requests</h3>
                    <p className="text-muted text-xs mb-0" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approve or reject passenger bookings</p>
                </div>
                <div className="flex gap-2" style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ position: 'relative', width: '250px' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem' }}>🔍</span>
                        <input
                            className="input"
                            style={{ padding: '8px 12px 8px 32px', fontSize: '0.85rem' }}
                            placeholder="Filter by name..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-outline" onClick={toggleSort} style={{ minWidth: '100px' }}>
                        Date {sortOrder === 'asc' ? '↑' : '↓'}
                    </button>
                </div>
            </div>

            <div className="card glass slide-up" style={{ padding: '0', overflow: 'hidden', animationDelay: '0.2s', marginBottom: '3rem' }}>
                <div className="table-wrapper">
                    <table className="table" style={{ width: '100%' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ paddingLeft: '1.5rem', textAlign: 'left', padding: '1rem' }}>Passenger Profile</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Route</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Method</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Date</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Seats</th>
                                <th style={{ textAlign: 'left', padding: '1rem' }}>Status</th>
                                <th style={{ textAlign: 'right', paddingRight: '1.5rem', padding: '1rem' }}>Decision</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredBookings.length === 0 && <tr><td colSpan="7" className="text-center py-10 text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No pending booking requests.</td></tr>}
                            {filteredBookings.slice(0, 5).map(b => (
                                <tr key={b.id} className="hover-trigger transition-all">
                                    <td style={{ paddingLeft: '1.5rem', padding: '1rem' }}>
                                        <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)' }}>
                                                {(b.userEmail || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {b.passengers && b.passengers[0] ? b.passengers[0].name : b.userEmail}
                                                    <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '12px' }}>
                                                        {b.userRating > 0 ? `⭐ ${b.userRating.toFixed(1)}` : `⭐ New`}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{b.userEmail}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', padding: '1rem' }}>
                                        {b.ride?.fromLocation} <span className="opacity-30">&rarr;</span> {b.ride?.toLocation}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge ${b.paymentMethod === 'CASH' ? 'badge-success' : 'badge-primary'}`} style={{ fontSize: '0.7rem' }}>
                                            {b.paymentMethod === 'CASH' ? '💵 Cash' : '💳 Stripe'}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.85rem', padding: '1rem' }}>
                                        <div>{b.ride?.date}</div>
                                        {b.ride?.time && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.ride?.time}</div>}
                                    </td>
                                    <td style={{ padding: '1rem' }}><div className="badge">{b.seats}</div></td>
                                    <td style={{ padding: '1rem' }}>
                                        <span className={`badge badge-${(b.status === "ACCEPTED" || b.status === "PAID" || b.status === "COMPLETED") ? "success" : b.status === "PENDING" ? "warning" : b.status === "DRIVER_COMPLETED" ? "info" : "danger"}`}>
                                            {getStatusLabel(b)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right', paddingRight: '1.5rem', padding: '1rem' }}>
                                        {b.status === "PENDING" && (
                                            <div className="flex justify-end gap-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.4rem 0.6rem', minWidth: 'auto' }}
                                                    onClick={() => openConfirm(
                                                        "Accept Request",
                                                        "Accept this passenger for the ride?",
                                                        () => updateStatus(b.id, "ACCEPTED"),
                                                        "primary",
                                                        "Accept"
                                                    )}
                                                    title="Accept Request"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem 0.6rem', minWidth: 'auto', borderColor: 'var(--danger)', color: 'var(--danger)' }}
                                                    onClick={() => openConfirm(
                                                        "Reject Request",
                                                        "Are you sure you want to REJECT this booking request?",
                                                        () => updateStatus(b.id, "REJECTED"),
                                                        "danger",
                                                        "Reject"
                                                    )}
                                                    title="Reject Request"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
                                        {(b.status === "ACCEPTED" || b.status === "PAID") && (
                                            <div className="flex justify-end items-center gap-3" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                                                <span className="text-success font-bold flex items-center gap-1 text-xs uppercase tracking-tighter" style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                                                    ✓ {b.status}
                                                </span>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ fontSize: '0.7rem', padding: '4px 10px', borderColor: 'var(--accent)', color: 'var(--accent)' }}
                                                    onClick={() => handleOpenRate(b)}
                                                >
                                                    Rate
                                                </button>
                                            </div>
                                        )}
                                        {b.status === "CASH_PAYMENT_PENDING" && (
                                            <button
                                                className="btn btn-success"
                                                style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                                                onClick={() => handleConfirmCash(b.id)}
                                            >
                                                💵 Confirm Cash Received
                                            </button>
                                        )}

                                        {b.status === "CANCELLED" && <span className="text-muted text-xs opacity-50 italic">Cancelled</span>}
                                        {b.status === "REJECTED" && <span className="text-danger text-xs opacity-50 italic" style={{ color: 'var(--danger)' }}>Rejected</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Removed for Dashboard Limit */}
                <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.8rem', opacity: 0.7 }}>
                    Showing recent pending requests. <a href="/driver/my-rides" style={{ textDecoration: 'underline', cursor: 'pointer', color: 'var(--primary)' }} onClick={(e) => { e.preventDefault(); nav('/driver/my-rides'); }}>View All Requests</a>
                </div>
            </div>

            <div className="card glass mt-12 slide-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex flex-col items-center mb-8 gap-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div>
                        <h3 className="mb-0" style={{ margin: 0 }}>Driver Reputation</h3>
                        <p className="text-muted text-xs mb-0" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>What passengers are saying about your service</p>
                    </div>
                    {myReviews.length > 0 && (
                        <div className="badge badge-success" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
                            ⭐ {(myReviews.reduce((acc, r) => acc + r.rating, 0) / myReviews.length).toFixed(1)} Rating
                        </div>
                    )}
                </div>

                {myReviews.length === 0 ? (
                    <div className="text-center py-10 glass" style={{ padding: '3rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                        <p className="text-muted mb-0">No reviews yet. Complete more rides to build your reputation!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                        {myReviews.slice((reviewsPage - 1) * itemsPerPage, reviewsPage * itemsPerPage).map(r => (
                            <div key={r.id} className="card glass p-5 hover-trigger" style={{ padding: '1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                <div className="flex justify-between items-start mb-3" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <div className="flex items-center gap-3" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>
                                            {r.reviewerEmail.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{r.reviewerEmail}</div>
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(r.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="scale-75 origin-right">
                                        <StarRating rating={r.rating} readOnly={true} />
                                    </div>
                                </div>
                                <p className="mb-0 text-sm italic" style={{ lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{r.comment}"</p>
                            </div>
                        ))}
                        {/* Pagination Reviews */}
                        {myReviews.length > itemsPerPage && (
                            <div className="flex justify-center items-center py-4 gap-4 mt-2" style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                <button className="btn btn-outline" disabled={reviewsPage === 1} onClick={() => setReviewsPage(p => p - 1)}>&larr;</button>
                                <span className="text-xs font-bold opacity-60">Page {reviewsPage} of {Math.ceil(myReviews.length / itemsPerPage)}</span>
                                <button className="btn btn-outline" disabled={reviewsPage === Math.ceil(myReviews.length / itemsPerPage)} onClick={() => setReviewsPage(p => p + 1)}>&rarr;</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Driver rating Passenger Modal */}
            {rateModalOpen && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass slide-up" style={{ width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '20px', background: 'var(--primary-glow)', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
                            <h3 className="mb-0">Rate Passenger</h3>
                            <p className="text-muted text-xs mb-0 mt-1" style={{ fontSize: '0.8rem' }}>Reviewing {selectedBooking?.userEmail}</p>
                        </div>
                        <div style={{ padding: '20px' }}>
                            <div className="flex justify-center mb-6" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                                <StarRating rating={rating} setRating={setRating} />
                            </div>
                            <div className="mb-6" style={{ marginBottom: '1.5rem' }}>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem' }}>Notes on passenger CONDUCT</label>
                                <textarea
                                    className="input w-full"
                                    style={{ height: '100px', fontSize: '0.85rem', width: '100%' }}
                                    placeholder="Was the passenger on time? Polite?"
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3" style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setRateModalOpen(false)}>Cancel</button>
                                <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmitRate}>Submit Review</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Ride Modal */}
            {console.log("Rendering Cancel Modal? isOpen:", cancelModal.isOpen)}
            {cancelModal.isOpen && createPortal(
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card glass slide-up" style={{ width: '100%', maxWidth: '400px', padding: '0', overflow: 'hidden', border: '1px solid var(--danger)', background: '#fff' }}>
                        <div style={{ padding: '20px', background: '#ffe4e6', borderBottom: '1px solid var(--danger)', textAlign: 'center' }}>
                            <h3 className="mb-0" style={{ color: '#be123c', fontSize: '1.5rem', fontWeight: 800 }}>Cancel Ride</h3>
                            <p style={{ fontSize: '0.9rem', color: '#be123c', marginTop: '0.5rem', marginBottom: 0 }}>This will cancel all bookings for this ride.</p>
                        </div>
                        <div style={{ padding: '20px' }}>

                            <div className="mb-6" style={{ marginBottom: '1.5rem' }}>
                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block" style={{ fontSize: '0.75rem', display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Reason</label>
                                <select
                                    className="input w-full"
                                    style={{ width: '100%', marginBottom: '1rem', color: 'black' }}
                                    value={['Vehicle Issue', 'Health Issue', 'Weather', 'Changed Plans'].includes(cancelModal.reason) ? cancelModal.reason : 'Other'}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setCancelModal(prev => ({ ...prev, reason: val === 'Other' ? '' : val }));
                                    }}
                                >
                                    <option value="" disabled>Select a reason...</option>
                                    <option value="Vehicle Issue">Vehicle Breakdown / Issue</option>
                                    <option value="Health Issue">Personal Health Emergency</option>
                                    <option value="Weather">Bad Weather Conditions</option>
                                    <option value="Changed Plans">Change of Plans</option>
                                    <option value="Other">Other / Custom</option>
                                </select>

                                <textarea
                                    className="input w-full"
                                    style={{ height: '80px', fontSize: '0.9rem', width: '100%', color: 'black' }}
                                    placeholder="Enter cancellation details..."
                                    value={cancelModal.reason}
                                    onChange={e => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3" style={{ display: 'flex', gap: '0.75rem' }}>
                                <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setCancelModal({ isOpen: false, rideId: null, reason: "" })}>Go Back</button>
                                <button className="btn btn-primary" style={{ flex: 1, background: 'var(--danger)', borderColor: 'var(--danger)', color: 'white' }} onClick={confirmCancelRide}>Confirm Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Cancel Ride Modal - REMOVED per user request */}

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

export default DriverDashboard;
