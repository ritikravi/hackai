import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import MockInterview from './pages/MockInterview';
import CareerCoach from './pages/CareerCoach';
import Jobs from './pages/Jobs';
import PredictionDashboard from './pages/PredictionDashboard';
import DigitalTwinPage from './pages/DigitalTwinPage';
import InterviewAnalyticsPage from './pages/InterviewAnalyticsPage';
import MarketInsightsPage from './pages/MarketInsightsPage';
import InterventionDashboard from './pages/InterventionDashboard';
import ResumeGenerator from './pages/ResumeGenerator';
import VideoInterview from './pages/VideoInterview';

const PrivateRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

const HomeRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
          <Route path="/prediction" element={<PrivateRoute role="student"><PredictionDashboard /></PrivateRoute>} />
          <Route path="/digital-twin" element={<PrivateRoute role="student"><DigitalTwinPage /></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute role="student"><Jobs /></PrivateRoute>} />
          <Route path="/interview" element={<PrivateRoute role="student"><MockInterview /></PrivateRoute>} />
          <Route path="/interview-analytics" element={<PrivateRoute role="student"><InterviewAnalyticsPage /></PrivateRoute>} />
          <Route path="/coach" element={<PrivateRoute role="student"><CareerCoach /></PrivateRoute>} />
          <Route path="/market" element={<PrivateRoute><MarketInsightsPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/interventions" element={<PrivateRoute role="admin"><InterventionDashboard /></PrivateRoute>} />
          <Route path="/generate-resume" element={<PrivateRoute><ResumeGenerator /></PrivateRoute>} />
          <Route path="/video-interview" element={<PrivateRoute><VideoInterview /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
