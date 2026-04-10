import React from 'react';

export default function SkillTags({ skills = [], color = '#6366f1' }) {
  if (!skills.length) return <span style={{ color: '#64748b', fontSize: '0.8rem' }}>No skills listed</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
      {skills.map((s, i) => (
        <span key={i} style={{ background: color + '22', color, padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 500 }}>
          {s}
        </span>
      ))}
    </div>
  );
}
