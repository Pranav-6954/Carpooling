import React from "react";
import { Link, useNavigate } from "react-router-dom";

const WhyRideShare = () => {
    const nav = useNavigate();

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div className="animate-slide-up" style={{ textAlign: 'center', padding: '4rem 1rem 5rem 1rem' }}>
                <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>Why choose RideShare?</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.4rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                    We are building a reliable and affordable community for everyone who travels. Simple, safe, and smart.
                </p>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>

                {/* Feature 1 */}
                <div className="card glass animate-slide-up" style={{ padding: '3rem', animationDelay: '0.1s', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🛡️</div>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Safe & Verified</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                        Every member is verified. You can check reviews and ratings before you book any ride. Safety is our priority.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="card glass animate-slide-up" style={{ padding: '3rem', animationDelay: '0.2s', borderTop: '4px solid #10b981' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>💰</div>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Low Cost</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                        Save money on every trip. Our smart sharing system helps you split costs fairly and affordably.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="card glass animate-slide-up" style={{ padding: '3rem', animationDelay: '0.3s', borderTop: '4px solid #8b5cf6' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🌱</div>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Eco Friendly</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                        Less cars on the road means less pollution. Help the planet while you travel with others.
                    </p>
                </div>

                {/* Feature 4 */}
                <div className="card glass animate-slide-up" style={{ padding: '3rem', animationDelay: '0.4s', borderTop: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>✨</div>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.75rem' }}>Easy to Use</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}>
                        Book a ride in just 3 clicks. Simple interface designed for everyone to use without any confusion.
                    </p>
                </div>
            </div>

            <div className="animate-slide-up" style={{ textAlign: 'center', marginTop: '6rem', padding: '4rem', background: 'var(--card-bg)', borderRadius: '32px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <h2 style={{ marginBottom: '1.5rem', fontSize: '2.5rem' }}>Ready to travel together?</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.2rem' }}>Join thousands of people who are already saving money and time.</p>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }} onClick={() => nav('/register')}>Join RideShare</button>
                    <button className="btn btn-outline" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }} onClick={() => nav('/user-rides')}>Find a Ride</button>
                </div>
            </div>
        </div>
    );
};

export default WhyRideShare;
