// src/admin/AnalyticsSection.jsx
import { useEffect, useState } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { apiFetch } from "../utils/jwt";

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

const AnalyticsSection = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [weekOffset, setWeekOffset] = useState(0);
    const [destPage, setDestPage] = useState(0);
    const [revenueOffset, setRevenueOffset] = useState(0);
    const destRowsPerPage = 5;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await apiFetch("/api/admin/analytics");
                setData(response);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center py-4">Loading Analytics...</div>;
    if (!data) return null;

    // --- Chart Configurations ---

    // 1. User Distribution (Doughnut)
    const userDistData = {
        labels: ['Drivers', 'Passengers', 'Admins', 'Blocked'],
        datasets: [
            {
                data: [
                    data.userDistribution.DRIVER || 0,
                    data.userDistribution.USER || 0,
                    data.userDistribution.ADMIN || 0,
                    data.userDistribution.BLOCKED || 0
                ],
                backgroundColor: [
                    '#10b981', // Emerald-500 (Driver)
                    '#f59e0b', // Amber-500 (Passenger)
                    '#3b82f6', // Blue-500 (Admin)
                    '#ef4444', // Red-500 (Blocked)
                ],
                borderWidth: 0,
            },
        ],
    };

    // 2. Ride Activity (Weekly Navigation)
    const totalDays = data.rideActivity.labels.length;
    const endIndex = totalDays - (weekOffset * 7);
    const startIndex = Math.max(0, endIndex - 7);
    const currentLabels = data.rideActivity.labels.slice(startIndex, endIndex);
    const currentData = data.rideActivity.data.slice(startIndex, endIndex);

    const activityData = {
        labels: currentLabels,
        datasets: [
            {
                label: 'New Rides',
                data: currentData,
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.2)', // Indigo-500 with opacity
                borderColor: '#6366f1',
                tension: 0.4, // Smooth curves
            },
        ],
    };

    const activityOptions = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: { beginAtZero: true, grid: { display: false } }, // Minimalist Y axis
            x: { grid: { display: false } }
        }
    };

    // 3. Booking Status (Bar Chart)
    const bookingData = {
        labels: ['Confirmed', 'Pending', 'Expired', 'Completed'],
        datasets: [
            {
                label: 'Bookings',
                data: [
                    data.bookingStatus.CONFIRMED || 0,
                    data.bookingStatus.PENDING || 0,

                    (data.bookingStatus.EXPIRED || 0),
                    data.bookingStatus.COMPLETED || 0
                ],
                backgroundColor: [
                    '#10b981', // Emerald
                    '#f59e0b', // Amber
                    '#64748b', // Slate (Expired)

                    '#6366f1', // Indigo
                ],
                borderRadius: 4,
            },
        ],
    };

    const bookingOptions = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [5, 5] } }
        }
    };

    // 4. Cancellation Reasons (Pie)
    const cancelLabels = data.cancellationReasons ? Object.keys(data.cancellationReasons) : [];
    const cancelValues = data.cancellationReasons ? Object.values(data.cancellationReasons) : [];

    const cancelChartData = {
        labels: cancelLabels,
        datasets: [{
            data: cancelValues,
            backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#64748b', '#8b5cf6'],
            borderWidth: 0
        }]
    };

    return (
        <div className="animate-slide-up" style={{ marginTop: '3rem', animationDelay: '0.3s' }}>

            {/* 1. Top Summary Cards */}
            <div className="flex justify-between items-center mb-8 px-1">
                <h2 className="text-2xl font-bold text-gray-800">Platform Analytics</h2>
                {/* Download button removed for stability during presentation */}
            </div>

            {/* 2. Main Analytics Grid (2 Columns strict) */}
            <div className="grid grid-cols-2 gap-6">

                {/* User Distribution */}
                <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">User Distribution</h3>
                    <div style={{ height: '240px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={userDistData} options={{
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'right' }
                            }
                        }} />
                    </div>
                </div>

                {/* Ride Activity (Weekly Navigation) */}
                <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Ride Activity</h3>
                        <div className="flex items-center gap-3">
                            <button
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => setWeekOffset(prev => prev + 1)}
                                disabled={startIndex <= 0}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                            </button>
                            <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide border border-gray-200">
                                {currentLabels[0]} - {currentLabels[currentLabels.length - 1]}
                            </span>
                            <button
                                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                                disabled={weekOffset === 0}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '240px' }}>
                        <Line data={activityData} options={{
                            ...activityOptions,
                            maintainAspectRatio: false,
                            elements: {
                                line: { tension: 0.4, borderWidth: 2, fill: true },
                                point: { radius: 3, hoverRadius: 6 }
                            }
                        }} />
                    </div>
                </div>

                {/* Booking Status */}
                <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-6 text-gray-800">Booking Status</h3>
                    <div style={{ height: '240px' }}>
                        <Bar data={bookingData} options={{
                            ...bookingOptions,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { borderDash: [2, 4], color: '#f3f4f6' },
                                    ticks: { stepSize: 1 }
                                },
                                x: { grid: { display: false } }
                            }
                        }} />
                    </div>
                </div>

                {/* Revenue Trends (Daily Bar Chart) */}
                <div className="card bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-800">Revenue Trends</h3>
                        {data.revenueTrends && Object.keys(data.revenueTrends).length > 0 && (
                            <div className="flex items-center gap-3">
                                <button
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    onClick={() => setRevenueOffset(prev => prev + 1)}
                                    disabled={Object.keys(data.revenueTrends).length <= (revenueOffset + 1) * 7}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wide border border-gray-200">Days</span>
                                <button
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    onClick={() => setRevenueOffset(prev => Math.max(0, prev - 1))}
                                    disabled={revenueOffset === 0}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </button>
                            </div>
                        )}
                    </div>
                    <div style={{ height: '240px' }}>
                        {data.revenueTrends && Object.keys(data.revenueTrends).length > 0 ? (() => {
                            const allKeys = Object.keys(data.revenueTrends);
                            const totalDays = allKeys.length;
                            const itemsPerPage = 7;
                            // Slicing from end logic
                            const endIndex = totalDays - (revenueOffset * itemsPerPage);
                            const startIndex = Math.max(0, endIndex - itemsPerPage);

                            const currentLabels = (endIndex > 0) ? allKeys.slice(startIndex, endIndex).map(d => {
                                // Format: 2026-01-04 -> Jan 04
                                const date = new Date(d);
                                return date.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
                            }) : [];
                            const currentData = (endIndex > 0) ? Object.values(data.revenueTrends).slice(startIndex, endIndex) : [];

                            return (
                                <Bar
                                    data={{
                                        labels: currentLabels,
                                        datasets: [{
                                            label: 'Revenue (₹)',
                                            data: currentData,
                                            backgroundColor: '#10b981',
                                            borderRadius: 4,
                                        }]
                                    }}
                                    options={{
                                        maintainAspectRatio: false,
                                        scales: {
                                            y: { beginAtZero: true, grid: { borderDash: [2, 4] } },
                                            x: { grid: { display: false } }
                                        },
                                        plugins: { legend: { display: false } }
                                    }}
                                />
                            );
                        })() : (
                            <div className="flex items-center justify-center h-full text-gray-400">No revenue data available</div>
                        )}
                    </div>
                </div>

            </div>


        </div>
    );

};

export default AnalyticsSection;
