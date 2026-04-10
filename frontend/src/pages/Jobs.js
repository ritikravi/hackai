import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import SkillTags from '../components/SkillTags';
import SkillGapCard from '../components/SkillGapCard';
import { getJobs, applyToJob, getSkillGap } from '../services/api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState({});
  const [messages, setMessages] = useState({});
  const [search, setSearch] = useState('');
  const [skillGap, setSkillGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(null);

  useEffect(() => {
    getJobs().then((r) => setJobs(r.data)).finally(() => setLoading(false));
  }, []);

  const handleSkillGap = async (jobId) => {
    setGapLoading(jobId);
    try {
      const { data } = await getSkillGap(jobId);
      setSkillGap(data);
    } catch {}
    finally { setGapLoading(null); }
  };

  const handleApply = async (jobId) => {    setApplying((p) => ({ ...p, [jobId]: true }));
    try {
      await applyToJob(jobId);
      setMessages((p) => ({ ...p, [jobId]: { text: 'Applied!', ok: true } }));
    } catch (err) {
      setMessages((p) => ({ ...p, [jobId]: { text: err.response?.data?.message || 'Failed', ok: false } }));
    } finally {
      setApplying((p) => ({ ...p, [jobId]: false }));
    }
  };

  const filtered = jobs.filter(
    (j) =>
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Navbar />
      {skillGap && <SkillGapCard data={skillGap} onClose={() => setSkillGap(null)} />}
      <div style={styles.page}>
        <div style={styles.header}>
          <h2 style={styles.title}>Job Recommendations</h2>
          <input placeholder="Search company or role..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: '#64748b' }}>No jobs found. Ask your TPC admin to add job listings.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((job) => (
              <div key={job._id} className="card" style={styles.jobCard}>
                <div style={styles.jobLeft}>
                  <div style={styles.company}>{job.company}</div>
                  <div style={styles.role}>{job.role}</div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary}</span>
                    {job.deadline && <span>⏰ {new Date(job.deadline).toLocaleDateString()}</span>}
                  </div>
                  <div style={{ marginTop: '0.75rem' }}>
                    <SkillTags skills={job.skillsRequired} />
                  </div>
                </div>
                <div style={styles.jobRight}>
                  <div style={styles.matchBadge(job.matchScore)}>
                    {job.matchScore}% match
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleApply(job._id)}
                    disabled={applying[job._id]}
                    style={{ marginTop: '0.5rem' }}
                  >
                    {applying[job._id] ? 'Applying...' : 'Apply Now'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleSkillGap(job._id)}
                    disabled={gapLoading === job._id}
                    style={{ marginTop: '0.4rem', fontSize: '0.75rem' }}
                  >
                    {gapLoading === job._id ? '...' : '🔍 Skill Gap'}
                  </button>
                  {messages[job._id] && (
                    <div style={{ fontSize: '0.75rem', color: messages[job._id].ok ? '#22c55e' : '#ef4444', marginTop: 4 }}>
                      {messages[job._id].text}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '2rem', maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' },
  jobCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' },
  jobLeft: { flex: 1 },
  jobRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 120 },
  company: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' },
  role: { fontSize: '0.875rem', color: '#94a3b8', marginTop: 2 },
  matchBadge: (score) => ({
    background: score >= 70 ? '#166534' : score >= 40 ? '#92400e' : '#1e3a5f',
    color: score >= 70 ? '#86efac' : score >= 40 ? '#fcd34d' : '#93c5fd',
    padding: '0.25rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700,
  }),
};
