import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch, verifyJWT, getToken } from "../utils/jwt";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const Header = ({ isDark, toggleTheme }) => {
  const navigate = useNavigate();
  const token = getToken();
  const user = verifyJWT(token);

  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);

  const fetchNotifs = () => {
    if (!token) return;
    apiFetch("/api/notifications").then(data => {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }).catch(() => { });
  };

  React.useEffect(() => {
    if (!user) return;
    fetchNotifs();

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_BASE || "http://localhost:8084"}/ws`),
      onConnect: () => {
        client.subscribe("/topic/user/" + user.email, (msg) => {
          const notif = JSON.parse(msg.body);
          setNotifications(prev => [notif, ...prev]);
          setUnreadCount(c => c + 1);
        });
      },
    });
    client.activate();

    // Fetch Rating
    apiFetch(`/api/reviews/user/${user.email}/average`)
      .then(data => setAvgRating(data.averageRating))
      .catch(() => { });

    return () => client.deactivate();
  }, [user?.email]);

  const markRead = () => {
    if (unreadCount > 0) {
      apiFetch("/api/notifications/mark-read", { method: 'POST' })
        .then(() => setUnreadCount(0))
        .catch(err => console.error("Failed to mark read:", err));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar glass" style={{ position: 'sticky', top: 0, zIndex: 1000, padding: '0.75rem 2rem' }}>
      <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => navigate("/")}>
        <div style={{ padding: '8px', background: 'var(--primary)', borderRadius: '12px', color: 'white', fontWeight: 900 }}>RS</div>
        <strong style={{ fontSize: '1.25rem', letterSpacing: '-0.5px' }}>RideShare</strong>
      </div>

      <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user && (
          <>
            {user.role === "ROLE_USER" && (
              <>
                <Link to="/user-rides" className="nav-item">Find Rides</Link>
                <Link to="/my-bookings" className="nav-item">Bookings</Link>
                <Link to="/my-history" className="nav-item">History</Link>
                <Link to="/my-reviews" className="nav-item">Reviews</Link>
              </>
            )}
            {user.role === "ROLE_DRIVER" && (
              <>
                <Link to="/driver-dashboard" className="nav-item">Dashboard</Link>
                <Link to="/driver/add-ride" className="nav-item">Post Ride</Link>
                <Link to="/driver-history" className="nav-item">History</Link>
                <Link to="/driver/my-rides" className="nav-item">My Rides</Link>
                <Link to="/my-reviews" className="nav-item">My Reviews</Link>
              </>
            )}
            {user.role === "ROLE_ADMIN" && (
              <>
                <Link to="/dashboard" className="nav-item">Admin</Link>
                <Link to="/admin/users" className="nav-item">Users</Link>
              </>
            )}
          </>
        )}

        <div className="flex items-center gap-4">
          {user && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotif(!showNotif); markRead(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', position: 'relative', display: 'flex', alignItems: 'center' }}>
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: '#ff4d4d', // Solid vibrant red for high visibility
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isDark ? '2px solid #1a1a1a' : '2px solid white', // Adaptive border
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="card glass animate-slide-up" style={{ position: 'absolute', top: '40px', right: 0, width: '320px', padding: '1rem', zIndex: 2000, maxHeight: '400px', overflowY: 'auto' }}>
                  <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Notifications</span>
                    <span style={{ color: 'var(--primary)', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => setNotifications([])}>Clear</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem' }}>No new notifications</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '2px' }}>{n.type?.replace(/_/g, ' ')}</div>
                        <div style={{ color: 'var(--text-main)', lineHeight: '1.4' }}>{n.message}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleTimeString()}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>
            {isDark ? "☀️" : "🌙"}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
              <div style={{ textAlign: 'right', display: 'none', sm: 'block' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  {user.name}
                  {avgRating !== null && avgRating > 0 && (
                    <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center' }}>
                      ★{avgRating.toFixed(1)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.role?.replace('ROLE_', '')}</div>
              </div>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Logout</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center' }}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }}>Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;
