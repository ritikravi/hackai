const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.3-70b-versatile';

// Helper to call Groq chat
const chat = async (messages, temperature = 0.5, max_tokens = 500) => {
  const res = await groq.chat.completions.create({ model: MODEL, messages, temperature, max_tokens });
  return res.choices[0].message.content;
};

// Analyze resume text and extract structured data
exports.analyzeResumeWithAI = async (resumeText) => {
  const prompt = `You are an expert resume analyzer. Analyze the following resume and return a JSON object with:
- skills: array of technical skills found
- weaknesses: array of areas that need improvement
- projects: array of project names/descriptions
- summary: brief 2-sentence professional summary

Resume:
${resumeText.slice(0, 4000)}

Respond ONLY with valid JSON, no markdown, no explanation.`;

  const content = await chat([{ role: 'user', content: prompt }], 0.3, 600);
  try {
    // Strip markdown code fences if present
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { skills: [], weaknesses: [], projects: [], summary: '' };
  }
};

// AI Career Mentor chat
exports.chatWithMentor = async (message, history, profile) => {
  const systemPrompt = `You are HackAI Career Coach, an expert placement mentor.
Student profile: Skills: ${profile?.skills?.join(', ') || 'unknown'}.
Weaknesses: ${profile?.weaknesses?.join(', ') || 'none identified'}.
Placement probability: ${profile?.placementProbability || 0}%.
Give concise, actionable career advice. Be encouraging but honest. Keep replies under 150 words.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6),
    { role: 'user', content: message },
  ];

  return await chat(messages, 0.7, 400);
};

// Mock Interview system
exports.conductMockInterview = async ({ action, question, answer, topic, history, profile }) => {
  if (action === 'start') {
    const skills = profile?.skills?.join(', ') || 'general programming';
    const content = await chat([{
      role: 'user',
      content: `You are a technical interviewer. Generate ONE ${topic || 'technical'} interview question for a student with skills in: ${skills}. Ask only the question, no preamble.`
    }], 0.8, 200);
    return { question: content };
  }

  if (action === 'next') {
    const messages = [
      { role: 'system', content: 'You are a technical interviewer. Ask the next relevant interview question based on the conversation. ONE question only, no preamble.' },
      ...(history || []).slice(-6),
    ];
    const content = await chat(messages, 0.8, 200);
    return { question: content };
  }

  if (action === 'evaluate') {
    const prompt = `You are a technical interviewer. Evaluate this answer:
Question: ${question}
Answer: ${answer}

Return ONLY valid JSON (no markdown) with:
- score: number 0-10
- feedback: string (2-3 sentences)
- improvements: array of 2-3 specific improvement suggestions
- isCorrect: boolean`;

    const content = await chat([{ role: 'user', content: prompt }], 0.3, 400);
    try {
      const clean = content.replace(/```json|```/g, '').trim();
      return JSON.parse(clean);
    } catch {
      return { score: 5, feedback: 'Could not evaluate response.', improvements: [], isCorrect: false };
    }
  }

  return { error: 'Unknown action' };
};

// Generate AI tasks for a student
exports.generateAITasks = async (profile, applicationCount) => {
  const prompt = `You are an AI placement coach. Generate 4 specific daily tasks for this student.

Skills: ${profile?.skills?.join(', ') || 'none listed'}
Weaknesses: ${profile?.weaknesses?.join(', ') || 'none'}
Applications submitted: ${applicationCount}
Placement probability: ${profile?.placementProbability || 0}%
Risk level: ${profile?.riskLevel || 'Unprepared'}

Return ONLY a valid JSON array (no markdown) of tasks, each with:
- text: specific actionable task description
- type: one of "dsa", "apply", "resume", "interview", "general"`;

  const content = await chat([{ role: 'user', content: prompt }], 0.7, 400);
  try {
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return [
      { text: 'Practice 2 DSA problems on LeetCode', type: 'dsa' },
      { text: 'Apply to at least 2 companies today', type: 'apply' },
      { text: 'Review and update your resume', type: 'resume' },
      { text: 'Complete one mock interview session', type: 'interview' },
    ];
  }
};
