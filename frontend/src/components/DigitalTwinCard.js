import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export default function DigitalTwinCard({ data }) {
  if (!data) return null;
  const { radarData, growthTrend, strengths, weaknesses, recommendations } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="grid-2">
        {/* Radar Chart */}
        <div className="card">
          <h3 style={s.title}>Skills vs Ideal Profile</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Radar name="You" dataKey="student" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
              <Radar name="Ideal" dataKey="ideal" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Growth Trend */}
        <div className="card">
          <h3 style={s.title}>7-Day Growth Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={growthTrend}>
              <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Summary */}
      <div className="grid-3">
        <div className="card">
          <h3 style={{ ...s.title, color: '#22c55e' }}>💪 Strengths</h3>
          <ul style={s.list}>
            {strengths?.map((item, i) => <li key={i} style={s.listItem}>✓ {item}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3 style={{ ...s.title, color: '#ef4444' }}>⚠️ Weaknesses</h3>
          <ul style={s.list}>
            {weaknesses?.map((item, i) => <li key={i} style={s.listItem}>✗ {item}</li>)}
          </ul>
        </div>
        <div className="card">
          <h3 style={{ ...s.title, color: '#6366f1' }}>🎯 Recommendations</h3>
          <ul style={s.list}>
            {recommendations?.map((item, i) => <li key={i} style={s.listItem}>→ {item}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

const s = {
  title: { fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' },
  list: { paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  listItem: { fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 },
};
