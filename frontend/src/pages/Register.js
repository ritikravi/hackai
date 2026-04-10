import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signup } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await signup(form);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.header}>
          <span style={styles.logo}>⚡</span>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.sub}>Join HackAI Placement Platform</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input type={type} placeholder={placeholder} value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })} required />
            </div>
          ))}
          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="admin">TPC Admin</option>
            </select>
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Create Account'}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  box: { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 420 },
  header: { textAlign: 'center', marginBottom: '2rem' },
  logo: { fontSize: '2.5rem' },
  title: { fontSize: '1.75rem', fontWeight: 700, color: '#6366f1', margin: '0.25rem 0' },
  sub: { color: '#64748b', fontSize: '0.875rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem' },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem' },
  link: { color: '#6366f1', textDecoration: 'none' },
};
