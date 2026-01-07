import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken, verifyJWT } from "../utils/jwt";

const Home = () => {
    const nav = useNavigate();
    const token = getToken();
    const user = verifyJWT(token);

    return (
        <div style={{ paddingBottom: '5rem' }}>
            {/* Hero Section */}
            <header className="hero-light">
                <div className="container" style={{ padding: 0, maxWidth: '900px' }}>
                    <div className="animate-slide-up">
                        <h1 className="hero-title">
                            Travel Together, <span style={{ color: 'var(--primary)' }}>Travel Better</span>
                        </h1>
                        <p className="hero-description">
                            Connect with travelers heading your way. Split costs, reduce emissions, and make new friends on every journey.
                        </p>
                        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button className="btn btn-primary" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '16px' }} onClick={() => nav('/user-rides')}>
                                Find a Ride
                            </button>
                            <button className="btn btn-outline" style={{ padding: '1.2rem 3rem', fontSize: '1.1rem', borderRadius: '16px', background: 'white', borderColor: 'var(--primary)', color: 'var(--primary)' }} onClick={() => nav(user?.role === 'ROLE_DRIVER' ? '/driver-dashboard' : '/register')}>
                                {user?.role === 'ROLE_DRIVER' ? 'Post a Ride' : 'Offer a Ride'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="container" style={{ position: 'relative' }}>
                {/* 4-Column Feature Section */}
                <div className="feature-grid animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="feature-card-simple">
                        <div className="feature-icon-wrapper bg-blue-soft" style={{ borderRadius: '50%' }}>📅</div>
                        <h3 className="feature-card-title">Easy Booking</h3>
                        <p className="feature-card-desc">Book rides in seconds with our simple interface</p>
                    </div>

                    <div className="feature-card-simple">
                        <div className="feature-icon-wrapper bg-green-soft" style={{ borderRadius: '50%' }}>🤝</div>
                        <h3 className="feature-card-title">Trusted Community</h3>
                        <p className="feature-card-desc">Verified drivers and passengers</p>
                    </div>

                    <div className="feature-card-simple">
                        <div className="feature-icon-wrapper bg-indigo-soft" style={{ borderRadius: '50%' }}>🛡️</div>
                        <h3 className="feature-card-title">Safe & Secure</h3>
                        <p className="feature-card-desc">Your safety is our top priority</p>
                    </div>

                    <div className="feature-card-simple">
                        <div className="feature-icon-wrapper bg-purple-soft" style={{ borderRadius: '50%' }}>🎧</div>
                        <h3 className="feature-card-title">24/7 Support</h3>
                        <p className="feature-card-desc">We're here whenever you need us</p>
                    </div>
                </div>

                {/* Additional Info / CTA */}
                <div style={{ marginTop: '8rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h2 className="section-title" style={{ marginBottom: '1.5rem' }}>Ready to Save on Your Next Trip?</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem' }}>
                        Join thousands of users sharing rides every day.
                    </p>
                    <Link to="/why-rideshare" className="nav-item" style={{ fontSize: '1.2rem', borderBottom: '2px solid var(--primary)', paddingBottom: '4px', display: 'inline-block' }}>
                        Learn more about RideShare
                    </Link>
                </div>
            </div>
        </div>
    );
};
export default Home;
