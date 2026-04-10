const fetch = require('node-fetch');

// Trending skills for recommendation engine
const TRENDING_SKILLS = ['React', 'Node.js', 'Python', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Machine Learning', 'System Design'];

// ─── GITHUB ───────────────────────────────────────────────────────────────────
exports.fetchGitHubData = async (username) => {
  if (!username) return null;
  try {
    const headers = process.env.GITHUB_TOKEN
      ? { Authorization: `token ${process.env.GITHUB_TOKEN}` }
      : {};

    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${username}`, { headers }),
      fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers }),
    ]);

    if (!userRes.ok) throw new Error(`GitHub user not found: ${username}`);

    const user = await userRes.json();
    const repos = reposRes.ok ? await reposRes.json() : [];

    const langCount = {};
    const frameworks = new Set();
    const FRAMEWORK_KEYWORDS = ['react', 'vue', 'angular', 'express', 'django', 'flask', 'spring', 'nextjs', 'next.js', 'fastapi', 'laravel', 'rails'];

    repos.forEach((repo) => {
      if (repo.language) {
        langCount[repo.language] = (langCount[repo.language] || 0) + (repo.stargazers_count + 1);
      }
      const name = (repo.name + ' ' + (repo.description || '')).toLowerCase();
      FRAMEWORK_KEYWORDS.forEach((fw) => { if (name.includes(fw)) frameworks.add(fw); });
    });

    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([lang]) => lang);

    // Enhanced: project quality tagging
    const topProjects = repos
      .filter((r) => !r.fork && r.description)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 3)
      .map((r) => {
        const impactLevel = r.stargazers_count >= 10 ? 'High Impact' : r.stargazers_count >= 3 ? 'Moderate' : 'Basic';
        return {
          name: r.name,
          description: r.description || '',
          language: r.language || 'Unknown',
          stars: r.stargazers_count,
          url: r.html_url,
          topics: r.topics || [],
          impactLevel,
          techStack: [r.language, ...r.topics].filter(Boolean).slice(0, 4),
        };
      });

    return {
      name: user.name || username,
      bio: user.bio || '',
      location: user.location || '',
      publicRepos: user.public_repos || 0,
      followers: user.followers || 0,
      profileUrl: user.html_url,
      topLanguages,
      frameworks: [...frameworks],
      topProjects,
      totalStars: repos.reduce((s, r) => s + r.stargazers_count, 0),
    };
  } catch (err) {
    console.error('[GitHub]', err.message);
    return null;
  }
};

// ─── LEETCODE ─────────────────────────────────────────────────────────────────
exports.fetchLeetCodeData = async (username) => {
  if (!username) return null;
  try {
    const query = `
      query getUserProfile($username: String!) {
        matchedUser(username: $username) {
          username
          profile { ranking realName }
          submitStats { acSubmissionNum { difficulty count } }
          tagProblemCounts {
            advanced { tagName problemsSolved }
            intermediate { tagName problemsSolved }
            fundamental { tagName problemsSolved }
          }
        }
      }`;

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' },
      body: JSON.stringify({ query, variables: { username } }),
    });

    if (!res.ok) throw new Error('LeetCode API error');
    const json = await res.json();
    const user = json?.data?.matchedUser;
    if (!user) throw new Error('LeetCode user not found');

    const stats = user.submitStats?.acSubmissionNum || [];
    const easy = stats.find((s) => s.difficulty === 'Easy')?.count || 0;
    const medium = stats.find((s) => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find((s) => s.difficulty === 'Hard')?.count || 0;
    const total = easy + medium + hard;
    const level = total >= 300 ? 'Advanced' : total >= 100 ? 'Intermediate' : 'Beginner';

    const allTopics = [
      ...(user.tagProblemCounts?.advanced || []),
      ...(user.tagProblemCounts?.intermediate || []),
    ]
      .sort((a, b) => b.problemsSolved - a.problemsSolved)
      .slice(0, 5)
      .map((t) => t.tagName);

    // LeetCode strength score (0-100)
    const lcScore = Math.min(Math.round((easy * 1 + medium * 2 + hard * 4) / 10), 100);

    return { username, ranking: user.profile?.ranking || 0, totalSolved: total, easy, medium, hard, level, topTopics: allTopics, lcScore };
  } catch (err) {
    console.error('[LeetCode]', err.message);
    return null;
  }
};

// ─── SKILL INTELLIGENCE ───────────────────────────────────────────────────────
const analyzeSkills = (githubData, leetcodeData) => {
  const githubSkills = new Set([
    ...(githubData?.topLanguages || []),
    ...(githubData?.frameworks || []),
  ].map((s) => s.toLowerCase()));

  const lcTopics = new Set((leetcodeData?.topTopics || []).map((s) => s.toLowerCase()));

  // Strong: present in both GitHub activity AND LeetCode topics
  const strongSkills = [...githubSkills].filter((s) =>
    lcTopics.has(s) || (githubData?.totalStars || 0) > 5
  ).slice(0, 5);

  // Weak: in GitHub but low stars / no LeetCode backing
  const weakSkills = [...githubSkills].filter((s) => !strongSkills.includes(s)).slice(0, 4);

  // Recommended: trending skills not yet in profile
  const allSkillsLower = new Set([...githubSkills, ...lcTopics]);
  const recommendedSkills = TRENDING_SKILLS
    .filter((s) => !allSkillsLower.has(s.toLowerCase()))
    .slice(0, 5);

  return { strongSkills, weakSkills, recommendedSkills };
};

// ─── RESUME SCORE ─────────────────────────────────────────────────────────────
const calcResumeScore = (skills, projects, leetcodeData, githubData, linkedinSummary) => {
  let score = 0;
  score += Math.min(skills.length * 5, 30);                          // skills: max 30
  score += Math.min(projects.length * 10, 20);                       // projects: max 20
  score += Math.min((leetcodeData?.lcScore || 0) * 0.3, 20);        // leetcode: max 20
  score += (githubData?.totalStars || 0) > 0 ? 10 : 0;              // has stars: 10
  score += (githubData?.publicRepos || 0) >= 5 ? 10 : 5;            // repos: 5-10
  score += linkedinSummary ? 10 : 0;                                  // linkedin: 10
  return Math.min(Math.round(score), 100);
};

// ─── PROFILE COMPLETENESS ─────────────────────────────────────────────────────
const calcProfileCompleteness = (githubData, leetcodeData, linkedinSummary, projects) => {
  let score = 0;
  if (githubData) score += 30;
  if (leetcodeData) score += 25;
  if (linkedinSummary) score += 20;
  if (projects?.length >= 1) score += 15;
  if (projects?.length >= 3) score += 10;
  return Math.min(score, 100);
};

// ─── AGGREGATE ────────────────────────────────────────────────────────────────
exports.aggregateProfiles = (githubData, leetcodeData, linkedinSummary) => {
  const skills = new Set();
  if (githubData) {
    githubData.topLanguages.forEach((l) => skills.add(l));
    githubData.frameworks.forEach((f) => skills.add(f));
  }

  const skillsArr = [...skills];
  const projects = githubData?.topProjects || [];
  const skillIntelligence = analyzeSkills(githubData, leetcodeData);
  const resumeScore = calcResumeScore(skillsArr, projects, leetcodeData, githubData, linkedinSummary);
  const profileCompleteness = calcProfileCompleteness(githubData, leetcodeData, linkedinSummary, projects);

  return {
    name: githubData?.name || 'Developer',
    bio: githubData?.bio || linkedinSummary || '',
    location: githubData?.location || '',
    skills: skillsArr,
    projects,
    codingStats: leetcodeData ? {
      totalSolved: leetcodeData.totalSolved,
      easy: leetcodeData.easy, medium: leetcodeData.medium, hard: leetcodeData.hard,
      level: leetcodeData.level, ranking: leetcodeData.ranking, topTopics: leetcodeData.topTopics,
    } : null,
    githubStats: githubData
      ? { repos: githubData.publicRepos, stars: githubData.totalStars, followers: githubData.followers, url: githubData.profileUrl }
      : null,
    linkedinSummary: linkedinSummary || '',
    // Enhanced fields
    resumeScore,
    profileCompleteness,
    skillIntelligence,
    projectsDetailed: projects,
  };
};
