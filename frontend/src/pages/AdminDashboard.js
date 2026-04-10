import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import SkillTags from '../components/SkillTags';
import { getStudents, getAnalytics, getRiskStudents, getAdminAlerts, createJob, updateAppStatus } from '../services/api';

const TABS = ['Overview', 'Students', 'Risk', 'Alerts', 'Add Job'];
const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('Overview');
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [riskStudents, setRiskStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobForm, setJobForm] = useState({ company: '', role: '', skillsRequired: '', location: 'Remote', salary: '', description: '' });
  const [jobMsg, setJobMsg] = useState('');

  useEffect(() => {
    Promise.all([getAnalytics(), getStudents(), getRiskStudents(), getAdminAlerts()])
      .then(([a, s, r, al]) => {
        setAnalytics(a.data);
        setStudents(s.data);
        setRiskStudents(r.data);
        setAlerts(al.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setJobMsg('');
    try {
      await createJob({
        ...jobForm,
        skillsRequired: jobForm.skillsRequired.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setJobMsg('Job created successfully!');
      setJobForm({ company: '', role: '', skillsRequired: '', location: 'Remote', salary: '', description: '' });
    } catch (err) {
      setJobMsg(err.response?.data?.message || 'Failed to create job');
    }
  };

  const handleStatusChange = async (appId, status) => {
    try {
      await updateAppStatus(appId, status);
      const res = await getStudents();
      setStudents(res.data);
    } catch {}
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;

  const pieData = [
    { name: 'Placed', value: analytics?.placed || 0 },
    { name: 'Unplaced', value: analytics?.unplaced || 0 },
    { name: 'At Risk', value: analytics?.atRisk || 0 },
    { name: 'Ready', value: analytics?.ready || 0 },
  ];

  const barData = [
    { name: 'Total', value: analytics?.totalStudents || 0 },
    { name: 'Ready', value: analytics?.ready || 0 },
    { name: 'At Risk', value: analytics?.atRisk || 0 },
    { name: 'Unprepared', value: analytics?.unprepared || 0 },
    { name: 'Placed', value: analytics?.placed || 0 },
  ];

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        <h2 style={styles.title}>TPC Admin Dashboard</h2>

        {/* Tabs */}
        <div style={styles.tabs}>
          {TABS.map((t) => (
            <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setTab(t)} style={{ fontSize: '0.8rem' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'Overview' && (
          <div>
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
              <StatCard label="Total Students" value={analytics?.totalStudents || 0} icon="👥" color="#6366f1" />
              <StatCard label="Placed" value={analytics?.placed || 0} icon="🏆" color="#22c55e" />
              <StatCard label="At Risk" value={analytics?.atRisk || 0} icon="⚠️" color="#f59e0b" />
              <StatCard label="Applications" value={analytics?.totalApplications || 0} icon="📨" color="#3b82f6" />
            </div>
            <div className="grid-2">
              <div className="card">
                <h3 style={styles.cardTitle}>Student Distribution</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 style={styles.cardTitle}>Placement Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Students */}
        {tab === 'Students' && (
          <div className="card">
            <h3 style={styles.cardTitle}>All Students ({students.length})</h3>
            <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHead}>
                    <th>Name</th><th>Email</th><th>Skills</th><th>Risk</th><th>Probability</th><th>Applications</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(({ student, profile, applications }) => (
                    <tr key={student._id} style={styles.tableRow}>
                      <td style={{ fontWeight: 500 }}>{student.name}</td>
                      <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{student.email}</td>
                      <td><SkillTags skills={profile?.skills?.slice(0, 3) || []} /></td>
                      <td>
                        <span className={`badge badge-${profile?.riskLevel === 'Ready' ? 'ready' : profile?.riskLevel === 'At Risk' ? 'risk' : 'unprepared'}`}>
                          {profile?.riskLevel || 'Unprepared'}
                        </span>
                      </td>
                      <td style={{ color: '#6366f1', fontWeight: 600 }}>{profile?.placementProbability || 0}%</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {applications?.slice(0, 2).map((app) => (
                            <div key={app._id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                              <span style={{ color: '#94a3b8' }}>{app.jobId?.company}</span>
                              <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app._id, e.target.value)}
                                style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem', width: 'auto' }}
                              >
                                {['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'].map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                          {applications?.length === 0 && <span style={{ color: '#64748b', fontSize: '0.75rem' }}>None</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Risk */}
        {tab === 'Risk' && (
          <div>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>⚠️ At-Risk Students ({riskStudents.length})</h3>
            {riskStudents.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#64748b' }}>No at-risk students. Great job!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {riskStudents.map((p) => (
                  <div key={p._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.userId?.name || 'Unknown'}</div>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{p.userId?.email}</div>
                      <div style={{ marginTop: '0.5rem' }}><SkillTags skills={p.skills || []} /></div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge badge-${p.riskLevel === 'At Risk' ? 'risk' : 'unprepared'}`}>{p.riskLevel}</span>
                      <div style={{ color: '#6366f1', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.25rem' }}>{p.placementProbability}%</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>placement probability</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
        {tab === 'Alerts' && (
          <div>
            <h3 style={{ ...styles.cardTitle, marginBottom: '1rem' }}>System Alerts ({alerts.length})</h3>
            {alerts.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', color: '#64748b' }}>No alerts at this time.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {alerts.map((a) => (
                  <div key={a._id} style={{ ...styles.alertCard, borderColor: a.type === 'danger' ? '#ef4444' : a.type === 'warning' ? '#f59e0b' : '#6366f1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ marginRight: '0.5rem' }}>{a.type === 'danger' ? '🚨' : '⚠️'}</span>
                        <span style={{ fontSize: '0.875rem' }}>{a.message}</span>
                      </div>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Job */}
        {tab === 'Add Job' && (
          <div className="card" style={{ maxWidth: 600 }}>
            <h3 style={styles.cardTitle}>Post New Job</h3>
            <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {[
                { key: 'company', label: 'Company Name', placeholder: 'Google' },
                { key: 'role', label: 'Role', placeholder: 'Software Engineer' },
                { key: 'skillsRequired', label: 'Skills Required (comma-separated)', placeholder: 'React, Node.js, MongoDB' },
                { key: 'location', label: 'Location', placeholder: 'Remote' },
                { key: 'salary', label: 'Salary', placeholder: '₹12 LPA' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={styles.label}>{label}</label>
                  <input value={jobForm[key]} onChange={(e) => setJobForm({ ...jobForm, [key]: e.target.value })} placeholder={placeholder} />
                </div>
              ))}
              <div>
                <label style={styles.label}>Description</label>
                <textarea rows={3} value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Job description..." />
              </div>
              {jobMsg && <div style={{ color: jobMsg.includes('success') ? '#22c55e' : '#ef4444', fontSize: '0.875rem' }}>{jobMsg}</div>}
              <button className="btn btn-primary" type="submit">Post Job</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '2rem', maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '1.5rem' },
  tabs: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  cardTitle: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' },
  tableHead: { borderBottom: '1px solid #334155' },
  tableRow: { borderBottom: '1px solid #1e293b' },
  alertCard: { background: '#1e293b', border: '1px solid', borderRadius: 8, padding: '0.75rem 1rem' },
  label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '0.4rem' },
};
