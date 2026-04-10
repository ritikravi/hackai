import React from 'react';

export default function StatCard({ label, value, icon, color = '#6366f1', sub }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f1f5f9' }}>{value}</div>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{label}</div>
        {sub && <div style={{ fontSize: '0.75rem', color: color, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
