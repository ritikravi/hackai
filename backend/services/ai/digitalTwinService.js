const Profile = require('../../models/Profile');
const Application = require('../../models/Application');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ideal skill benchmark for comparison
const IDEAL_SKILLS = ['Data Structures', 'System Design', 'JavaScript', 'SQL', 'Communication', 'Problem Solving'];

exports.getDigitalTwin = async (userId) => {
  const profile = await Profile.findOne({ userId });
  const applications = await Application.find({ userId });

  const studentSkills = profile?.skills || [];
  const appCount = applications.length;

  // Radar chart data: student vs ideal
  const radarData = IDEAL_SKILLS.map((skill) => ({
    skill,
    student: studentSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase())) ? 80 : 20,
    ideal: 100,
  }));

  // Growth trend (simulated weekly data points)
  const baseScore = profile?.placementScore || 30;
  const growthTrend = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    score: Math.min(Math.round(baseScore + i * (profile?.trend === 'up' ? 2 : -1)), 100),
  }));

  // AI-generated summary
  let aiSummary = { strengths: [], weaknesses: [], recommendations: [] };
  try {
    const prompt = `Analyze this student profile and return JSON with:
- strengths: array of 3 strength statements
- weaknesses: array of 3 weakness statements  
- recommendations: array of 3 specific action items

Profile: Skills: ${studentSkills.join(', ') || 'none'}, Applications: ${appCount}, Interview Score: ${profile?.interviewScore || 0}/10, Risk: ${profile?.riskLevel}

Respond ONLY with valid JSON, no markdown.`;

    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 400,
    });

    const clean = res.choices[0].message.content.replace(/```json|```/g, '').trim();
    aiSummary = JSON.parse(clean);
  } catch {
    aiSummary = {
      strengths: ['Has technical skills', 'Registered on platform', 'Actively seeking placement'],
      weaknesses: ['Needs more applications', 'Interview score can improve', 'Profile incomplete'],
      recommendations: ['Apply to 3 jobs this week', 'Complete a mock interview', 'Update resume with projects'],
    };
  }

  return { radarData, growthTrend, ...aiSummary, profile: { skills: studentSkills, placementScore: profile?.placementScore || 0, riskLevel: profile?.riskLevel } };
};
