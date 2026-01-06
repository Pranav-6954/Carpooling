import React, { useState, useEffect } from "react";
import { apiFetch, verifyJWT } from "../utils/jwt";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../common/ToastContainer";

const AddVehicle = () => {
  const { id } = useParams();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("");
  const [tickets, setTickets] = useState("");
  const [type, setType] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [route, setRoute] = useState("");
  const [reservedSeats, setReservedSeats] = useState(0);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [newStop, setNewStop] = useState("");

  const nav = useNavigate();
  const isEdit = !!id;
  const { showToast } = useToast();

  const [recommendedPrice, setRecommendedPrice] = useState(0);

  useEffect(() => {
    if (from && to) {
      const timer = setTimeout(() => {
        apiFetch("/api/fare/calculate", {
          method: "POST",
          body: JSON.stringify({ fromLocation: from, toLocation: to, viaRoute: route })
        })
          .then(data => {
            setRecommendedPrice(data.recommendedPrice);
            if (data.suggestedRoute && !route) {
              setRoute(data.suggestedRoute);
            }
          })
          .catch(console.error);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [from, to, route]);

  useEffect(() => {
    if (isEdit) {
      apiFetch(`/api/rides/${id}`).then(v => {
        setFrom(v.fromLocation);
        setTo(v.toLocation);
        setDate(v.date);
        setTime(v.time || "");
        setPrice(v.price);
        setTickets(v.tickets);
        setType(v.vehicleType);
        setImageUrl(v.imageUrl || "");
        setRoute(v.route || "");
        setPhone(v.driverPhone || "");
        apiFetch("/api/fare/calculate", {
          method: "POST",
          body: JSON.stringify({ fromLocation: v.fromLocation, toLocation: v.toLocation })
        }).then(d => setRecommendedPrice(d.recommendedPrice)).catch(console.error);
      });
    }
  }, [id, isEdit]);

  const submit = async (e) => {
    e.preventDefault();
    if (Number(price) > recommendedPrice) {
      showToast(`Price cannot exceed the recommended fare of ₹${recommendedPrice}`, 'error');
      return;
    }
    setLoading(true);
    try {
      const body = {
        fromLocation: from,
        toLocation: to,
        date,
        time,
        price: Number(price),
        tickets: Number(tickets),
        vehicleType: type,
        imageUrl,
        route,
        reservedSeats: Number(reservedSeats),
        driverPhone: phone
      };

      if (isEdit) {
        await apiFetch(`/api/rides/${id}`, { method: "PUT", body: JSON.stringify(body) });
        showToast('Ride updated successfully!', 'success');
      } else {
        await apiFetch("/api/rides", { method: "POST", body: JSON.stringify(body) });
        showToast('Ride posted successfully!', 'success');
      }
      const user = verifyJWT();
      if (user?.role === "ROLE_DRIVER") nav("/driver-dashboard");
      else nav("/admin/vehicles");
    } catch (err) {
      showToast(err.message || "Error saving ride", 'error');
    } finally {
      setLoading(false);
    }
  };

  const addStop = () => {
    if (newStop) {
      const stops = route ? route.split(" -> ") : [];
      if (!stops.includes(newStop)) {
        if (stops.length >= 2) stops.splice(stops.length - 1, 0, newStop);
        else stops.push(newStop);
        setRoute(stops.join(" -> "));
      }
      setNewStop("");
    }
  };

  const removeStop = (stopToRemove) => {
    const stops = route.split(" -> ").filter(s => s !== stopToRemove);
    setRoute(stops.join(" -> "));
  };

  return (
    <div className="container" style={{ paddingBottom: '4rem' }}>
      <div className="card glass animate-slide-up" style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem' }}>
        <h2 className="text-center" style={{ marginBottom: '2rem' }}>{isEdit ? "Update Your Ride" : "Post a New Ride"}</h2>

        <form onSubmit={submit}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Leaving From</label>
              <input className="input" placeholder="e.g. London" value={from} onChange={e => setFrom(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="label">Heading To</label>
              <input className="input" placeholder="e.g. Manchester" value={to} onChange={e => setTo(e.target.value)} required />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="label" style={{ marginBottom: 0 }}>Route Stops</label>
              {from && to && (
                <a href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`}
                  target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>View on Maps →</a>
              )}
            </div>
            <div style={{ padding: '1rem', background: 'var(--neutral-50)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="badge badge-success">{from || "?"}</span>
                {route.split(" -> ").slice(1, -1).map((stop, i) => (
                  <div key={i} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stop}
                    <span style={{ cursor: 'pointer', fontWeight: 800 }} onClick={() => removeStop(stop)}>×</span>
                  </div>
                ))}
                <span className="badge badge-success">{to || "?"}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input" style={{ marginBottom: 0, padding: '0.4rem 1rem' }} placeholder="Add a stop..." value={newStop} onChange={e => setNewStop(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStop(); } }} />
                <button type="button" className="btn btn-outline" style={{ padding: '0.5rem 1rem' }} onClick={addStop}>Add</button>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Date</label>
              <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="label">Departure Time</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <select className="input" style={{ flex: 1 }}
                  value={time ? (parseInt(time.split(':')[0]) % 12 || 12) : ""}
                  onChange={e => {
                    const h = parseInt(e.target.value || "12");
                    const m = time ? time.split(':')[1] : "00";
                    const isPm = time ? parseInt(time.split(':')[0]) >= 12 : false;
                    let newH = h;
                    if (isPm && h !== 12) newH += 12;
                    if (!isPm && h === 12) newH = 0;
                    setTime(`${String(newH).padStart(2, '0')}:${m}`);
                  }} required>
                  <option value="" disabled>Hr</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select className="input" style={{ flex: 1 }}
                  value={time ? time.split(':')[1] : "00"}
                  onChange={e => {
                    const h = time ? time.split(':')[0] : "12";
                    setTime(`${h}:${e.target.value}`);
                  }}>
                  {["00", "15", "30", "45"].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select className="input" style={{ flex: 1 }}
                  value={(!time || parseInt(time.split(':')[0]) < 12) ? "AM" : "PM"}
                  onChange={e => {
                    const isPm = e.target.value === "PM";
                    let h = time ? parseInt(time.split(':')[0]) : 12;
                    const m = time ? time.split(':')[1] : "00";
                    if (isPm && h < 12) h += 12;
                    if (!isPm && h >= 12) h -= 12;
                    setTime(`${String(h).padStart(2, '0')}:${m}`);
                  }}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Vehicle Description</label>
              <input className="input" placeholder="e.g. Silver Toyota Camry" value={type} onChange={e => setType(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="label">Price per Seat</label>
              <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
              {recommendedPrice > 0 && (
                <div style={{ fontSize: '0.8rem', marginTop: '4px', color: price > recommendedPrice ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                  Recommended: Max ₹{recommendedPrice}
                </div>
              )}
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Total Capacity</label>
              <input className="input" type="number" value={tickets} onChange={e => setTickets(e.target.value)} required />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="input-group">
              <label className="label">Contact Number</label>
              <input className="input" placeholder="+1234567890" value={phone} onChange={e => setPhone(e.target.value)} required />
            </div>
            <div className="input-group">
              <label className="label">Reserve for Self</label>
              <input className="input" type="number" min="0" value={reservedSeats} onChange={e => setReservedSeats(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? "Saving Ride..." : isEdit ? "Update Ride" : "Post Ride"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
