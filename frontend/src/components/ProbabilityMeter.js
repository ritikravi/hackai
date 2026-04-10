import React from 'react';

export default function ProbabilityMeter({ value = 0 }) {
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Placement Probability</span>
        <span style={{ fontWeight: 700, color, fontSize: '1rem' }}>{value}%</span>
      </div>
      <div style={{ background: '#0f172a', borderRadius: 999, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}
