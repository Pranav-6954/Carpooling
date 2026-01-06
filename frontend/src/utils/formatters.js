export const formatBookingId = (booking) => {
    if (!booking || !booking.id) return "N/A";

    // Use createdAt if available, otherwise fallback to current date or a default
    // Ideally we trust 'createdAt' or 'ride.date'
    const dateStr = booking.createdAt || booking.ride?.date || new Date().toISOString();
    const date = new Date(dateStr);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Pad ID to 5 digits
    const paddedId = String(booking.id).padStart(5, '0');

    return `RS${year}_${month}_${paddedId}`;
};
