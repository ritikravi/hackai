const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const chat = async (prompt, max_tokens = 2000) => {
  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.4,
    max_tokens,
  });
  return res.choices[0].message.content.replace(/```json|```/g, '').trim();
};

exports.generateResume = async (aggregatedData) => {
  const { name, bio, location, skills, projects, codingStats, githubStats, linkedinSummary, skillIntelligence } = aggregatedData;

  const dataContext = `
Name: ${name} | Location: ${location || 'Not specified'}
Bio: ${bio || 'Not provided'}
LinkedIn Summary: ${linkedinSummary || 'Not provided'}
Technical Skills: ${skills.join(', ') || 'Not detected'}
Strong Skills: ${skillIntelligence?.strongSkills?.join(', ') || 'N/A'}
GitHub: ${githubStats?.repos || 0} repos, ${githubStats?.totalStars || githubStats?.stars || 0} stars
Top Projects: ${projects.map((p) => `${p.name} (${p.language}, ⭐${p.stars}) — ${p.description}`).join(' | ') || 'None'}
LeetCode: ${codingStats ? `${codingStats.totalSolved} solved (${codingStats.easy}E/${codingStats.medium}M/${codingStats.hard}H), Level: ${codingStats.level}, Rank: #${codingStats.ranking}` : 'Not provided'}`;

  // 1. Resume as plain ATS text
  const resumePrompt = `You are an expert ATS resume writer. Generate a professional resume for a software developer.

Data: ${dataContext}

Write a complete resume with these exact sections:
PROFESSIONAL SUMMARY
TECHNICAL SKILLS (grouped: Languages | Frameworks | Tools)
PROJECTS (top 3 with: what it does, tech stack, measurable impact)
CODING ACHIEVEMENTS (LeetCode stats if available)
EDUCATION (write "B.Tech Computer Science — [University Name], 2024" as placeholder)

Rules: No markdown, no tables, clean plain text, ATS-optimized keywords, max 1 page equivalent.`;

  // 2. Structured JSON for suggestions + roadmap + highlights
  const intelligencePrompt = `Analyze this developer profile and return ONLY valid JSON (no markdown):

${dataContext}

Return exactly this structure:
{
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"],
  "roadmap": [
    {"week": "Week 1 (Days 1-7)", "focus": "...", "tasks": "..."},
    {"week": "Week 2 (Days 8-14)", "focus": "...", "tasks": "..."},
    {"week": "Week 3 (Days 15-21)", "focus": "...", "tasks": "..."},
    {"week": "Week 4 (Days 22-30)", "focus": "...", "tasks": "..."}
  ],
  "summary": "2-sentence career summary",
  "highlights": ["achievement 1", "achievement 2", "achievement 3"]
}`;

  const [resumeText, intelligenceRaw] = await Promise.all([
    chat(resumePrompt, 1800),
    chat(intelligencePrompt, 1000),
  ]);

  // Parse structured intelligence
  let intelligence = { suggestions: [], roadmap: [], summary: '', highlights: [] };
  try {
    intelligence = JSON.parse(intelligenceRaw);
  } catch {
    // Fallback: extract what we can
    intelligence.suggestions = [
      'Add more projects with descriptions to GitHub',
      'Solve more medium/hard LeetCode problems',
      'Add a LinkedIn summary for better visibility',
      'Contribute to open source projects',
      'Add system design knowledge to your profile',
    ];
    intelligence.roadmap = [
      { week: 'Week 1 (Days 1-7)', focus: 'Strengthen DSA', tasks: 'Solve 10 medium LeetCode problems' },
      { week: 'Week 2 (Days 8-14)', focus: 'Build Projects', tasks: 'Add 1 full-stack project to GitHub' },
      { week: 'Week 3 (Days 15-21)', focus: 'Apply to Jobs', tasks: 'Apply to 10 companies, update resume' },
      { week: 'Week 4 (Days 22-30)', focus: 'Interview Prep', tasks: 'Complete 5 mock interviews' },
    ];
  }

  // Keep backward-compatible fields
  const suggestions = Array.isArray(intelligence.suggestions)
    ? intelligence.suggestions.join('\n')
    : intelligence.suggestions || '';

  const improvementPlan = Array.isArray(intelligence.roadmap)
    ? intelligence.roadmap.map((r) => `${r.week}: ${r.focus} — ${r.tasks}`).join('\n')
    : '';

  return {
    resumeText,
    suggestions,           // string (backward compat)
    improvementPlan,       // string (backward compat)
    suggestionsArray: intelligence.suggestions || [],
    roadmapArray: intelligence.roadmap || [],
    summary: intelligence.summary || '',
    highlights: intelligence.highlights || [],
    aggregatedData,
  };
};
