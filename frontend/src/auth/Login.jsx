import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { saveToken, verifyJWT } from "../utils/jwt";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8084";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    const user = verifyJWT();
    if (user) {
      let role = user.role?.toUpperCase() || "";
      if (!role.startsWith("ROLE_")) role = "ROLE_" + role;

      if (role === "ROLE_ADMIN") nav("/dashboard");
      else if (role === "ROLE_DRIVER") nav("/driver-dashboard");
      else if (role === "ROLE_USER") nav("/user-rides");
    }
  }, [nav]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Login failed");
        return;
      }

      saveToken(data.token);
      saveToken(data.token);
      let role = data.role?.toUpperCase() || "";
      if (!role.startsWith("ROLE_")) role = "ROLE_" + role;

      if (role === "ROLE_ADMIN") nav("/dashboard");
      else if (role === "ROLE_DRIVER") nav("/driver-dashboard");
      else if (role === "ROLE_USER") nav("/user-rides");
      else nav("/login"); // Fallback
    } catch (error) {
      setErr("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div className="card glass animate-slide-up" style={{ maxWidth: '420px', width: '100%', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Access your personalized carpooling dashboard</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="label">Registered Email</label>
            <input className="input" type="email" placeholder="john.doe@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <label className="label">Private Password</label>
            <input className="input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', marginTop: '1.5rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? "Authenticating..." : "Sign Into Account"}
          </button>
        </form>

        {err && (
          <div className="badge badge-danger animate-slide-up" style={{ display: 'block', marginTop: '1.5rem', textAlign: 'center', padding: '0.75rem', textTransform: 'none' }}>
            {err}
          </div>
        )}

        <div className="text-center" style={{ marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account yet?
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', marginLeft: '0.5rem' }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
