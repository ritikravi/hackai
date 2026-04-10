import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { getPrediction } from '../services/api';

const trendIcon = (t) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
const trendColor = (t) => t === 'up' ? '#22c55e' : t === 'down' ? '#ef4444' : '#f59e0b';

export default function PredictionDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrediction().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  // Simulate historical data for chart
  const chartData = data ? Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    score: Math.max(0, Math.min(100, Math.round(data.placementScore - (6 - i) * (data.trend === 'up' ? 2 : data.trend === 'down' ? -2 : 0.5)))),
  })) : [];

  return (
    <div>
      <Navbar />
      <div style={s.page}>
        <h2 style={s.title}>🎯 Placement Prediction Engine</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>AI-powered score based on skills, applications, and interview performance</p>

        {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
          <>
            {/* Score cards */}
            <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: data.placementScore >= 70 ? '#22c55e' : data.placementScore >= 40 ? '#f59e0b' : '#ef4444' }}>
                  {data.placementScore}%
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Placement Score</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: trendColor(data.trend) }}>
                  {trendIcon(data.trend)}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Trend ({data.trend})</div>
              </div>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#6366f1' }}>{data.confidence}%</div>
                <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Confidence Score</div>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={s.cardTitle}>Score Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                {[
                  { label: 'Skills (40% weight)', value: Math.min(data.skillCount * 4, 40), max: 40, color: '#6366f1' },
                  { label: 'Applications (30% weight)', value: Math.min(data.appCount * 6, 30), max: 30, color: '#22c55e' },
                  { label: 'Interview Score (30% weight)', value: Math.round((data.interviewScore / 10) * 30), max: 30, color: '#f59e0b' },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{item.label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: item.color }}>{item.value}/{item.max}</span>
                    </div>
                    <div style={{ background: '#0f172a', borderRadius: 999, height: 8 }}>
                      <div style={{ width: `${(item.value / item.max) * 100}%`, height: '100%', background: item.color, borderRadius: 999, transition: 'width 0.8s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Line chart */}
            <div className="card">
              <h3 style={s.cardTitle}>Score Trend (7 Days)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                  <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page: { padding: '2rem', maxWidth: 1000, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' },
  cardTitle: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' },
};
