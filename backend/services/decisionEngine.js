/**
 * Decision Engine – Rule-based + weighted scoring
 * Calculates placement probability and risk classification
 */

// Weighted placement probability (0-100)
exports.calculatePlacementProbability = (profile, applications) => {
  if (!profile) return 0;

  let score = 0;

  // Skills weight: 40 points max
  const skillCount = profile.skills?.length || 0;
  score += Math.min(skillCount * 4, 40);

  // Applications weight: 30 points max
  const appCount = applications?.length || 0;
  score += Math.min(appCount * 6, 30);

  // Interview performance weight: 20 points max
  const interviewScore = profile.interviewScore || 0;
  score += Math.round((interviewScore / 10) * 20);

  // Activity weight: 10 points max
  const activityScore = profile.activityScore || 0;
  score += Math.min(activityScore, 10);

  return Math.min(Math.round(score), 100);
};

// Risk classification
exports.classifyRisk = (profile, applications) => {
  const skillCount = profile?.skills?.length || 0;
  const appCount = applications?.length || 0;
  const activityScore = profile?.activityScore || 0;
  const interviewScore = profile?.interviewScore || 0;

  // High risk: low skills + no applications + low activity
  if (skillCount < 3 && appCount === 0 && activityScore < 10) return 'Unprepared';

  // At risk: some skills but low engagement
  if (skillCount < 5 && appCount < 3 && interviewScore < 5) return 'At Risk';

  // Ready: good skills + active applications
  if (skillCount >= 5 && appCount >= 3) return 'Ready';

  return 'At Risk';
};

// Generate rule-based tasks (fallback when OpenAI is unavailable)
exports.generateRuleBasedTasks = (profile, applicationCount) => {
  const tasks = [];
  const skills = profile?.skills?.length || 0;
  const riskLevel = profile?.riskLevel || 'Unprepared';

  if (skills < 3) {
    tasks.push({ text: 'Add at least 3 technical skills to your profile', type: 'resume' });
  }

  if (applicationCount < 3) {
    tasks.push({ text: 'Apply to at least 3 companies this week', type: 'apply' });
  }

  if ((profile?.interviewScore || 0) < 6) {
    tasks.push({ text: 'Complete a mock interview session to improve your score', type: 'interview' });
  }

  tasks.push({ text: 'Solve 2 DSA problems on LeetCode (Arrays/Strings)', type: 'dsa' });

  if (riskLevel === 'Unprepared') {
    tasks.push({ text: 'Upload your resume for AI analysis', type: 'resume' });
  }

  return tasks;
};
