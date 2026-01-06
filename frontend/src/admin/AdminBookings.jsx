import React, { useEffect, useState } from "react";
import { apiFetch, getToken, verifyJWT } from "../utils/jwt";
import { useNavigate } from "react-router-dom";
import Pagination from "../common/Pagination";

const AdminBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const token = getToken();
        const user = verifyJWT(token);
        if (!user || user.role !== "ROLE_ADMIN") {
            navigate("/login");
            return;
        }

        const fetchBookings = async () => {
            setLoading(true);
            try {
                const data = await apiFetch("/api/admin/bookings");
                setBookings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [navigate]);

    const filtered = bookings.filter(b =>
        (b.userEmail || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.ride?.driverEmail || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.ride?.fromLocation || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.id || "").toString().includes(search)
    ).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

    const paginated = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getTransactionId = (b) => {
        if (b.transactionId) return b.transactionId; // Prefer Real ID

        // Legacy Fallback
        if (b.status === 'CANCELLED' || b.status === 'REJECTED') return "-";
        if (b.paymentMethod === 'STRIPE') {
            return `txn_st_${b.id}${new Date(b.createdAt || Date.now()).getTime().toString().slice(-4)}`;
        }
        return `txn_cs_${b.id}${new Date(b.createdAt || Date.now()).getTime().toString().slice(-4)}`;
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div className="animate-slide-up" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Transaction Monitor</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track all bookings and payments across the platform</p>
                </div>
                <div style={{ position: 'relative', minWidth: '300px' }}>
                    <input className="input"
                        style={{ marginBottom: 0, padding: '0.75rem 1rem 0.75rem 2.5rem' }}
                        placeholder="Search invoices, emails, or locations..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center" style={{ padding: '5rem' }}><h3>Loading transactions...</h3></div>
            ) : (
                <>
                    <div className="card glass animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-wrapper">
                            <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                    <tr style={{ background: '#1e293b', color: '#f8fafc' }}>
                                        <th style={{ padding: '1.2rem 1.5rem', width: '18%', textAlign: 'left', borderTopLeftRadius: '0.5rem' }}>Transaction ID</th>
                                        <th style={{ padding: '1.2rem 1.5rem', width: '18%', textAlign: 'center' }}>Passenger</th>
                                        <th style={{ padding: '1.2rem 1.5rem', width: '18%', textAlign: 'center' }}>Driver</th>
                                        <th style={{ padding: '1.2rem 1.5rem', width: '20%', textAlign: 'center' }}>Route</th>
                                        <th style={{ padding: '1.2rem 1.5rem', width: '14%', textAlign: 'center' }}>Status</th>
                                        <th style={{ padding: '1.2rem 1.5rem', textAlign: 'center', width: '12%', borderTopRightRadius: '0.5rem' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginated.length === 0 && (
                                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No bookings found</td></tr>
                                    )}
                                    {paginated.map((b, idx) => (
                                        <tr key={b.id} style={{ animationDelay: `${idx * 0.05}s` }} className="animate-slide-up">
                                            <td style={{ padding: '1.2rem 1.5rem' }}>
                                                <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                                                    {getTransactionId(b)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {b.paymentMethod || "UNKNOWN"}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 600 }}>{b.passengerName || "Unknown"}</div>
                                                <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{b.userEmail}</div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 600 }}>{b.driverName || "Unknown"}</div>
                                                <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>{b.driverEmail || b.ride?.driverEmail}</div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 600 }}>{b.ride?.fromLocation} → {b.ride?.toLocation}</div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{b.ride?.date}</div>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                                                <span className={`badge badge-${(b.status === 'ACCEPTED' || b.status === "PAID" || b.status === "COMPLETED") ? 'success' : b.status === 'PENDING' ? 'warning' : 'danger'}`}>
                                                    {b.status.charAt(0).toUpperCase() + b.status.slice(1).toLowerCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{b.totalPrice}</div>
                                                <div style={{ fontSize: '0.75rem', color: b.paymentStatus === 'COMPLETED' || b.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--warning)' }}>
                                                    {b.paymentStatus || "PENDING"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filtered.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
        </div>
    );
};

export default AdminBookings;
