import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { to: '/dashboard', label: 'Dashboard', role: 'student' },
  { to: '/prediction', label: 'Prediction', role: 'student' },
  { to: '/digital-twin', label: 'Digital Twin', role: 'student' },
  { to: '/jobs', label: 'Jobs', role: 'student' },
  { to: '/interview', label: 'Interview', role: 'student' },
  { to: '/interview-analytics', label: 'Analytics', role: 'student' },
  { to: '/coach', label: 'AI Coach', role: 'student' },
  { to: '/market', label: 'Market', role: 'student' },
  { to: '/generate-resume', label: 'AI Resume', role: 'student' },
  { to: '/video-interview', label: '🎥 Video', role: 'student' },
  { to: '/admin', label: 'Dashboard', role: 'admin' },
  { to: '/admin/interventions', label: 'Interventions', role: 'admin' },
  { to: '/market', label: 'Market', role: 'admin' },
  { to: '/generate-resume', label: 'AI Resume', role: 'admin' },
  { to: '/video-interview', label: '🎥 Video', role: 'admin' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>
        <span style={styles.logo}>⚡</span> HackAI
      </Link>
      <div style={styles.links}>
        {navLinks
          .filter((l) => l.role === user?.role)
          .map((l) => (
            <Link
              key={l.to}
              to={l.to}
              style={{ ...styles.link, ...(location.pathname === l.to ? styles.activeLink : {}) }}
            >
              {l.label}
            </Link>
          ))}
      </div>
      <div style={styles.user}>
        <span style={styles.userName}>{user?.name}</span>
        <span style={styles.roleBadge}>{user?.role}</span>
        <button className="btn btn-secondary" onClick={handleLogout} style={{ padding: '0.4rem 0.8rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 2rem', height: '60px',
    background: '#1e293b', borderBottom: '1px solid #334155',
    position: 'sticky', top: 0, zIndex: 100,
  },
  brand: { color: '#6366f1', fontWeight: 700, fontSize: '1.2rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  logo: { fontSize: '1.4rem' },
  links: { display: 'flex', gap: '0.25rem' },
  link: { color: '#94a3b8', textDecoration: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.875rem', transition: 'all 0.2s' },
  activeLink: { color: '#e2e8f0', background: '#334155' },
  user: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  userName: { color: '#e2e8f0', fontSize: '0.875rem' },
  roleBadge: { background: '#312e81', color: '#a5b4fc', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' },
};
