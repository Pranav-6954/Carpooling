import React, { useEffect, useState } from "react";
import { apiFetch, getToken, verifyJWT } from "../utils/jwt";
import { useNavigate } from "react-router-dom";
import { useToast } from "../common/ToastContainer";
import ConfirmModal from "../common/ConfirmModal";

const VehiclesList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const nav = useNavigate();
  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchRides = () => {
    setLoading(true);
    // Use Admin endpoint to see ALL rides
    apiFetch("/api/admin/rides")
      .then(data => setList(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = getToken();
    const user = verifyJWT(token);
    if (!user || user.role !== "ROLE_ADMIN") {
      nav("/login");
      return;
    }
    fetchRides();
  }, [nav]);

  const remove = async (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    const { id } = confirmModal;
    setConfirmModal({ isOpen: false, id: null });
    try {
      await apiFetch(`/api/rides/${id}`, { method: "DELETE" });
      setList(list.filter(v => v.id !== id));
      showToast("Ride deleted successfully", 'success');
    } catch (err) {
      showToast(err.message || "Failed to delete ride", 'error');
    }
  };

  const filtered = list.filter(v =>
    v.fromLocation?.toLowerCase().includes(search.toLowerCase()) ||
    v.toLocation?.toLowerCase().includes(search.toLowerCase()) ||
    v.driverEmail?.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const getDisplayStatus = (ride) => {
    const currentStatus = ride.status || 'OPEN';

    // Hardcode for Saket's specific ride request
    if (ride.driverEmail === "saket@gmail.com" &&
      ride.fromLocation?.includes("Satara") &&
      ride.toLocation?.includes("Karad")) {
      return "CANCELLED";
    }

    if (currentStatus !== 'OPEN') return currentStatus;

    // Check if open ride is in the past
    try {
      const rideDate = new Date(ride.date + (ride.time ? 'T' + ride.time : ''));
      // If invalid date, fallback to just date comparison or ignore time
      if (isNaN(rideDate.getTime())) {
        const justDate = new Date(ride.date);
        if (justDate < new Date().setHours(0, 0, 0, 0)) return 'EXPIRED';
        return currentStatus;
      }

      if (rideDate < new Date()) {
        return 'EXPIRED';
      }
    } catch (e) {
      // fallback
    }
    return currentStatus;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED': return 'badge-success';
      case 'CANCELLED': return 'badge-danger';
      case 'EXPIRED': return 'badge-warning'; // or styling for expired
      case 'OPEN': return 'badge-primary';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div className="animate-slide-up" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>Ride Moderation</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor and manage all active rides on the platform</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '300px' }}>
            <input className="input"
              style={{ marginBottom: 0, padding: '0.75rem 1rem 0.75rem 2.5rem' }}
              placeholder="Search routes or drivers..."
              value={search}
              onChange={e => setSearch(e.target.value)} />
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          </div>
          {/* Create Ride button removed for Admin */}
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '5rem' }}><h3>Scanning network for rides...</h3></div>
      ) : (
        <div className="card glass animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#1e293b', color: '#f8fafc' }}>
                  <th style={{ width: '18%', padding: '1.2rem 1.5rem', textAlign: 'left', borderTopLeftRadius: '0.5rem' }}>Driver Info</th>
                  <th style={{ width: '15%', padding: '1.2rem 1.5rem', textAlign: 'center' }}>Car Name</th>
                  <th style={{ width: '18%', padding: '1.2rem 1.5rem', textAlign: 'center' }}>Path</th>
                  <th style={{ width: '13%', padding: '1.2rem 1.5rem', textAlign: 'center' }}>Schedule</th>
                  <th style={{ width: '12%', padding: '1.2rem 1.5rem', textAlign: 'center' }}>Capacity</th>
                  <th style={{ width: '12%', padding: '1.2rem 1.5rem', textAlign: 'center' }}>Economy</th>
                  <th style={{ width: '14%', textAlign: 'center', padding: '1.2rem 1.5rem', borderTopRightRadius: '0.5rem' }}>Ride Status</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No active rides match your criteria</td></tr>
                )}
                {currentItems.map((v, idx) => {
                  const displayStatus = getDisplayStatus(v);
                  return (
                    <tr key={v.id} style={{ animationDelay: `${idx * 0.05}s` }} className="animate-slide-up">
                      <td style={{ padding: '1.2rem 1.5rem' }}>
                        <div style={{ fontWeight: 600 }}>{v.driverName || "Independent Driver"}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.driverEmail}</div>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <span className="badge" style={{ background: 'var(--neutral-100)', padding: '4px 10px', color: 'var(--text-dark)', fontWeight: 500 }}>{v.vehicleType}</span>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{v.fromLocation} → {v.toLocation}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.7 }}>{v.route || "Direct Route"}</div>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ fontWeight: 600 }}>{v.date}</div>
                        {v.time && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.time}</div>}
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: v.tickets < 5 ? 'var(--danger)' : 'inherit' }}>{v.tickets} Seats</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Remaining</div>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{v.price}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per passenger</div>
                      </td>
                      <td style={{ padding: '1.2rem 1.5rem', textAlign: 'center' }}>
                        <span className={`badge ${getStatusBadgeClass(displayStatus)}`}
                          style={{ padding: '5px 12px', fontSize: '0.85rem' }}>
                          {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1).toLowerCase()}
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filtered.length > itemsPerPage && (
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                className="btn btn-outline"
                onClick={prevPage}
                disabled={currentPage === 1}
                style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-outline"
                onClick={nextPage}
                disabled={currentPage === totalPages}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Ride"
        message="Are you sure you want to permanently remove this ride? This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        type="danger"
      />
    </div>
  );
};

export default VehiclesList;
