import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../services/api';

const TABS = ['Resume Preview', 'Suggestions', 'Roadmap', 'Profile Data'];

export default function ResumeGenerator() {
  const [form, setForm] = useState({ githubUsername: '', leetcodeUsername: '', linkedinSummary: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Resume Preview');
  const resumeRef = useRef();

  // Job search state
  const [jobQuery, setJobQuery] = useState('');
  const [jobResults, setJobResults] = useState([]);
  const [jobSearching, setJobSearching] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const searchJobs = async () => {
    if (!jobQuery.trim()) return;
    setJobSearching(true);
    try {
      const { data } = await api.get(`/jobs/search?q=${encodeURIComponent(jobQuery)}`);
      setJobResults(Array.isArray(data) ? data : []);
    } catch { setJobResults([]); }
    finally { setJobSearching(false); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const payload = { ...form };
      if (selectedJob) payload.marketJob = selectedJob;
      const { data } = await api.post('/ai/generate-resume', payload);
      setResult(data);
      setTab('Resume Preview');
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!window.html2pdf) { alert('PDF library not loaded yet.'); return; }
    window.html2pdf().set({
      margin: 12,
      filename: `${form.githubUsername || 'resume'}_hackai.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(resumeRef.current).save();
  };

  return (
    <div>
      <Navbar />
      <div style={s.page}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={s.title}>🧠 AI Career Intelligence System</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            Enter your profiles → AI fetches real data → generates ATS resume tailored to real jobs
          </p>
        </div>

        {/* ── Input Form ── */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="grid-3">
              <div>
                <label style={s.label}>GitHub Username</label>
                <input placeholder="e.g. torvalds" value={form.githubUsername}
                  onChange={(e) => setForm({ ...form, githubUsername: e.target.value })} />
                <div style={s.hint}>Fetches repos, languages, stars via GitHub API</div>
              </div>
              <div>
                <label style={s.label}>LeetCode Username</label>
                <input placeholder="e.g. neal_wu" value={form.leetcodeUsername}
                  onChange={(e) => setForm({ ...form, leetcodeUsername: e.target.value })} />
                <div style={s.hint}>Fetches problems solved, ranking, topics</div>
              </div>
              <div>
                <label style={s.label}>LinkedIn Summary (paste text)</label>
                <textarea rows={3} placeholder="Paste your LinkedIn About section..."
                  value={form.linkedinSummary}
                  onChange={(e) => setForm({ ...form, linkedinSummary: e.target.value })}
                  style={{ resize: 'vertical' }} />
                <div style={s.hint}>LinkedIn scraping is blocked — paste your summary</div>
              </div>
            </div>

            {/* ── Real Job Picker ── */}
            <div>
              <label style={s.label}>🎯 Target a Real Job (from LinkedIn/Indeed via JSearch)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  placeholder="Search jobs e.g. React developer, Python engineer..."
                  value={jobQuery}
                  onChange={(e) => setJobQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchJobs())}
                  style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-secondary" onClick={searchJobs} disabled={jobSearching}>
                  {jobSearching ? '...' : '🔍 Search'}
                </button>
              </div>

              {/* Job results */}
              {jobResults.length > 0 && (
                <div style={s.jobList}>
                  {jobResults.map((job, i) => (
                    <div key={i}
                      onClick={() => setSelectedJob(selectedJob?.company === job.company && selectedJob?.role === job.role ? null : job)}
                      style={{
                        ...s.jobItem,
                        borderColor: selectedJob?.company === job.company && selectedJob?.role === job.role ? '#6366f1' : '#334155',
                        background: selectedJob?.company === job.company && selectedJob?.role === job.role ? '#6366f122' : '#0f172a',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.875rem' }}>{job.company}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{job.role}</div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>📍 {job.location} · {job.source}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '1rem' }}>
                          <div style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>{job.salary}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: 4, justifyContent: 'flex-end' }}>
                            {job.skillsRequired?.slice(0, 3).map((sk, j) => (
                              <span key={j} style={{ background: '#6366f122', color: '#a5b4fc', padding: '0.1rem 0.4rem', borderRadius: 999, fontSize: '0.65rem' }}>{sk}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected job badge */}
              {selectedJob && (
                <div style={s.selectedJob}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ Targeting:</span>
                  <span style={{ color: '#e2e8f0', marginLeft: '0.5rem' }}>{selectedJob.role} at {selectedJob.company}</span>
                  <span style={{ color: '#64748b', marginLeft: '0.5rem', fontSize: '0.8rem' }}>({selectedJob.location})</span>
                  <button type="button" onClick={() => setSelectedJob(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                </div>
              )}
              {!selectedJob && <div style={s.hint}>Select a job to get match score + tailored resume + auto-assigned learning tasks</div>}
            </div>

            {error && <div style={s.error}>{error}</div>}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ padding: '0.75rem 2rem', fontSize: '1rem', alignSelf: 'flex-start' }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Analyzing & generating...
                </span>
              ) : '⚡ Generate Career Profile'}
            </button>
          </form>
        </div>

        {loading && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8' }}>Fetching GitHub repos... analyzing LeetCode... generating AI resume...</p>
          </div>
        )}

        {result && !loading && (
          <>
            {/* ── Intelligence Dashboard ── */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ ...s.cardTitle, marginBottom: '1.25rem' }}>📊 Resume Intelligence Dashboard</h3>
              <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
                <ScoreCircle label="Resume Score" value={result.resumeScore || 0} />
                <ScoreCircle label="Profile Complete" value={result.profileCompleteness || 0} />
                {result.jobMatchScore !== null && result.jobMatchScore !== undefined
                  ? <ScoreCircle label="Job Match" value={result.jobMatchScore} />
                  : <div style={{ background: '#0f172a', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', color: '#475569' }}>—</div>
                      <div style={{ color: '#475569', fontSize: '0.75rem' }}>Job Match</div>
                      <div style={{ color: '#334155', fontSize: '0.7rem', marginTop: 2 }}>Search & select a job</div>
                    </div>
                }
                <div style={{ background: '#0f172a', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1' }}>{result.githubData?.publicRepos || 0} repos</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>GitHub Activity</div>
                  <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: 4 }}>⭐ {result.githubData?.totalStars || 0} stars</div>
                </div>
              </div>

              {/* Skill Intelligence */}
              {result.skillIntelligence && (
                <div className="grid-3" style={{ marginBottom: '1rem' }}>
                  <SkillGroup label="💪 Strong Skills" skills={result.skillIntelligence.strongSkills} color="#22c55e" />
                  <SkillGroup label="⚠️ Weak Skills" skills={result.skillIntelligence.weakSkills} color="#f59e0b" />
                  <SkillGroup label="🎯 Recommended" skills={result.skillIntelligence.recommendedSkills} color="#6366f1" />
                </div>
              )}

              {/* Job match details */}
              {result.jobTitle && (
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                  <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                    Matched against: <span style={{ color: '#6366f1', fontWeight: 600 }}>{result.jobTitle}</span>
                  </div>
                  {result.missingSkills?.length > 0 && (
                    <>
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                        🚨 Missing skills for this role:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {result.missingSkills.map((sk, i) => (
                          <span key={i} style={{ background: '#ef444422', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem' }}>{sk}</span>
                        ))}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        ✅ Learning tasks auto-assigned to your dashboard
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Highlights */}
              {result.highlights?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>🏆 Key Highlights</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {result.highlights.map((h, i) => (
                      <span key={i} style={{ background: '#6366f122', color: '#a5b4fc', padding: '0.3rem 0.75rem', borderRadius: 8, fontSize: '0.8rem' }}>{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {TABS.map((t) => (
                <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setTab(t)} style={{ fontSize: '0.8rem' }}>{t}</button>
              ))}
              <button className="btn btn-success" onClick={handleDownloadPDF} style={{ marginLeft: 'auto' }}>
                📥 Download PDF
              </button>
            </div>

            {tab === 'Resume Preview' && (
              <div className="card">
                <div ref={resumeRef} style={{ background: '#fff', borderRadius: 8, padding: '2rem' }}>
                  {result.summary && (
                    <div style={{ background: '#f8fafc', borderLeft: '4px solid #6366f1', padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: '0 8px 8px 0' }}>
                      <p style={{ color: '#334155', fontSize: '0.875rem', fontStyle: 'italic', margin: 0 }}>{result.summary}</p>
                    </div>
                  )}
                  <pre style={{ fontFamily: 'Georgia, serif', fontSize: '0.875rem', color: '#1e293b', whiteSpace: 'pre-wrap', lineHeight: 1.8, margin: 0 }}>
                    {result.resumeText}
                  </pre>
                </div>
              </div>
            )}

            {tab === 'Suggestions' && (
              <div className="card">
                <h3 style={s.cardTitle}>💡 AI Suggestions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {result.suggestionsArray?.length > 0
                    ? result.suggestionsArray.map((sug, i) => (
                        <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', gap: '0.75rem' }}>
                          <span style={{ color: '#6366f1', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.6 }}>{sug}</span>
                        </div>
                      ))
                    : <pre style={{ color: '#94a3b8', fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{result.suggestions}</pre>
                  }
                </div>
              </div>
            )}

            {tab === 'Roadmap' && (
              <div className="card">
                <h3 style={s.cardTitle}>🗺️ 30-Day Improvement Roadmap</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {result.roadmapArray?.length > 0
                    ? result.roadmapArray.map((r, i) => (
                        <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '1rem', borderLeft: `3px solid ${['#6366f1','#22c55e','#f59e0b','#ef4444'][i]}` }}>
                          <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '0.25rem' }}>{r.week}</div>
                          <div style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>{r.focus}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{r.tasks}</div>
                        </div>
                      ))
                    : <pre style={{ color: '#94a3b8', fontSize: '0.875rem', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{result.improvementPlan}</pre>
                  }
                </div>
              </div>
            )}

            {tab === 'Profile Data' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {result.githubData && (
                  <div className="card">
                    <h3 style={s.cardTitle}>GitHub Profile</h3>
                    <div style={{ marginTop: '1rem' }}>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Top Languages</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                        {result.githubData.topLanguages.map((l, i) => (
                          <span key={i} style={tag('#6366f1')}>{l}</span>
                        ))}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Top Projects</div>
                      {result.projectsDetailed?.map((p, i) => (
                        <div key={i} style={{ background: '#0f172a', borderRadius: 8, padding: '0.75rem', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.name}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>⭐ {p.stars}</span>
                              <span style={{
                                background: p.impactLevel === 'High Impact' ? '#16653422' : p.impactLevel === 'Moderate' ? '#92400e22' : '#1e3a5f22',
                                color: p.impactLevel === 'High Impact' ? '#22c55e' : p.impactLevel === 'Moderate' ? '#f59e0b' : '#93c5fd',
                                padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                              }}>{p.impactLevel}</span>
                            </div>
                          </div>
                          <div style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.25rem 0' }}>{p.description}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                            {p.techStack?.map((t, j) => <span key={j} style={tag('#22c55e')}>{t}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.leetcodeData && (
                  <div className="card">
                    <h3 style={s.cardTitle}>LeetCode Stats</h3>
                    <div className="grid-4" style={{ marginTop: '1rem' }}>
                      {[
                        { label: 'Total Solved', value: result.leetcodeData.totalSolved, color: '#6366f1' },
                        { label: 'Easy', value: result.leetcodeData.easy, color: '#22c55e' },
                        { label: 'Medium', value: result.leetcodeData.medium, color: '#f59e0b' },
                        { label: 'Hard', value: result.leetcodeData.hard, color: '#ef4444' },
                      ].map((item) => (
                        <div key={item.label} style={{ textAlign: 'center', background: '#0f172a', borderRadius: 8, padding: '0.75rem' }}>
                          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        Level: <span style={{ color: '#6366f1', fontWeight: 600 }}>{result.leetcodeData.level}</span>
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        Rank: <span style={{ color: '#f59e0b', fontWeight: 600 }}>#{result.leetcodeData.ranking?.toLocaleString()}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                      {result.leetcodeData.topTopics?.map((t, i) => <span key={i} style={tag('#f59e0b')}>{t}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const ScoreCircle = ({ label, value }) => {
  const color = value >= 75 ? '#22c55e' : value >= 50 ? '#f59e0b' : '#ef4444';
  const lbl = value >= 75 ? 'Excellent' : value >= 50 ? 'Good' : 'Needs Work';
  return (
    <div style={{ background: '#0f172a', borderRadius: 10, padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{value}%</div>
      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>{label}</div>
      <div style={{ color, fontSize: '0.7rem', fontWeight: 600, marginTop: 2 }}>{lbl}</div>
      <div style={{ background: '#1e293b', borderRadius: 999, height: 6, marginTop: 8 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.8s' }} />
      </div>
    </div>
  );
};

const SkillGroup = ({ label, skills, color }) => (
  <div style={{ background: '#0f172a', borderRadius: 10, padding: '0.75rem' }}>
    <div style={{ fontSize: '0.75rem', color, fontWeight: 600, marginBottom: '0.5rem' }}>{label}</div>
    {skills?.length > 0
      ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
          {skills.map((sk, i) => <span key={i} style={tag(color)}>{sk}</span>)}
        </div>
      : <span style={{ color: '#475569', fontSize: '0.75rem' }}>None detected</span>
    }
  </div>
);

const tag = (color) => ({
  background: color + '22', color,
  padding: '0.2rem 0.6rem', borderRadius: 999,
  fontSize: '0.75rem', fontWeight: 500,
});

const s = {
  page: { padding: '2rem', maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' },
  label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '0.4rem' },
  hint: { fontSize: '0.7rem', color: '#475569', marginTop: '0.3rem' },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '0.75rem', borderRadius: 8, fontSize: '0.875rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 600, color: '#e2e8f0' },
  jobList: { maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' },
  jobItem: { border: '1px solid', borderRadius: 8, padding: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' },
  selectedJob: { display: 'flex', alignItems: 'center', background: '#16653422', border: '1px solid #22c55e44', borderRadius: 8, padding: '0.6rem 1rem', fontSize: '0.875rem' },
};
