import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import SkillTags from '../components/SkillTags';
import ProbabilityMeter from '../components/ProbabilityMeter';
import { getDashboard, uploadResume, completeTask } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const fileRef = useRef();

  const fetchDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg('');
    const formData = new FormData();
    formData.append('resume', file);
    try {
      const res = await uploadResume(formData);
      setUploadMsg('Resume analyzed successfully!');
      fetchDashboard();
    } catch (err) {
      setUploadMsg(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(taskId);
      fetchDashboard();
    } catch (e) {}
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;

  const { profile, tasks, applications, alerts } = data || {};
  const taskIcons = { dsa: '💻', apply: '📨', resume: '📄', interview: '🎤', general: '✅' };

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        {/* Header */}
        <div style={styles.pageHeader}>
          <div>
            <h2 style={styles.greeting}>Welcome back, {user?.name} 👋</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Here's your placement intelligence overview</p>
          </div>
          <div>
            <input type="file" accept=".pdf" ref={fileRef} style={{ display: 'none' }} onChange={handleResumeUpload} />
            <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Analyzing...' : '📄 Upload Resume'}
            </button>
            {uploadMsg && <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 4 }}>{uploadMsg}</div>}
          </div>
        </div>

        {/* Alerts */}
        {alerts?.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ ...styles.alert, borderColor: a.type === 'danger' ? '#ef4444' : '#f59e0b' }}>
                {a.type === 'danger' ? '🚨' : '⚠️'} {a.message}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          <StatCard label="Skills" value={profile?.skills?.length || 0} icon="🛠️" color="#6366f1" />
          <StatCard label="Applications" value={applications?.length || 0} icon="📨" color="#22c55e" />
          <StatCard label="Interview Score" value={`${profile?.interviewScore || 0}/10`} icon="🎤" color="#f59e0b" />
          <StatCard label="Risk Level" value={profile?.riskLevel || 'Unprepared'} icon="📊" color={profile?.riskLevel === 'Ready' ? '#22c55e' : '#ef4444'} />
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Placement Probability */}
          <div className="card">
            <h3 style={styles.cardTitle}>Placement Probability</h3>
            <div style={{ marginTop: '1rem' }}>
              <ProbabilityMeter value={profile?.placementProbability || 0} />
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Skills</div>
              <SkillTags skills={profile?.skills || []} />
            </div>
            {profile?.weaknesses?.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>Areas to Improve</div>
                <SkillTags skills={profile.weaknesses} color="#f59e0b" />
              </div>
            )}
          </div>

          {/* AI Tasks */}
          <div className="card">
            <h3 style={styles.cardTitle}>🤖 AI Daily Tasks</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {tasks?.length === 0 && <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No tasks yet. Upload your resume to get started.</p>}
              {tasks?.map((task) => (
                <div key={task._id} style={{ ...styles.taskItem, opacity: task.completed ? 0.5 : 1 }}>
                  <span style={{ fontSize: '1.1rem' }}>{taskIcons[task.type] || '✅'}</span>
                  <span style={{ flex: 1, fontSize: '0.875rem', textDecoration: task.completed ? 'line-through' : 'none' }}>{task.text}</span>
                  {!task.completed && (
                    <button className="btn btn-success" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => handleCompleteTask(task._id)}>
                      Done
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Applications */}
        <div className="card">
          <h3 style={styles.cardTitle}>Application Status</h3>
          {applications?.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '1rem' }}>No applications yet. Browse jobs to apply.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHead}>
                  <th>Company</th><th>Role</th><th>Status</th><th>Applied</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app._id} style={styles.tableRow}>
                    <td>{app.jobId?.company || '—'}</td>
                    <td>{app.jobId?.role || '—'}</td>
                    <td><span className={`badge badge-${app.status === 'Offered' ? 'ready' : app.status === 'Rejected' ? 'unprepared' : 'info'}`}>{app.status}</span></td>
                    <td style={{ color: '#64748b', fontSize: '0.8rem' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '2rem', maxWidth: 1200, margin: '0 auto' },
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' },
  greeting: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' },
  cardTitle: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' },
  alert: { background: '#1e293b', border: '1px solid', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.5rem', fontSize: '0.875rem' },
  taskItem: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#0f172a', padding: '0.6rem 0.8rem', borderRadius: 8 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  tableHead: { borderBottom: '1px solid #334155' },
  tableRow: { borderBottom: '1px solid #1e293b' },
};
