import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, verifyJWT } from "../utils/jwt";

const Home = () => {
    const nav = useNavigate();
    const token = getToken();
    const user = verifyJWT(token);

    return (
        <div className="container" style={{ paddingBottom: '5rem' }}>
            {/* Hero Section */}
            <div className="animate-slide-up" style={{
                textAlign: 'center',
                padding: '2rem 1rem 3rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '60vh',
                justifyContent: 'center'
            }}>
                <h1 style={{
                    fontSize: '4rem',
                    marginBottom: '1.5rem',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #a5b4fc 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1.1,
                    fontWeight: 900
                }}>
                    RideShare
                </h1>
                <p style={{
                    fontSize: '1.5rem',
                    color: 'var(--text-muted)',
                    maxWidth: '600px',
                    marginBottom: '3rem',
                    lineHeight: 1.6
                }}>
                    The smartest way to travel together. Safe, affordable, and eco-friendly carpooling for everyone.
                </p>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {!user ? (
                        <>
                            <button className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem' }} onClick={() => nav('/login')}>
                                Login
                            </button>
                            <button className="btn btn-outline" style={{ padding: '1rem 2.5rem', fontSize: '1.2rem' }} onClick={() => nav('/register')}>
                                Sign Up
                            </button>
                        </>
                    ) : (
                        <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            Welcome back, <strong>{user.name}</strong>!
                        </div>
                    )}
                </div>
            </div>

            {/* Main Options */}
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>

                {/* Find a Ride */}
                <div className="card glass animate-slide-up" style={{ padding: '3rem', animationDelay: '0.1s', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => nav('/user-rides')}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
                    <h2 style={{ marginBottom: '1rem' }}>Find a Ride</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Book a seat in a reliable car for your next journey. Save money and travel in comfort.
                    </p>
                    <button className="btn btn-primary" style={{ width: '100%' }}>Search Rides</button>
                </div>

                {/* Become a Host */}
                <div className="card glass animate-slide-up" style={{ padding: '3rem', animationDelay: '0.2s', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => nav(user?.role === 'ROLE_DRIVER' ? '/driver-dashboard' : '/register')}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
                    <h2 style={{ marginBottom: '1rem' }}>Become a Host</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                        Driving somewhere? Offer your empty seats, cover your fuel costs, and meet new people.
                    </p>
                    <button className="btn btn-outline" style={{ width: '100%' }}>
                        {user?.role === 'ROLE_DRIVER' ? 'Post a Ride' : 'Start Driving'}
                    </button>
                </div>
            </div>

            {/* Secondary Links */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <Link to="/why-rideshare" style={{
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    borderBottom: '1px dashed var(--text-muted)',
                    fontSize: '1.1rem'
                }}>
                    Why choose RideShare?
                </Link>
            </div>
        </div>
    );
};

export default Home;
