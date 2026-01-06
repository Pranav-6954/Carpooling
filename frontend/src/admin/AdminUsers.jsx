// src/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { apiFetch, getToken, verifyJWT } from "../utils/jwt";
import { useNavigate } from "react-router-dom";
import Pagination from "../common/Pagination";
import { useToast } from "../common/ToastContainer";
import ConfirmModal from "../common/ConfirmModal";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, id: null, title: '', message: '' });

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/api/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users");
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
    setIsSuperAdmin(!!user.superAdmin);
    loadUsers();
  }, [navigate]);



  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      id,
      title: 'Delete User',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.'
    });
  };

  const handleApprove = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'approve',
      id,
      title: 'Approve Administrator',
      message: 'Grant administrator privileges to this user?'
    });
  };

  const handleRevoke = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'revoke',
      id,
      title: 'Revoke Administrator',
      message: 'Remove administrator privileges from this user?'
    });
  };



  const handleBlock = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'block',
      id,
      title: 'Block User',
      message: 'Block this user? They will no longer be able to login.'
    });
  };

  const handleUnblock = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'unblock',
      id,
      title: 'Unblock User',
      message: 'Restore access for this user?'
    });
  };

  const handleVerify = async (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'verify',
      id,
      title: 'Verify Driver',
      message: 'Mark this driver as verified? This adds a badge to their profile.'
    });
  };

  const executeAction = async () => {
    const { action, id } = confirmModal;
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      if (action === 'delete') {
        await apiFetch(`/api/admin/users/${id}`, { method: "DELETE" });
        showToast("User deleted successfully", 'success');
      } else if (action === 'approve') {
        await apiFetch(`/api/admin/users/${id}/approve`, { method: "POST" });
        showToast("User approved as Administrator", 'success');
      } else if (action === 'revoke') {
        await apiFetch(`/api/admin/users/${id}/revoke`, { method: "POST" });
        showToast("Administrator privileges revoked", 'success');
      } else if (action === 'block') {
        await apiFetch(`/api/admin/users/${id}/block`, { method: "POST" });
        showToast("User blocked", 'success');
      } else if (action === 'unblock') {
        await apiFetch(`/api/admin/users/${id}/unblock`, { method: "POST" });
        showToast("User unblocked", 'success');
      } else if (action === 'verify') {
        await apiFetch(`/api/admin/users/${id}/verify`, { method: "POST" });
        showToast("Driver verified", 'success');
      }
      loadUsers();
    } catch (err) {
      showToast(err.message || "Action failed", 'error');
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" ? true : u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="animate-slide-up" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Moderate accounts and permissions</p>
        </div>
        <div style={{ position: 'relative', minWidth: '300px' }}>
          <input className="input"
            style={{ marginBottom: 0, padding: '0.75rem 1rem 0.75rem 2.5rem' }}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
          <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
        </div>

        <div className="btn-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${roleFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setRoleFilter('ALL'); setCurrentPage(1); }}
            style={{ padding: '0.5rem 1rem' }}
          >
            All
          </button>
          <button
            className={`btn ${roleFilter === 'ROLE_USER' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setRoleFilter('ROLE_USER'); setCurrentPage(1); }}
            style={{ padding: '0.5rem 1rem' }}
          >
            Passengers
          </button>
          <button
            className={`btn ${roleFilter === 'ROLE_DRIVER' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setRoleFilter('ROLE_DRIVER'); setCurrentPage(1); }}
            style={{ padding: '0.5rem 1rem' }}
          >
            Drivers
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '5rem' }}><h3>Fetching directory...</h3></div>
      ) : error ? (
        <div className="badge badge-danger" style={{ display: 'block', padding: '1rem' }}>{error}</div>
      ) : (
        <>
          <div className="card glass animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table style={{ width: '100%' }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  background: '#1f2937',
                  color: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <tr>
                    <th style={{ width: '25%', padding: '1rem', textAlign: 'left', fontWeight: 'bold' }}>Identity</th>
                    <th style={{ width: '15%', padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Role</th>
                    <th style={{ width: '15%', padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Reputation</th>
                    <th style={{ width: '15%', padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Status</th>
                    <th style={{ width: '15%', padding: '1rem', textAlign: 'center', fontWeight: 'bold' }}>Privileges</th>
                    <th style={{ textAlign: 'center', padding: '1rem', fontWeight: 'bold' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No matching users found</td></tr>
                  )}
                  {paginatedUsers.map((u, idx) => (
                    <tr key={u.id} style={{ animationDelay: `${idx * 0.05}s`, verticalAlign: 'middle', borderBottom: '1px solid #eee' }} className="animate-slide-up hover-trigger">
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{u.name} {u.verified && <span title="Verified" style={{ color: 'var(--primary)', marginLeft: '4px' }}>✓</span>}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span className={`badge badge-${u.role === 'ROLE_ADMIN' ? 'primary' : u.role === 'ROLE_DRIVER' ? 'success' : u.role === 'ROLE_BLOCKED' ? 'danger' : 'secondary'}`}>
                          {u.role?.replace('ROLE_', '')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ color: '#fbbf24' }}>★</span>
                          <span style={{ fontWeight: 600 }}>{u.averageRating?.toFixed(1) || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {u.requestedAdmin ? <span className="badge badge-warning">Requesting Admin</span> :
                          u.role === 'ROLE_BLOCKED' ? <span className="badge badge-danger">Blocked</span> :
                            <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>Active</span>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {u.superAdmin ? <span className="badge badge-primary">Super Admin</span> : <span style={{ opacity: 0.4, fontSize: '0.8rem' }}>Regular</span>}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {isSuperAdmin && u.requestedAdmin && (
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleApprove(u.id)}>Approve</button>
                          )}

                          {u.role === 'ROLE_DRIVER' && !u.verified && (
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }} onClick={() => handleVerify(u.id)}>Verify</button>
                          )}

                          {u.role === 'ROLE_BLOCKED' ? (
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleUnblock(u.id)}>Unblock</button>
                          ) : !u.superAdmin && (
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleBlock(u.id)}>Block</button>
                          )}



                          {isSuperAdmin && !u.superAdmin && (
                            <button className="btn btn-outline" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(u.id)}>Delete</button>
                          )}
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
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={executeAction}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        type="danger"
      />
    </div>
  );
};

export default AdminUsers;
