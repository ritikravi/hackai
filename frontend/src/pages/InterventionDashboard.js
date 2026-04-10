import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { getInterventions, getRiskDetection, runAgent } from '../services/api';

export default function InterventionDashboard() {
  const [interventions, setInterventions] = useState([]);
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [agentMsg, setAgentMsg] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([getInterventions(), getRiskDetection()])
      .then(([i, r]) => { setInterventions(i.data); setRisks(r.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleRunAgent = async () => {
    setRunning(true);
    setAgentMsg('');
    try {
      const { data } = await runAgent();
      setAgentMsg(`Agent cycle complete. Processed ${data.results.length} students.`);
      fetchData();
    } catch { setAgentMsg('Agent run failed'); }
    finally { setRunning(false); }
  };

  const riskColor = { HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#22c55e' };

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' }}>🤖 Autonomous Intervention Dashboard</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>AI agent monitors and intervenes automatically</p>
          </div>
          <div>
            <button className="btn btn-primary" onClick={handleRunAgent} disabled={running}>
              {running ? 'Running Agent...' : '▶ Run Agent Now'}
            </button>
            {agentMsg && <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: 4 }}>{agentMsg}</div>}
          </div>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner" /></div> : (
          <>
            {/* Risk Detection */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>⚠️ Current Risk Detection ({risks.length} students)</h3>
              {risks.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No at-risk students detected.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {risks.map((r, i) => (
                    <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{r.student.name}</div>
                        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{r.student.email}</div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                          {r.flags.map((f, j) => (
                            <span key={j} style={{ background: '#7f1d1d22', color: '#fca5a5', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem' }}>{f}</span>
                          ))}
                        </div>
                      </div>
                      <span style={{ background: riskColor[r.riskLevel] + '22', color: riskColor[r.riskLevel], padding: '0.3rem 0.8rem', borderRadius: 999, fontWeight: 700, fontSize: '0.8rem' }}>
                        {r.riskLevel} RISK
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Intervention Logs */}
            <div className="card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>📋 Intervention Logs ({interventions.length})</h3>
              {interventions.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No interventions triggered yet. Run the agent to start.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {interventions.map((log, i) => (
                    <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{log.userId?.name || 'Unknown'}</span>
                        <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(log.triggeredAt).toLocaleString()}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>
                        Flags: {log.flags.join(', ')}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {log.actions.map((a, j) => (
                          <span key={j} style={{ background: '#6366f122', color: '#a5b4fc', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem' }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
