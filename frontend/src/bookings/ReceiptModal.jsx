import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import { formatBookingId } from "../utils/formatters";

const ReceiptModal = ({ isOpen, onClose, booking }) => {
    const contentRef = useRef(null);

    if (!isOpen || !booking) return null;

    // Helper to format date
    const formatDate = (dateString, timeString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) { return dateString; }
    };

    // Calculate data safely
    const rideDate = booking.ride?.date || new Date().toISOString().split('T')[0];
    const invoiceYear = rideDate.split("-")[0] || new Date().getFullYear();
    const invoiceNo = formatBookingId(booking);
    const invoiceDate = formatDate(rideDate);
    const vehicle = booking.ride?.vehicleType || "Sedan";
    const driverName = booking.ride?.driverName || "Partner Driver";
    const ridePrice = booking.ride?.price || 0;
    const finalPrice = booking.totalPrice || (booking.seats * ridePrice);

    const handleDownload = () => {
        const element = contentRef.current;
        const opt = {
            margin: 10,
            filename: `${invoiceNo}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Clone element to remove buttons for PDF
        const clone = element.cloneNode(true);
        const buttons = clone.querySelector('.modal-footer');
        if (buttons) buttons.remove();
        const closeBtn = clone.querySelector('.close-btn');
        if (closeBtn) closeBtn.remove();

        html2pdf().from(clone).set(opt).save();
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000
        }} onClick={onClose}>
            <div ref={contentRef} style={{
                backgroundColor: 'white',
                padding: '40px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>

                {/* Close Button Mobile */}
                <button onClick={onClose} className="close-btn" style={{
                    position: 'absolute',
                    top: '10px',
                    right: '15px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '24px',
                    cursor: 'pointer'
                }}>×</button>

                {/* Header */}
                <div style={{ borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
                    <h1 style={{ margin: 0, color: '#000', fontSize: '28px' }}>RideShare</h1>
                    <p style={{ margin: 0, color: '#666' }}>Passenger Invoice</p>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div>
                        <strong>Bill To:</strong><br />
                        {booking.userName || "Customer"}<br />
                        <span style={{ fontSize: '12px', color: '#666' }}>{booking.userEmail}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <strong>Invoice:</strong> {invoiceNo}<br />
                        <strong>Date:</strong> {invoiceDate}<br />
                        <strong style={{ color: 'green' }}>PAID</strong>
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                    <thead>
                        <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                            <th style={{ padding: '10px' }}>Description</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Source</td><td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{booking.pickupLocation}</td></tr>
                        <tr><td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Destination</td><td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{booking.dropoffLocation}</td></tr>
                        <tr><td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Date</td><td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{invoiceDate}</td></tr>
                        <tr><td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Time</td><td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{booking.ride?.time || "N/A"}</td></tr>
                        <tr><td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>Seats</td><td style={{ padding: '10px', borderBottom: '1px solid #eee', textAlign: 'right' }}>{booking.seats}</td></tr>
                    </tbody>
                </table>

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold', borderTop: '2px solid #333', paddingTop: '15px' }}>
                    <span>Total Paid</span>
                    <span>Rs. {finalPrice.toFixed(2)}</span>
                </div>

                {/* Footer Buttons */}
                <div className="modal-footer" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button onClick={handleDownload} style={{
                        padding: '12px 30px',
                        background: '#000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>Save Receipt</button>

                    <button onClick={onClose} style={{
                        padding: '12px 30px',
                        background: 'white',
                        color: '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                    }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
