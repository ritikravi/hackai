import React, { useEffect, useRef, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TOPICS = ['JavaScript', 'Python', 'Data Structures', 'System Design', 'React', 'SQL', 'General CS'];
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001';

export default function VideoInterview() {
  const { user } = useAuth();
  const videoRef = useRef();
  const streamRef = useRef();
  const recognitionRef = useRef();

  const [phase, setPhase] = useState('setup');
  const [topic, setTopic] = useState('Data Structures');
  const [camReady, setCamReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [currentSpeech, setCurrentSpeech] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const answerResolveRef = useRef(null);
  const transcriptEndRef = useRef();

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamReady(true);
      setError('');
    } catch (err) {
      setError('Camera/mic access denied. Please allow permissions and try again.');
    }
  };

  // ── Puter.js ElevenLabs TTS — free, no API key ───────────────────────────
  const speak = (text) => new Promise(async (resolve) => {
    setIsSpeaking(true);

    // Mute mic while AI speaks to prevent feedback/network errors
    const micTrack = streamRef.current?.getAudioTracks()[0];
    if (micTrack) micTrack.enabled = false;

    const done = () => {
      setIsSpeaking(false);
      // Re-enable mic after AI finishes
      if (micTrack) micTrack.enabled = true;
      resolve();
    };

    try {
      if (window.puter?.ai?.txt2speech) {
        const audio = await window.puter.ai.txt2speech(text);
        audio.onended = done;
        audio.onerror = done;
        audio.play();
        return;
      }
    } catch (e) {
      console.warn('[Puter TTS] fallback to browser:', e.message);
    }

    // Browser TTS fallback
    window.speechSynthesis?.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1.05;
    const voices = window.speechSynthesis?.getVoices() || [];
    const preferred =
      voices.find((v) => v.name.includes('Google UK English Female')) ||
      voices.find((v) => v.name.includes('Samantha')) ||
      voices.find((v) => v.name.includes('Karen')) ||
      voices.find((v) => v.lang === 'en-US');
    if (preferred) utter.voice = preferred;
    utter.onend = done;
    utter.onerror = done;
    window.speechSynthesis?.speak(utter);
  });

  // ── Answer input — manual type OR speech ────────────────────────────────
  const listenForAnswer = () => new Promise((resolve) => {
    setWaitingForAnswer(true);
    setAnswerInput('');
    answerResolveRef.current = (answer) => {
      setWaitingForAnswer(false);
      setAnswerInput('');
      setIsListening(false);
      setCurrentSpeech('');
      resolve(answer || '(No answer provided)');
    };
  });

  const submitAnswer = () => {
    const answer = answerInput.trim();
    if (!answer) return;
    answerResolveRef.current?.(answer);
  };

  // Optional: speech-to-text to fill the text box
  const startSpeechInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser. Please type your answer.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalText = '';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' ';
        else interim = e.results[i][0].transcript;
      }
      setAnswerInput(finalText + interim);
      setCurrentSpeech(finalText + interim);
    };
    recognition.onend = () => { setIsListening(false); setAnswerInput(finalText.trim()); };
    recognition.onerror = () => { setIsListening(false); };
    recognition.start();
  };

  const stopSpeechInput = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  };

  // ── Interview flow ───────────────────────────────────────────────────────
  const startInterview = async () => {
    setPhase('interview');
    setTranscript([]);
    setScores([]);
    setQuestionCount(0);
    await speak(`Hello ${user?.name || 'there'}! I am your AI interviewer. We will cover ${topic}. I will ask 5 questions and evaluate each answer. Let us begin!`);
    await runQuestion([], 0, []);
  };

  const runQuestion = async (history, qNum, currentScores) => {
    if (qNum >= 5) { await finishInterview(currentScores); return; }

    setIsThinking(true);
    setQuestionCount(qNum + 1);

    try {
      const { data } = await api.post('/ai/mock-interview', {
        action: qNum === 0 ? 'start' : 'next',
        topic,
        history,
      });
      const question = data.question;
      setIsThinking(false);

      addToTranscript({ role: 'ai', text: `Q${qNum + 1}: ${question}` });
      await speak(`Question ${qNum + 1}. ${question}`);
      await speak('Please answer now.');

      const answer = await listenForAnswer();

      if (!answer || answer === '(No answer detected)') {
        addToTranscript({ role: 'user', text: '(No answer provided)' });
        await speak('I did not catch your answer. Moving to the next question.');
        await runQuestion([...history, { role: 'assistant', content: question }, { role: 'user', content: '(No answer)' }], qNum + 1, currentScores);
        return;
      }

      addToTranscript({ role: 'user', text: answer });
      setIsThinking(true);

      const { data: evalData } = await api.post('/ai/mock-interview', {
        action: 'evaluate', question, answer, topic,
      });
      setIsThinking(false);

      const score = evalData.score ?? 5;
      const newScores = [...currentScores, score];
      setScores(newScores);

      const feedback = `Score: ${score} out of 10. ${evalData.feedback || ''}`;
      addToTranscript({ role: 'feedback', text: feedback, score });
      await speak(feedback);

      if (evalData.improvements?.length > 0) {
        await speak(`Tip: ${evalData.improvements[0]}`);
      }

      await runQuestion(
        [...history, { role: 'assistant', content: question }, { role: 'user', content: answer }],
        qNum + 1,
        newScores
      );
    } catch (err) {
      setIsThinking(false);
      setError('AI error: ' + err.message);
    }
  };

  const finishInterview = async (finalScores) => {
    const avg = finalScores.length ? Math.round(finalScores.reduce((a, b) => a + b, 0) / finalScores.length) : 0;
    const verdict = avg >= 7 ? 'Excellent! You are interview ready.' : avg >= 4 ? 'Good effort. Keep practicing.' : 'Keep practicing. Focus on fundamentals.';
    const summary = `Interview complete! Average score: ${avg} out of 10. ${verdict}`;
    addToTranscript({ role: 'summary', text: summary, avg });
    await speak(summary);
    setPhase('ended');
  };

  const addToTranscript = (entry) => {
    setTranscript((p) => [...p, { ...entry, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
  };

  const toggleMute = () => { const t = streamRef.current?.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; setIsMuted(!isMuted); } };
  const toggleCamera = () => { const t = streamRef.current?.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; setIsCamOff(!isCamOff); } };
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div>
      <Navbar />
      <div style={s.page}>

        {/* ── SETUP ── */}
        {phase === 'setup' && (
          <div style={s.center}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem' }}>🤖</div>
              <h2 style={s.title}>AI Video Interview</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                AI asks questions aloud · You answer by speaking · AI evaluates in real-time
              </p>
            </div>
            <div className="card" style={{ maxWidth: 500, width: '100%' }}>
              <div style={s.camPreview}>
                {camReady
                  ? <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem' }}>📷</div>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.5rem' }}>Camera not started</p>
                    </div>
                }
              </div>
              {!camReady && (
                <button className="btn btn-secondary" onClick={startCamera} style={{ width: '100%', marginBottom: '1rem' }}>
                  📷 Enable Camera & Mic
                </button>
              )}
              {error && <div style={s.error}>{error}</div>}
              <div style={{ marginBottom: '1rem' }}>
                <label style={s.label}>Interview Topic</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {TOPICS.map((t) => (
                    <button key={t} className={`btn ${topic === t ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setTopic(t)} style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div style={s.infoBox}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.9 }}>
                  <div>🎤 AI speaks using Puter.js (ElevenLabs quality, free)</div>
                  <div>🗣️ You answer by speaking — auto-detected after 3s silence</div>
                  <div>🧠 AI evaluates each answer with score + feedback</div>
                  <div style={{ color: '#f59e0b', marginTop: 4 }}>⚠️ Use Chrome for best speech recognition</div>
                </div>
              </div>
              <button className="btn btn-primary" onClick={startInterview}
                disabled={!camReady} style={{ width: '100%', padding: '0.75rem', fontSize: '1rem' }}>
                🎬 Start AI Interview
              </button>
            </div>
          </div>
        )}

        {/* ── INTERVIEW / ENDED ── */}
        {(phase === 'interview' || phase === 'ended') && (
          <div style={s.interviewLayout}>
            {/* Left: Video + controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={s.videoWrapper}>
                <video ref={videoRef} autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {isCamOff && <div style={s.camOffOverlay}>📷 Camera Off</div>}
                <div style={s.statusOverlay}>
                  {isSpeaking && <StatusBadge color="#6366f1">🤖 AI Speaking...</StatusBadge>}
                  {isListening && <StatusBadge color="#22c55e">🎤 Listening... speak now</StatusBadge>}
                  {isThinking && <StatusBadge color="#f59e0b">🧠 AI Thinking...</StatusBadge>}
                </div>
                {currentSpeech && <div style={s.liveSpeech}>{currentSpeech}</div>}
              </div>

              {/* Controls */}
              <div style={s.controls}>
                <button onClick={toggleMute} style={{ ...s.ctrlBtn, background: isMuted ? '#ef4444' : '#334155' }}>
                  {isMuted ? '🔇' : '🎤'}
                </button>
                <button onClick={toggleCamera} style={{ ...s.ctrlBtn, background: isCamOff ? '#ef4444' : '#334155' }}>
                  {isCamOff ? '📷' : '📹'}
                </button>
                <span style={{ marginLeft: 'auto', color: '#64748b', fontSize: '0.75rem' }}>
                  Q{questionCount}/5 · {topic}
                </span>
              </div>

              {/* Answer input box — shown when AI is waiting for answer */}
              {waitingForAnswer && (
                <div className="card" style={{ background: '#0f172a', border: '1px solid #6366f1' }}>
                  <div style={{ fontSize: '0.8rem', color: '#6366f1', fontWeight: 600, marginBottom: '0.5rem' }}>
                    💬 Your Answer
                  </div>
                  <textarea
                    rows={4}
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Type your answer here, or use the mic button to speak..."
                    style={{ resize: 'vertical', marginBottom: '0.75rem' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) submitAnswer(); }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={isListening ? stopSpeechInput : startSpeechInput}
                      style={{ fontSize: '0.8rem' }}
                    >
                      {isListening ? '⏹ Stop Mic' : '🎤 Use Mic'}
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={submitAnswer}
                      disabled={!answerInput.trim()}
                      style={{ flex: 1 }}
                    >
                      ✅ Submit Answer (Ctrl+Enter)
                    </button>
                  </div>
                  {isListening && (
                    <div style={{ fontSize: '0.75rem', color: '#22c55e', marginTop: '0.5rem' }}>
                      🎤 Listening... speak your answer, it will appear above
                    </div>
                  )}
                </div>
              )}

              {/* Scores */}
              {scores.length > 0 && (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Scores</span>
                    <span style={{ fontWeight: 700, color: avgScore >= 7 ? '#22c55e' : avgScore >= 4 ? '#f59e0b' : '#ef4444' }}>
                      Avg: {avgScore}/10
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {scores.map((sc, i) => (
                      <div key={i} style={{ flex: 1, background: '#0f172a', borderRadius: 6, padding: '0.4rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: sc >= 7 ? '#22c55e' : sc >= 4 ? '#f59e0b' : '#ef4444' }}>{sc}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Q{i + 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {phase === 'ended' && (
                <button className="btn btn-primary"
                  onClick={() => { setPhase('setup'); setScores([]); setTranscript([]); setQuestionCount(0); }}
                  style={{ width: '100%' }}>
                  🔄 Start New Interview
                </button>
              )}
            </div>

            {/* Right: Transcript */}
            <div style={s.transcriptPanel}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.75rem' }}>
                📝 Live Transcript
              </h3>
              <div style={s.transcriptBox}>
                {transcript.length === 0 && (
                  <p style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center', padding: '2rem' }}>
                    Transcript will appear here...
                  </p>
                )}
                {transcript.map((entry, i) => (
                  <div key={i} style={{
                    background: '#0f172a',
                    border: `1px solid ${roleColor(entry.role)}22`,
                    borderRadius: 8, padding: '0.6rem 0.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: roleColor(entry.role) }}>
                        {roleLabel(entry.role)}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#475569' }}>{entry.time}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>{entry.text}</p>
                    {entry.score !== undefined && (
                      <span style={{ background: entry.score >= 7 ? '#16653422' : '#92400e22', color: entry.score >= 7 ? '#22c55e' : '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700, marginTop: '0.4rem', display: 'inline-block' }}>
                        {entry.score}/10
                      </span>
                    )}
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatusBadge = ({ color, children }) => (
  <div style={{ background: color + 'dd', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, display: 'inline-block' }}>
    {children}
  </div>
);

const roleColor = (role) => ({ ai: '#6366f1', user: '#22c55e', feedback: '#f59e0b', summary: '#a5b4fc' }[role] || '#94a3b8');
const roleLabel = (role) => ({ ai: '🤖 AI Interviewer', user: '🗣️ You', feedback: '📊 Feedback', summary: '🏆 Summary' }[role] || role);

const s = {
  page: { padding: '1.5rem', maxWidth: 1200, margin: '0 auto' },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1rem' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: '0.5rem 0' },
  label: { display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500, marginBottom: '0.5rem' },
  error: { background: '#7f1d1d', color: '#fca5a5', padding: '0.6rem', borderRadius: 8, fontSize: '0.8rem', marginBottom: '0.75rem' },
  camPreview: { background: '#0f172a', borderRadius: 10, overflow: 'hidden', marginBottom: '1rem', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  infoBox: { background: '#0f172a', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem' },
  interviewLayout: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' },
  videoWrapper: { position: 'relative', background: '#0f172a', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3' },
  camOffOverlay: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#64748b' },
  statusOverlay: { position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  liveSpeech: { position: 'absolute', bottom: 12, left: 12, right: 12, background: '#00000099', color: '#e2e8f0', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.8rem', fontStyle: 'italic' },
  controls: { display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '0.6rem 1rem' },
  ctrlBtn: { width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  transcriptPanel: { background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '1rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column' },
  transcriptBox: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '70vh' },
};
