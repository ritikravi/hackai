import React from 'react';

export default function SkillGapCard({ data, onClose }) {
  if (!data) return null;
  const { jobTitle, matchedSkills, missingSkills, gapPercentage, matchPercentage, roadmap } = data;

  return (
    <div style={s.overlay}>
      <div style={s.modal} className="card">
        <div style={s.header}>
          <h3 style={s.title}>Skill Gap Analysis</h3>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '0.3rem 0.7rem' }}>✕</button>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem' }}>{jobTitle}</p>

        {/* Match bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Overall Match</span>
            <span style={{ fontWeight: 700, color: matchPercentage >= 70 ? '#22c55e' : '#f59e0b' }}>{matchPercentage}%</span>
          </div>
          <div style={{ background: '#0f172a', borderRadius: 999, height: 10 }}>
            <div style={{ width: `${matchPercentage}%`, height: '100%', background: matchPercentage >= 70 ? '#22c55e' : '#f59e0b', borderRadius: 999, transition: 'width 0.8s' }} />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600, marginBottom: '0.5rem' }}>✓ MATCHED SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {matchedSkills.length ? matchedSkills.map((s, i) => (
                <span key={i} style={{ background: '#16653422', color: '#22c55e', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem' }}>{s}</span>
              )) : <span style={{ color: '#64748b', fontSize: '0.8rem' }}>None matched</span>}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>✗ MISSING SKILLS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {missingSkills.length ? missingSkills.map((s, i) => (
                <span key={i} style={{ background: '#7f1d1d22', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem' }}>{s}</span>
              )) : <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>All skills matched!</span>}
            </div>
          </div>
        </div>

        {roadmap.length > 0 && (
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.75rem' }}>📍 LEARNING ROADMAP</div>
            {roadmap.map((item, i) => (
              <div key={i} style={s.roadmapItem}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.85rem' }}>{item.skill}</span>
                  <span style={{ fontSize: '0.7rem', color: item.priority === 'High' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>{item.priority} Priority</span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.25rem' }}>{item.suggestion}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: { position: 'fixed', inset: 0, background: '#00000088', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' },
  modal: { width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  title: { fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9' },
  roadmapItem: { background: '#0f172a', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' },
};
