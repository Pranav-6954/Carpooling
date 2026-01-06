// src/admin/AdminReports.jsx
import React, { useEffect, useState } from "react";
import { apiFetch, getToken, verifyJWT } from "../utils/jwt";
import { useNavigate } from "react-router-dom";
import Pagination from "../common/Pagination";
import { useToast } from "../common/ToastContainer";

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const loadReports = async () => {
        setLoading(true);
        try {
            const data = await apiFetch("/api/admin/reports");
            setReports(Array.isArray(data) ? data : []);
        } catch (err) {
            showToast(err.message || "Failed to load reports", 'error');
            if (err.status === 401 || err.status === 403) navigate("/login");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = getToken();
        const user = verifyJWT(token);
        if (!user || user.role !== "ROLE_ADMIN") {
            navigate("/login");
            return;
        }
        loadReports();
    }, [navigate]);

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this report?`)) return;
        try {
            await apiFetch(`/api/admin/reports/${id}/${action}`, { method: "POST" });
            showToast(`Report marked as ${action}d`, 'success');
            loadReports();
        } catch (err) {
            showToast(err.message || "Action failed", 'error');
        }
    };

    const paginatedReports = reports.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div className="animate-slide-up" style={{ marginBottom: '3rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Dispute Resolution</h1>
                <p style={{ color: 'var(--text-muted)' }}>Manage user reports and issues</p>
            </div>

            {loading ? (
                <div className="text-center" style={{ padding: '5rem' }}><h3>Loading reports...</h3></div>
            ) : reports.length === 0 ? (
                <div className="card glass text-center" style={{ padding: '4rem' }}>
                    <h3>No Open Disputes</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Everything is running smoothly!</p>
                </div>
            ) : (
                <>
                    <div className="card glass animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
                        <div className="table-wrapper">
                            <table>
                                <thead style={{ background: '#1f2937', color: 'white' }}>
                                    <tr>
                                        <th style={{ padding: '1rem' }}>ID</th>
                                        <th style={{ padding: '1rem' }}>Reporter</th>
                                        <th style={{ padding: '1rem' }}>Against</th>
                                        <th style={{ padding: '1rem' }}>Reason</th>
                                        <th style={{ padding: '1rem' }}>Status</th>
                                        <th style={{ padding: '1rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedReports.map(r => (
                                        <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>#{r.id}</td>
                                            <td style={{ padding: '1rem' }}>{r.reporterEmail}</td>
                                            <td style={{ padding: '1rem' }}>{r.reportedUserEmail || 'N/A'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{r.reason}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.description}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span className={`badge badge-${r.status === 'OPEN' ? 'danger' : r.status === 'RESOLVED' ? 'success' : 'secondary'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                {r.status === 'OPEN' && (
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleAction(r.id, 'resolve')}>Resolve</button>
                                                        <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleAction(r.id, 'dismiss')}>Dismiss</button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalItems={reports.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
        </div>
    );
};

export default AdminReports;
