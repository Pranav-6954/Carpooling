import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE || "http://localhost:8084";

const Register = () => {
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "user", confirmPassword: "",
    gender: "Male", phone: "", carModel: "",
    licensePlate: "", capacity: 4
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setMsg("");
    if (form.password !== form.confirmPassword) {
      setErr("Security Alert: Passwords do not match!");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data.error || "Onboarding failed. Please review your details.");
        return;
      }

      setMsg("Registry complete! Redirecting to secure portal...");
      setTimeout(() => nav("/login"), 1500);
    } catch (networkError) {
      setErr("Gateway error. Our servers are currently unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '5rem', paddingTop: '3rem' }}>
      <div className="card glass animate-slide-up" style={{ maxWidth: '700px', margin: '0 auto', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
          <h1 style={{ marginBottom: '0.5rem' }}>Join the Network</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create your account to start sharing journeys</p>
        </div>

        <form onSubmit={submit}>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Full Legal Name</label>
              <input className="input" placeholder="e.g. Alex Johnson" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="label">Contact Email</label>
              <input className="input" type="email" placeholder="alex@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Access Key (Password)</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="label">Confirm Access Key</label>
              <input className="input" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Identity Gender</label>
              <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="input-group">
              <label className="label">Member Type</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="user">Passenger (Standard)</option>
                <option value="driver">Driver (Service Provider)</option>
                <option value="admin">Administrator (Requires Approval)</option>
              </select>
            </div>
          </div>

          {form.role === "driver" && (
            <div className="animate-slide-up" style={{ padding: '2rem', background: 'rgba(var(--primary-rgb), 0.03)', borderRadius: '20px', marginBottom: '2rem', border: '1px solid var(--primary)' }}>
              <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span>🛡️</span> Professional Driver Credentials
              </h4>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="label">Emergency Contact Line</label>
                  <input className="input" placeholder="+91 00000 00000" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="label">Vehicle Designation</label>
                  <input className="input" placeholder="e.g. Tesla Model 3" value={form.carModel} onChange={e => setForm({ ...form, carModel: e.target.value })} required />
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label className="label">Registry Plate</label>
                  <input className="input" placeholder="TS 00 XX 0000" value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="label">Available Capacity</label>
                  <input className="input" type="number" min="1" max="10" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} required />
                </div>
              </div>
            </div>
          )}


          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} disabled={loading}>
            {loading ? "Initializing Profile..." : "Finalize Registration"}
          </button>
        </form>

        {(msg || err) && (
          <div className={`badge ${err ? 'badge-danger' : 'badge-success'} animate-slide-up`} style={{ display: 'block', marginTop: '2rem', textAlign: 'center', padding: '1rem', textTransform: 'none' }}>
            {msg || err}
          </div>
        )}

        <div className="text-center" style={{ marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already a member?
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '700', textDecoration: 'none', marginLeft: '0.5rem' }}>
            Secure Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
