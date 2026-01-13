import React, { useRef } from "react";
import html2pdf from "html2pdf.js";

const DriverReceiptModal = ({ isOpen, onClose, booking }) => {
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
    const receiptNo = `ERN-${invoiceYear}-${String(booking.id).padStart(4, '0')}`;
    const invoiceDate = formatDate(rideDate);

    const driverName = booking.ride?.driverName || "Partner";
    const vehicle = booking.ride?.vehicleType || "Vehicle";
    const passengerName = booking.passengers?.[0]?.name || booking.userName || "Passenger";

    // Financials
    const totalFare = booking.totalPrice || 0;

    const handleDownload = () => {
        const element = contentRef.current;
        const opt = {
            margin: 10,
            filename: `${receiptNo}.pdf`,
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
                maxWidth: '700px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                fontFamily: 'Arial, sans-serif'
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
                <div style={{ paddingBottom: '20px', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h2 style={{ margin: 0, color: '#10b981', fontSize: '24px' }}>RideShare Partner</h2>
                            <p style={{ margin: '5px 0 0', color: '#666', fontSize: '14px' }}>Earnings Receipt</p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '13px', color: '#666' }}>
                            <p style={{ margin: 0 }}><strong>Receipt No:</strong> <span style={{ fontFamily: 'monospace' }}>{receiptNo}</span></p>
                            <p style={{ margin: '5px 0 0' }}><strong>Date:</strong> {invoiceDate}</p>
                        </div>
                    </div>
                </div>

                {/* Partner Details */}
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ margin: '0 0 10px', color: '#333' }}>Partner Details:</h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
                        <strong>Name:</strong> {driverName}<br />
                        <strong>Vehicle:</strong> {vehicle}
                    </p>
                </div>

                {/* Trip Details Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px', border: '1px solid #eee' }}>
                    <thead>
                        <tr style={{ background: '#10b981', color: 'white' }}>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px' }}>Trip Details</th>
                            <th style={{ padding: '10px', textAlign: 'left', fontSize: '14px' }}>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#555' }}>Route</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', fontWeight: '500' }}>
                                {booking.ride?.fromLocation} &rarr; {booking.ride?.toLocation}
                            </td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#555' }}>Date</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', fontWeight: '500' }}>{invoiceDate}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#555' }}>Passenger</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', fontWeight: '500' }}>{passengerName}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', color: '#555' }}>Seats Booked</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #eee', fontSize: '14px', fontWeight: '500' }}>{booking.seats}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Earnings Breakdown */}
                <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px' }}>
                    <h4 style={{ margin: '0 0 15px', color: '#333' }}>Earnings Breakdown</h4>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#555' }}>
                        <span>Total Fare Collected</span>
                        <span>Rs. {totalFare.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', color: '#ef4444' }}>
                        <span>Less: Platform Fee & Tax (7%)</span>
                        <span>- Rs. {(totalFare - (totalFare / 1.07 * 0.98)).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', color: '#10b981', borderTop: '2px solid #eee', paddingTop: '10px' }}>
                        <span>Net Payout</span>
                        <span>Rs. {(totalFare / 1.07 * 0.98).toFixed(2)}</span>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="modal-footer" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                    <button onClick={handleDownload} style={{
                        padding: '12px 30px',
                        background: '#10b981',
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

export default DriverReceiptModal;
