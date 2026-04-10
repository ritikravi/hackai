import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Navbar from '../components/Navbar';
import { getInterviewAnalytics } from '../services/api';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b'];

export default function InterviewAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInterviewAnalytics().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div><Navbar /><div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div></div>;

  const barData = data ? [
    { name: 'Technical', score: data.technicalAvg },
    { name: 'Communication', score: data.communicationAvg },
    { name: 'Confidence', score: data.confidenceAvg },
    { name: 'Overall', score: data.avgScore },
  ] : [];

  const pieData = [
    { name: 'Technical', value: data?.technicalAvg || 0 },
    { name: 'Communication', value: data?.communicationAvg || 0 },
    { name: 'Confidence', value: data?.confidenceAvg || 0 },
  ];

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem' }}>
          📊 Interview Performance Analytics
        </h2>

        {data?.totalSessions === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '3rem' }}>
            No interview sessions yet. Complete a mock interview to see analytics.
          </div>
        ) : (
          <>
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
              {[
                { label: 'Sessions', value: data.totalSessions, color: '#6366f1' },
                { label: 'Avg Score', value: `${data.avgScore}/10`, color: '#22c55e' },
                { label: 'Technical', value: `${data.technicalAvg}/10`, color: '#f59e0b' },
                { label: 'Confidence', value: `${data.confidenceAvg}/10`, color: '#3b82f6' },
              ].map((item) => (
                <div key={item.label} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{item.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>Score Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                    <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>Score Distribution</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History table */}
            <div className="card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>Session History</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155' }}>
                    <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b' }}>Topic</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b' }}>Score</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b' }}>Technical</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem', color: '#64748b' }}>Communication</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((h, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '0.5rem', color: '#64748b' }}>{new Date(h.date).toLocaleDateString()}</td>
                      <td style={{ padding: '0.5rem' }}>{h.topic}</td>
                      <td style={{ padding: '0.5rem', color: h.score >= 7 ? '#22c55e' : h.score >= 4 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{h.score}/10</td>
                      <td style={{ padding: '0.5rem' }}>{h.technicalScore}/10</td>
                      <td style={{ padding: '0.5rem' }}>{h.communicationScore}/10</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
