import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/jwt";
import { useNavigate } from "react-router-dom";
import Pagination from "../common/Pagination";

const UserBus = () => {
  const [buses, setBuses] = useState([]);
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [search, setSearch] = useState({ from: "", to: "", date: "" });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const nav = useNavigate();

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/rides").then((data) => {
      // Filter out past dates and only show OPEN rides
      const now = new Date();
      now.setHours(0, 0, 0, 0); // Today midnight

      const futureRides = data.filter(r => {
        if (!r.date) return false;
        const [y, m, d] = r.date.split('-').map(Number);
        const rideDate = new Date(y, m - 1, d);
        rideDate.setHours(0, 0, 0, 0);

        // Show if date is today or future
        return rideDate >= now;
      });

      setBuses(futureRides);
      setFilteredBuses(futureRides);
    }).catch(() => {
      setBuses([]);
      setFilteredBuses([]);
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const filtered = buses.filter((bus) => {
      const matchFrom = search.from ? bus.fromLocation.toLowerCase().includes(search.from.toLowerCase()) : true;
      const matchTo = search.to ? bus.toLocation.toLowerCase().includes(search.to.toLowerCase()) : true;
      const matchDate = search.date ? bus.date === search.date : true;
      return matchFrom && matchTo && matchDate;
    });
    setFilteredBuses(filtered);
    setCurrentPage(1);
  };

  const resetSearch = () => {
    setSearch({ from: "", to: "", date: "" });
    setFilteredBuses(buses);
    setCurrentPage(1);
  };

  const paginatedBuses = filteredBuses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container" style={{ paddingBottom: '5rem' }}>
      <div className="animate-slide-up" style={{ marginBottom: '3rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>Find Your Next Ride</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>Safe, affordable, and comfortable carpooling options.</p>
      </div>

      <div className="card glass animate-slide-up" style={{ marginBottom: '3rem', padding: '1.5rem' }}>
        <form onSubmit={handleSearch} className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'flex-end', gap: '1rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">From</label>
            <input className="input" placeholder="Leaving from..." value={search.from} onChange={(e) => setSearch({ ...search, from: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">To</label>
            <input className="input" placeholder="Going to..." value={search.to} onChange={(e) => setSearch({ ...search, to: e.target.value })} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">When</label>
            <input type="date" className="input" value={search.date} onChange={(e) => setSearch({ ...search, date: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Search</button>
            <button type="button" className="btn btn-outline" onClick={resetSearch}>Reset</button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '4rem' }}>
          <div className="animate-pulse" style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>Searching for rides...</div>
        </div>
      ) : filteredBuses.length > 0 ? (
        <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
            {paginatedBuses.map((v, idx) => (
              <div key={v.id} className="card glass animate-slide-up" style={{ padding: 0, animationDelay: `${idx * 0.1}s` }}>
                <div style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <span className="badge badge-success" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem 1.25rem' }}>
                      {v.tickets} seats left
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>₹{v.price}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)', border: '2px solid white', boxShadow: '0 0 0 2px var(--primary)' }}></div>
                      <div style={{ width: '2px', height: '40px', background: 'var(--border)' }}></div>
                      <div style={{ width: '12px', height: '12px', border: '2px solid var(--primary)', background: 'white' }}></div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Pick up at</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.fromLocation}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Drop off at</div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{v.toLocation}</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 0', borderTop: '1px solid var(--border)' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--neutral-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      {v.driverImage ? <img src={v.driverImage} style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : <span style={{ fontSize: '1.2rem' }}>👤</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700 }}>{v.driverName || "Reliable Driver"}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'var(--neutral-100)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <span style={{ color: '#fbbf24' }}>★</span>
                          <span style={{ fontWeight: 600 }}>{v.driverRating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.vehicleType}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{v.date}</div>
                      {v.time && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.time}</div>}
                    </div>
                  </div>

                  <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }} onClick={() => nav(`/book/${v.id}`)}>
                    Book This Ride
                  </button>
                </div>
              </div>
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalItems={filteredBuses.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="card glass text-center" style={{ padding: '4rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>No Rides Available</h3>
          <p style={{ color: 'var(--text-muted)', margin: '0 auto' }}>We couldn't find any rides matching your criteria. Try adjusting your search.</p>
          <button className="btn btn-outline mt-4" onClick={resetSearch}>Clear All Filters</button>
        </div>
      )}
    </div>
  );
};

export default UserBus;
