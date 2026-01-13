// src/admin/AnalyticsPage.jsx
import { useNavigate } from "react-router-dom";
import AnalyticsSection from "./AnalyticsSection";

const AnalyticsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="container" style={{ paddingBottom: '4rem', paddingTop: '2rem' }}>
            <div className="animate-slide-up" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{
                        marginBottom: '0.5rem',
                        background: 'linear-gradient(to right, var(--primary), #6366f1)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        display: 'inline-block'
                    }}>
                        Network Analytics
                    </h1>
                    <p style={{ color: 'var(--text-muted)' }}>Deep dive into your platform's performance</p>
                </div>
                <button
                    className="btn btn-outline"
                    onClick={() => navigate("/admin/dashboard")}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5m7 7-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>
            </div>

            {/* Reusing the AnalyticsSection which already has the 2x2 grid layout */}
            <AnalyticsSection />
        </div>
    );
};

export default AnalyticsPage;
