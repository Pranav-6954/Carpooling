// src/admin/Dashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, getToken, verifyJWT } from "../utils/jwt";
import Pagination from "../common/Pagination";

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0, drivers: 0, vehicles: 0, bookings: 0,
    cancelledBookings: 0, totalVolume: 0, totalRides: 0,
    netRevenue: 0, gstLiability: 0,
    cashVolume: 0, onlineVolume: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    const user = verifyJWT(token);
    if (!user || user.role !== "ROLE_ADMIN") {
      navigate("/login");
      return;
    }

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await apiFetch("/api/admin/users/stats/detailed");
        setStats({
          users: data.userCount || 0,
          drivers: data.driverCount || 0,
          vehicles: data.totalRides || 0,
          bookings: data.totalBookings || 0,
          cancelledBookings: data.cancelledBookings || 0,
          totalVolume: data.totalVolume || 0, // Using totalVolume for GMV
          netRevenue: data.netRevenue || 0,
          gstLiability: data.gstLiability || 0,
          cashVolume: data.cashVolume || 0,
          onlineVolume: data.onlineVolume || 0,
          totalRides: data.totalRides || 0
        });
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) return <div className="container text-center" style={{ padding: '5rem' }}>
    <div className="animate-spin" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--primary)', borderRadius: '50%', borderTopColor: 'transparent', marginBottom: '1rem' }}></div>
    <h3>Analyzing Network Data...</h3>
  </div>;

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="animate-slide-up" style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
        </div>
        <div className="flex gap-4">
          <button className="btn btn-outline btn-admin-nav" onClick={() => navigate("/admin/users")} style={{ padding: '0.75rem 1.5rem', minWidth: '160px' }}>Manage Users</button>
          <button className="btn btn-outline btn-admin-nav" onClick={() => navigate("/admin/vehicles")} style={{ padding: '0.75rem 1.5rem', minWidth: '160px' }}>Rides</button>
          <button className="btn btn-outline btn-admin-nav" onClick={() => navigate("/admin/bookings")} style={{ padding: '0.75rem 1.5rem', minWidth: '160px' }}>Transactions</button>
          <button className="btn btn-outline btn-admin-nav" onClick={() => navigate("/admin/analytics")} style={{ padding: '0.75rem 1.5rem', minWidth: '160px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Analytics
          </button>

        </div>
      </div>

      {error && (
        <div className="badge badge-danger animate-slide-up" style={{ display: 'block', padding: '1rem', marginBottom: '2rem' }}>
          System Error: {error}
        </div>
      )}

      {!error && (
        <>
          <div className="stats-grid animate-slide-up" style={{ animationDelay: '0.1s', gap: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="card glass stat-card text-center transition-all hover:-translate-y-1">
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.users}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Registered accounts</div>
            </div>
            <div className="card glass stat-card text-center transition-all hover:-translate-y-1">
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--success)' }}>
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                  <circle cx="7" cy="17" r="2"></circle>
                  <path d="M9 17h6"></path>
                  <circle cx="17" cy="17" r="2"></circle>
                </svg>
              </div>
              <div className="stat-label">Active Drivers</div>
              <div className="stat-value">{stats.drivers}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--success)' }}>Verified partners</div>
            </div>
            <div className="card glass stat-card text-center transition-all hover:-translate-y-1">
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="stat-label">Total Rides</div>
              <div className="stat-value">{stats.totalRides}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posted across network</div>
            </div>
            <div className="card glass stat-card text-center transition-all hover:-translate-y-1">
              <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--warning)' }}>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M7 15h0M2 9.5h20"></path>
                </svg>
              </div>
              <div className="stat-label">Total Bookings</div>
              <div className="stat-value">{stats.bookings}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warning)' }}>Lifecycle transactions</div>
            </div>
          </div>

          <div className="grid animate-slide-up" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', marginTop: '2rem', animationDelay: '0.2s' }}>
            {/* Premium Financials Section */}
            <div className="card glass" style={{
              gridColumn: 'span 4',
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              position: 'relative',
              overflow: 'hidden',
              padding: '2rem'
            }}>
              {/* Background Accent */}
              <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-5%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, var(--success) 0%, transparent 70%)',
                opacity: 0.05,
                zIndex: 0
              }}></div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div>
                    <span style={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '1.5px',
                      color: 'var(--success)',
                      display: 'block',
                      marginBottom: '0.5rem'
                    }}>
                      Platform Financial Performance
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', alignItems: 'stretch' }}>
                  {/* Net Revenue Card - Big Hero */}
                  <div style={{
                    background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', // Light Emerald Gradient
                    padding: '2rem',
                    borderRadius: '16px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '2rem' }}>💰</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '1px' }}>Net Platform Revenue</span>
                    </div>
                    <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#14532d', lineHeight: 1 }}>
                      ₹{Math.round(stats.netRevenue).toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#15803d', marginTop: '0.5rem', fontWeight: 600 }}>
                      Adjusted 2% Earnings
                    </div>
                  </div>

                  {/* Secondary Metrics Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* GST Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', // Light Amber Gradient
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: '1px solid #fcd34d',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>GST Collected (5%)</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#78350f' }}>₹{Math.round(stats.gstLiability).toLocaleString()}</div>
                    </div>

                    {/* Total Volume Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)', // Light Indigo Gradient
                      padding: '1.25rem',
                      borderRadius: '16px',
                      border: '1px solid #a5b4fc',
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.25rem' }}>Total Business Volume</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#312e81' }}>₹{Math.round(stats.totalVolume).toLocaleString()}</div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
