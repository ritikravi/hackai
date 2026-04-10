import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import DigitalTwinCard from '../components/DigitalTwinCard';
import { getDigitalTwin } from '../services/api';

export default function DigitalTwinPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDigitalTwin()
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load digital twin'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>
          🧬 Your Digital Twin
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          AI-generated dynamic profile — your strengths, gaps, and growth trajectory
        </p>

        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>}
        {error && <div style={{ color: '#ef4444', padding: '1rem' }}>{error}</div>}
        {data && <DigitalTwinCard data={data} />}
      </div>
    </div>
  );
}
