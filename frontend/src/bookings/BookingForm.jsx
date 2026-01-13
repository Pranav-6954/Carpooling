import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/jwt";

const BookingForm = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const [bus, setBus] = useState(null);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [seats, setSeats] = useState(1);
  const [passengers, setPassengers] = useState([{ name: "", age: "", gender: "Male" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/api/rides/${id}`).then(data => {
      setBus(data);
      setPickup(data.fromLocation);
      setDropoff(data.toLocation);
      setFromCity(data.fromLocation);
      setToCity(data.toLocation);
    }).catch(() => nav("/user-rides"))
      .finally(() => setLoading(false));
  }, [id, nav]);

  const stops = React.useMemo(() => {
    if (!bus) return [];
    return bus.route ? bus.route.split(" -> ") : [bus.fromLocation, bus.toLocation];
  }, [bus]);

  const segmentPrice = React.useMemo(() => {
    if (!bus) return 0;
    if (!bus.route) return bus.price;
    const startIdx = stops.findIndex(s => s.toLowerCase().includes(fromCity.toLowerCase()));
    const endIdx = stops.findIndex(s => s.toLowerCase().includes(toCity.toLowerCase()));
    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) return bus.price;
    const totalHops = stops.length - 1;
    const userHops = endIdx - startIdx;
    const fraction = userHops / totalHops;
    return Math.max(bus.price * fraction, bus.price * 0.2).toFixed(2);
  }, [bus, fromCity, toCity, stops]);

  useEffect(() => {
    const n = Math.max(1, Number(seats) || 1);
    setPassengers(prev => {
      const arr = [...prev];
      while (arr.length < n) arr.push({ name: "", age: "", gender: "Male" });
      arr.length = n;
      return arr;
    });
  }, [seats]);

  const changePassenger = (i, field, val) => {
    setPassengers(prev => {
      const a = [...prev];
      a[i] = { ...a[i], [field]: val };
      return a;
    });
  };

  const submit = (e) => {
    e.preventDefault();
    const finalPickup = stops.length > 2 ? fromCity : pickup;
    const finalDropoff = stops.length > 2 ? toCity : dropoff;
    const totalPrice = Number((segmentPrice * seats).toFixed(2));

    nav("/confirm-booking", {
      state: {
        bookingData: {
          bus: bus,
          seats: seats,
          passengerNames: passengers.map(p => p.name),
          pickup: finalPickup,
          dropoff: finalDropoff,
          segmentPrice: Number(segmentPrice),
          totalPrice: totalPrice
        }
      }
    });
  };

  if (loading) return <div className="container" style={{ padding: '5rem', textAlign: 'center' }}><h3>Initializing secure booking session...</h3></div>;
  if (error) return <div className="container"><div className="badge badge-danger">Error: {error}</div></div>;

  return (
    <div className="container" style={{ paddingBottom: '5rem', maxWidth: '800px' }}>
      <div className="animate-slide-up" style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>Finalize Your Journey</h1>
        <p style={{ color: 'var(--text-muted)' }}>Secure your seat in {bus.driverName || "an expert"}'s ride</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Journey Summary */}
        <div className="card glass animate-slide-up" style={{ padding: '1.5rem', background: 'rgba(var(--primary-rgb), 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>Selected Journey</span>
            <span className="badge badge-primary">₹{segmentPrice} / seat</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {bus.fromLocation} <span style={{ color: 'var(--primary)', margin: '0 0.5rem' }}>→</span> {bus.toLocation}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>📅 {bus.date}</span>
            <span>🚗 {bus.vehicleType}</span>
          </div>
        </div>

        <form onSubmit={submit} className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="card glass" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📍</span> Trip Specifications
            </h4>

            {stops.length > 2 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="label">Boarding At</label>
                  <select className="input" value={fromCity} onChange={e => setFromCity(e.target.value)}>
                    {stops.slice(0, -1).map((s, i) => <option key={i} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label className="label">Dropping At</label>
                  <select className="input" value={toCity} onChange={e => setToCity(e.target.value)}>
                    {stops.map((s, i) => (
                      <option key={i} value={s} disabled={i <= stops.findIndex(st => st === fromCity)}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="input-group">
                  <label className="label">Pickup Point</label>
                  <input className="input" value={pickup} onChange={e => setPickup(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="label">Dropoff Point</label>
                  <input className="input" value={dropoff} onChange={e => setDropoff(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="input-group" style={{ maxWidth: '300px' }}>
              <label className="label">Co-Travelers (Seats)</label>
              <input className="input" type="number" min="1" max={bus.tickets} value={seats} onChange={e => setSeats(e.target.value)} required />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Max {bus.tickets} seats available</p>
            </div>
          </div>

          <h4 style={{ marginBottom: '1.5rem', marginLeft: '0.5rem' }}>Passenger Information</h4>
          {passengers.map((p, i) => (
            <div key={i} className="card glass animate-slide-up" style={{ padding: '1.5rem', marginBottom: '1.5rem', animationDelay: `${0.2 + (i * 0.1)}s` }}>
              <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--primary)' }}>Passenger #{i + 1}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label className="label">Full Name</label>
                  <input className="input" type="text" placeholder="As per ID" value={p.name} onChange={e => changePassenger(i, "name", e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="label">Age</label>
                  <input className="input" type="number" min="1" max="120" value={p.age} onChange={e => changePassenger(i, "age", e.target.value)} required />
                </div>
                <div className="input-group">
                  <label className="label">Gender</label>
                  <select className="input" value={p.gender} onChange={e => changePassenger(i, "gender", e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          ))}

          <div className="card glass" style={{ padding: '2rem', marginTop: '3rem', border: '1px solid var(--primary)' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Fare Breakdown</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Base Ride Fare</span>
                <span>₹{(segmentPrice * seats / 1.07).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>GST (5%)</span>
                <span>₹{(segmentPrice * seats / 1.07 * 0.05).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Platform Fee (2%)</span>
                <span>₹{(segmentPrice * seats / 1.07 * 0.02).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--primary)', paddingTop: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Total Payable</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>₹{(segmentPrice * seats).toFixed(2)}</div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              Proceed to Secure Checkout
            </button>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
              By proceeding, you agree to our terms of service and driver standards.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
