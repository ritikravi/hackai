import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Navbar from '../components/Navbar';
import { getTrendingSkills, getMarketJobs } from '../services/api';

const categoryColors = { Frontend: '#6366f1', Backend: '#22c55e', 'AI/ML': '#f59e0b', Cloud: '#3b82f6', DevOps: '#ec4899', Database: '#8b5cf6', API: '#14b8a6', Mobile: '#f97316', General: '#94a3b8' };

export default function MarketInsightsPage() {
  const [skills, setSkills] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrendingSkills(), getMarketJobs()])
      .then(([s, j]) => { 
        setSkills(Array.isArray(s.data) ? s.data : []);
        setJobs(Array.isArray(j.data) ? j.data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>📈 Job Market Insights</h2>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Real-time trending skills and market opportunities</p>

        {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
          <>
            {/* Trending skills tags */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>🔥 Trending Skills <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>— calculated from live job listings</span></h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {skills.map((s) => (
                  <div key={s._id} style={{ background: (categoryColors[s.category] || '#6366f1') + '22', border: `1px solid ${categoryColors[s.category] || '#6366f1'}44`, borderRadius: 8, padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: categoryColors[s.category] || '#6366f1', fontWeight: 600, fontSize: '0.85rem' }}>{s.skill}</span>
                    <span style={{ background: categoryColors[s.category] || '#6366f1', color: 'white', borderRadius: 999, padding: '0.1rem 0.4rem', fontSize: '0.7rem', fontWeight: 700 }}>{s.demand}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar chart */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>Skill Demand Chart</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={skills.slice(0, 8)} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis type="category" dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} width={90} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} formatter={(v) => [`${v}%`, 'Demand']} />
                  <Bar dataKey="demand" radius={[0, 4, 4, 0]}>
                    {skills.slice(0, 8).map((s, i) => <Cell key={i} fill={categoryColors[s.category] || '#6366f1'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Market jobs */}
            <div className="card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>🏢 Market Opportunities</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {jobs.map((job, i) => (
                  <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{job.company} — {job.role}</div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {job.skillsRequired.map((sk, j) => (
                          <span key={j} style={{ background: '#6366f122', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem' }}>{sk}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                      <div style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.875rem' }}>{job.salary}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{job.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
