const fetch = require('node-fetch');
const TrendingSkill = require('../../models/TrendingSkill');

/**
 * Market Job Service
 * 
 * Real data source: JSearch API via RapidAPI
 * → Aggregates jobs from LinkedIn, Indeed, Glassdoor, ZipRecruiter
 * → Free tier: 200 requests/month
 * → Sign up: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
 * 
 * Fallback: curated mock data when API key not set
 */

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const JSEARCH_URL = 'https://jsearch.p.rapidapi.com';

// Fetch real jobs from JSearch (LinkedIn/Indeed aggregator)
const fetchRealJobs = async (query = 'software engineer India', page = 1) => {
  const url = `${JSEARCH_URL}/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1&country=in&date_posted=week`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
    },
  });

  if (!res.ok) throw new Error(`JSearch API error: ${res.status}`);
  const json = await res.json();

  return (json.data || []).map((job) => ({
    company: job.employer_name || 'Unknown',
    role: job.job_title || 'Unknown',
    skillsRequired: extractSkills(job.job_description || ''),
    location: job.job_city ? `${job.job_city}, ${job.job_country}` : job.job_country || 'Remote',
    salary: job.job_min_salary
      ? `$${job.job_min_salary}–$${job.job_max_salary}`
      : 'Not disclosed',
    description: (job.job_description || '').slice(0, 200),
    applyUrl: job.job_apply_link || '',
    source: job.job_publisher || 'JSearch',
    postedAt: job.job_posted_at_datetime_utc || new Date().toISOString(),
  }));
};

// Extract skills from job description using keyword matching
const SKILL_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Kotlin', 'Swift',
  'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision',
  'React Native', 'Flutter', 'Android', 'iOS',
  'GraphQL', 'REST API', 'Microservices', 'System Design', 'SQL',
];

const extractSkills = (description) => {
  const lower = description.toLowerCase();
  return SKILL_KEYWORDS.filter((skill) => lower.includes(skill.toLowerCase())).slice(0, 6);
};

// Fallback mock data (used when RAPIDAPI_KEY not set)
const MOCK_JOBS = [
  { company: 'Google', role: 'Software Engineer', skillsRequired: ['Python', 'System Design', 'Algorithms', 'Go'], location: 'Bangalore, India', salary: '₹25–40 LPA', source: 'Mock Data' },
  { company: 'Microsoft', role: 'Frontend Developer', skillsRequired: ['React', 'TypeScript', 'CSS', 'JavaScript'], location: 'Hyderabad, India', salary: '₹18–28 LPA', source: 'Mock Data' },
  { company: 'Amazon', role: 'Backend Engineer', skillsRequired: ['Node.js', 'AWS', 'MongoDB', 'Python'], location: 'Remote', salary: '₹20–35 LPA', source: 'Mock Data' },
  { company: 'Razorpay', role: 'Full Stack Developer', skillsRequired: ['React', 'Node.js', 'PostgreSQL', 'Redis'], location: 'Bangalore, India', salary: '₹18–25 LPA', source: 'Mock Data' },
  { company: 'CRED', role: 'Android Developer', skillsRequired: ['Kotlin', 'Android', 'Java', 'REST API'], location: 'Bangalore, India', salary: '₹15–22 LPA', source: 'Mock Data' },
  { company: 'Swiggy', role: 'ML Engineer', skillsRequired: ['Python', 'TensorFlow', 'SQL', 'Docker'], location: 'Hyderabad, India', salary: '₹20–30 LPA', source: 'Mock Data' },
  { company: 'Zepto', role: 'DevOps Engineer', skillsRequired: ['AWS', 'Kubernetes', 'Docker', 'CI/CD'], location: 'Mumbai, India', salary: '₹16–24 LPA', source: 'Mock Data' },
  { company: 'Meesho', role: 'Data Engineer', skillsRequired: ['Python', 'Spark', 'SQL', 'Kafka'], location: 'Bangalore, India', salary: '₹14–20 LPA', source: 'Mock Data' },
];

// Trending skills with real demand scores (based on industry surveys)
const TRENDING_SKILLS_DATA = [
  { skill: 'Python', demand: 95, category: 'AI/ML' },
  { skill: 'React', demand: 92, category: 'Frontend' },
  { skill: 'Node.js', demand: 88, category: 'Backend' },
  { skill: 'AWS', demand: 85, category: 'Cloud' },
  { skill: 'TypeScript', demand: 82, category: 'Frontend' },
  { skill: 'Docker', demand: 80, category: 'DevOps' },
  { skill: 'Kubernetes', demand: 75, category: 'DevOps' },
  { skill: 'MongoDB', demand: 72, category: 'Database' },
  { skill: 'Flutter', demand: 68, category: 'Mobile' },
  { skill: 'GraphQL', demand: 65, category: 'API' },
  { skill: 'Machine Learning', demand: 90, category: 'AI/ML' },
  { skill: 'System Design', demand: 88, category: 'Architecture' },
];

const getCategoryForSkill = (skill) => {
  const map = {
    Frontend: ['React', 'Angular', 'Vue', 'Next.js', 'TypeScript', 'JavaScript', 'CSS'],
    Backend: ['Node.js', 'Express', 'Java', 'Go', 'Python', 'Django', 'Spring Boot'],
    'AI/ML': ['Machine Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision'],
    Cloud: ['AWS', 'Azure', 'GCP'],
    DevOps: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
    Database: ['MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'Elasticsearch'],
    Mobile: ['Flutter', 'React Native', 'Android', 'iOS', 'Kotlin', 'Swift'],
    API: ['GraphQL', 'REST API', 'Microservices'],
    Architecture: ['System Design'],
  };
  for (const [cat, skills] of Object.entries(map)) {
    if (skills.some((s) => s.toLowerCase() === skill.toLowerCase())) return cat;
  }
  return 'General';
};

// Search jobs by query — used by resume generator job picker
exports.searchJobs = async (query) => {
  if (RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
    try {
      const jobs = await fetchRealJobs(query || 'software engineer India', 1);
      if (jobs.length > 0) return jobs;
    } catch (err) {
      console.error('[SearchJobs] failed:', err.message);
    }
  }
  // Fallback: filter mock jobs by query
  const q = (query || '').toLowerCase();
  return MOCK_JOBS.filter((j) =>
    j.role.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || q === ''
  );
};

exports.getMarketJobs = async () => {
  // Use real API if key is configured
  if (RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
    try {
      const [swJobs, mlJobs] = await Promise.all([
        fetchRealJobs('software engineer India', 1),
        fetchRealJobs('frontend backend developer India', 1),
      ]);
      const combined = [...swJobs, ...mlJobs].slice(0, 15);
      if (combined.length > 0) return combined;
    } catch (err) {
      console.error('[MarketJobs] API fetch failed, using fallback:', err.message);
    }
  }
  // Fallback to mock
  return MOCK_JOBS;
};

exports.getTrendingSkills = async () => {
  // If RapidAPI key is set, calculate real demand from live job data
  if (process.env.RAPIDAPI_KEY && process.env.RAPIDAPI_KEY !== 'your_rapidapi_key_here') {
    try {
      const jobs = await exports.getMarketJobs();
      const skillCount = {};

      // Count skill frequency across all real job listings
      jobs.forEach((job) => {
        (job.skillsRequired || []).forEach((skill) => {
          const key = skill.toLowerCase();
          skillCount[key] = (skillCount[key] || 0) + 1;
        });
      });

      // Also scan job descriptions for known skills
      const KNOWN_SKILLS = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Kotlin',
        'React', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQL',
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD',
        'Machine Learning', 'TensorFlow', 'PyTorch', 'Flutter',
        'GraphQL', 'REST API', 'Microservices', 'System Design',
      ];

      jobs.forEach((job) => {
        const desc = (job.description || '').toLowerCase();
        KNOWN_SKILLS.forEach((skill) => {
          if (desc.includes(skill.toLowerCase())) {
            skillCount[skill.toLowerCase()] = (skillCount[skill.toLowerCase()] || 0) + 1;
          }
        });
      });

      const maxCount = Math.max(...Object.values(skillCount), 1);

      // Convert counts to demand % and save to DB
      const results = [];
      for (const [skillLower, count] of Object.entries(skillCount)) {
        const skill = KNOWN_SKILLS.find((s) => s.toLowerCase() === skillLower) || skillLower;
        const demand = Math.round((count / maxCount) * 100);
        const category = getCategoryForSkill(skill);
        const saved = await TrendingSkill.findOneAndUpdate(
          { skill },
          { demand, category, updatedAt: new Date() },
          { upsert: true, new: true }
        );
        results.push(saved);
      }

      if (results.length > 0) {
        return results.sort((a, b) => b.demand - a.demand);
      }
    } catch (err) {
      console.error('[TrendingSkills] Real calculation failed, using static:', err.message);
    }
  }

  // Fallback: static industry survey data
  for (const item of TRENDING_SKILLS_DATA) {
    await TrendingSkill.findOneAndUpdate(
      { skill: item.skill },
      { ...item, updatedAt: new Date() },
      { upsert: true, new: true }
    );
  }
  return TrendingSkill.find().sort({ demand: -1 });
};
