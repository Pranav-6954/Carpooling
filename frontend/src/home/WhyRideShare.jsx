import React from "react";
import { Link, useNavigate } from "react-router-dom";

const WhyRideShare = () => {
    const nav = useNavigate();

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div className="animate-slide-up" style={{ textAlign: 'center', padding: '2rem 1rem 3rem 1rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 900 }}>Why RideShare?</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
                    We're building the future of shared mobility, one reliable journey at a time.
                </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>

                {/* Feature 1 */}
                <div className="card glass animate-slide-up" style={{ padding: '2.5rem', animationDelay: '0.1s' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>🛡️</div>
                    <h3 style={{ marginBottom: '1rem' }}>Safety First</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Every driver is verified. With our Mutual Review System, you can see exactly who you're traveling with before you book. Reputation matters here.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="card glass animate-slide-up" style={{ padding: '2.5rem', animationDelay: '0.2s' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#10b981' }}>💸</div>
                    <h3 style={{ marginBottom: '1rem' }}>Unbeatable Value</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Save up to 70% compared to traditional cabs. Our smart pricing algorithm ensures fair costs for passengers and great fuel recovery for drivers.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="card glass animate-slide-up" style={{ padding: '2.5rem', animationDelay: '0.3s' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#8b5cf6' }}>🌍</div>
                    <h3 style={{ marginBottom: '1rem' }}>Eco-Friendly</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Reduce your carbon footprint. Every shared ride means one less car on the road, helping to decongest cities and lower emissions.
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="card glass animate-slide-up" style={{ padding: '2.5rem', animationDelay: '0.4s' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#f59e0b' }}>⚡</div>
                    <h3 style={{ marginBottom: '1rem' }}>Real-Time & Easy</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Book in seconds. Get instant confirmations, real-time notifications, and seamless payments. It's carpooling designed for the modern era.
                    </p>
                </div>
            </div>

            <div className="animate-slide-up" style={{ textAlign: 'center', marginTop: '5rem', padding: '3rem', background: 'var(--neutral-50)', borderRadius: '24px', border: '1px solid var(--border)' }}>
                <h2 style={{ marginBottom: '1rem' }}>Ready to get started?</h2>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                    <button className="btn btn-primary" style={{ padding: '1rem 2rem' }} onClick={() => nav('/')}>Join Now</button>
                    <button className="btn btn-outline" style={{ padding: '1rem 2rem' }} onClick={() => nav('/user-rides')}>Browse Rides</button>
                </div>
            </div>
        </div>
    );
};

export default WhyRideShare;
