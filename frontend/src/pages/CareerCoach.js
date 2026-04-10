import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { chatWithAI } from '../services/api';

export default function CareerCoach() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your HackAI Career Coach 🤖. Ask me anything about placements, resume tips, interview prep, or career advice!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    const history = messages.slice(-6);
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await chatWithAI(input, history);
      setMessages((p) => [...p, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages((p) => [...p, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'How can I improve my resume?',
    'What skills should I learn for software roles?',
    'How to prepare for technical interviews?',
    'Tips for DSA practice?',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>🤖 AI Career Coach</h2>
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Powered by GPT – Your personal placement mentor</p>
        </div>

        {/* Quick prompts */}
        <div style={styles.quickPrompts}>
          {quickPrompts.map((p, i) => (
            <button key={i} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setInput(p)}>
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg, i) => (
            <div key={i} style={{ ...styles.msgRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.role === 'assistant' && <div style={styles.avatar}>🤖</div>}
              <div style={{ ...styles.bubble, ...(msg.role === 'user' ? styles.userBubble : styles.aiBubble) }}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ ...styles.msgRow, justifyContent: 'flex-start' }}>
              <div style={styles.avatar}>🤖</div>
              <div style={styles.aiBubble}><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} style={styles.inputRow}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your career coach..."
            style={{ flex: 1 }}
            disabled={loading}
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', flex: 1, maxWidth: 800, margin: '0 auto', width: '100%', padding: '1.5rem', gap: '1rem', overflow: 'hidden' },
  header: { textAlign: 'center' },
  title: { fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9' },
  quickPrompts: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' },
  messages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' },
  msgRow: { display: 'flex', alignItems: 'flex-end', gap: '0.5rem' },
  avatar: { fontSize: '1.25rem', flexShrink: 0 },
  bubble: { maxWidth: '75%', padding: '0.75rem 1rem', borderRadius: 12, fontSize: '0.875rem', lineHeight: 1.6 },
  aiBubble: { background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderBottomLeftRadius: 4 },
  userBubble: { background: '#6366f1', color: 'white', borderBottomRightRadius: 4 },
  inputRow: { display: 'flex', gap: '0.75rem' },
};
