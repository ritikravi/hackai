import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as loginApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await loginApi(form);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <div style={styles.header}>
          <span style={styles.logo}>⚡</span>
          <h1 style={styles.title}>HackAI</h1>
          <p style={styles.sub}>Unified Placement Intelligence</p>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {error && <div style={styles.error}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Sign In'}
          </button>
        </form>
        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' },
  box: { background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 400 },
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
