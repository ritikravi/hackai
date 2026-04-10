import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { startMockInterview, nextQuestion, evaluateAnswer } from '../services/api';

const TOPICS = ['JavaScript', 'Python', 'Data Structures', 'System Design', 'SQL', 'React', 'General CS'];

export default function MockInterview() {
  const [phase, setPhase] = useState('setup'); // setup | interview | result
  const [topic, setTopic] = useState('Data Structures');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [qCount, setQCount] = useState(0);
  const [scores, setScores] = useState([]);

  const startInterview = async () => {
    setLoading(true);
    try {
      const { data } = await startMockInterview(topic);
      setQuestion(data.question);
      setPhase('interview');
      setQCount(1);
      setHistory([]);
      setScores([]);
    } catch { alert('Failed to start interview'); }
    finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const { data } = await evaluateAnswer(question, answer);
      setEvaluation(data);
      setScores((p) => [...p, data.score]);
      setHistory((p) => [
        ...p,
        { role: 'user', content: `Q: ${question}` },
        { role: 'assistant', content: `A: ${answer}` },
      ]);
    } catch { alert('Evaluation failed'); }
    finally { setLoading(false); }
  };

  const nextQ = async () => {
    if (qCount >= 5) { setPhase('result'); return; }
    setLoading(true);
    setEvaluation(null);
    setAnswer('');
    try {
      const { data } = await nextQuestion(history);
      setQuestion(data.question);
      setQCount((p) => p + 1);
    } catch { alert('Failed to get next question'); }
    finally { setLoading(false); }
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div>
      <Navbar />
      <div style={styles.page}>
        {phase === 'setup' && (
          <div style={styles.setupCard} className="card">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem' }}>🎤</div>
              <h2 style={styles.title}>Mock Interview</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>AI-powered technical interview with real-time evaluation</p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={styles.label}>Select Topic</label>
              <div style={styles.topicGrid}>
                {TOPICS.map((t) => (
                  <button key={t} className={`btn ${topic === t ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setTopic(t)} style={{ fontSize: '0.8rem' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" onClick={startInterview} disabled={loading} style={{ width: '100%', padding: '0.75rem' }}>
              {loading ? 'Starting...' : 'Start Interview (5 Questions)'}
            </button>
          </div>
        )}

        {phase === 'interview' && (
          <div style={styles.interviewCard} className="card">
            <div style={styles.progress}>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Question {qCount} of 5 – {topic}</span>
              <div style={styles.progressBar}>
                <div style={{ width: `${(qCount / 5) * 100}%`, height: '100%', background: '#6366f1', borderRadius: 999 }} />
              </div>
            </div>

            <div style={styles.questionBox}>
              <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.5rem' }}>QUESTION</div>
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#e2e8f0' }}>{question}</p>
            </div>

            {!evaluation ? (
              <div>
                <label style={styles.label}>Your Answer</label>
                <textarea
                  rows={6}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{ marginBottom: '1rem', resize: 'vertical' }}
                />
                <button className="btn btn-primary" onClick={submitAnswer} disabled={loading || !answer.trim()} style={{ width: '100%' }}>
                  {loading ? 'Evaluating...' : 'Submit Answer'}
                </button>
              </div>
            ) : (
              <div style={styles.evalBox}>
                <div style={styles.scoreRow}>
                  <span style={{ color: '#94a3b8' }}>Score</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: evaluation.score >= 7 ? '#22c55e' : evaluation.score >= 4 ? '#f59e0b' : '#ef4444' }}>
                    {evaluation.score}/10
                  </span>
                </div>
                <div style={styles.feedbackBox}>
                  <div style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.4rem' }}>FEEDBACK</div>
                  <p style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.6 }}>{evaluation.feedback}</p>
                </div>
                {evaluation.improvements?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600, marginBottom: '0.4rem' }}>IMPROVEMENTS</div>
                    <ul style={{ paddingLeft: '1.2rem', fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.8 }}>
                      {evaluation.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                    </ul>
                  </div>
                )}
                <button className="btn btn-primary" onClick={nextQ} style={{ width: '100%', marginTop: '1rem' }}>
                  {qCount >= 5 ? 'See Results' : 'Next Question →'}
                </button>
              </div>
            )}
          </div>
        )}

        {phase === 'result' && (
          <div style={styles.setupCard} className="card">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem' }}>{avgScore >= 7 ? '🏆' : avgScore >= 4 ? '👍' : '📚'}</div>
              <h2 style={styles.title}>Interview Complete!</h2>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: avgScore >= 7 ? '#22c55e' : avgScore >= 4 ? '#f59e0b' : '#ef4444', margin: '1rem 0' }}>
                {avgScore}/10
              </div>
              <p style={{ color: '#94a3b8', marginBottom: '0.5rem' }}>Average Score across {scores.length} questions</p>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>
                {avgScore >= 7 ? 'Excellent performance! You are interview-ready.' : avgScore >= 4 ? 'Good effort. Keep practicing to improve.' : 'Keep practicing. Focus on fundamentals.'}
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={() => { setPhase('setup'); setEvaluation(null); setAnswer(''); }}>
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '2rem', maxWidth: 700, margin: '0 auto' },
  setupCard: { maxWidth: 500, margin: '0 auto' },
  interviewCard: {},
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: '0.5rem 0' },
  label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '0.5rem' },
  topicGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  progress: { marginBottom: '1.5rem' },
  progressBar: { background: '#0f172a', borderRadius: 999, height: 6, marginTop: '0.5rem', overflow: 'hidden' },
  questionBox: { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1.25rem', marginBottom: '1.5rem' },
  evalBox: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  scoreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', padding: '1rem', borderRadius: 10 },
  feedbackBox: { background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: '1rem' },
};
