const Profile = require('../../models/Profile');
const Job = require('../../models/Job');

exports.analyzeSkillGap = async (userId, jobId) => {
  const profile = await Profile.findOne({ userId });
  const job = await Job.findById(jobId);

  if (!job) throw new Error('Job not found');

  const studentSkills = (profile?.skills || []).map((s) => s.toLowerCase());
  const required = (job.skillsRequired || []).map((s) => s.toLowerCase());

  const matchedSkills = required.filter((s) => studentSkills.includes(s));
  const missingSkills = required.filter((s) => !studentSkills.includes(s));
  const gapPercentage = required.length > 0
    ? Math.round((missingSkills.length / required.length) * 100)
    : 0;

  // Simple roadmap suggestions per missing skill
  const roadmap = missingSkills.map((skill) => ({
    skill,
    suggestion: `Learn ${skill} via online courses (Coursera, Udemy, or YouTube)`,
    priority: gapPercentage > 60 ? 'High' : 'Medium',
  }));

  return {
    jobTitle: `${job.role} at ${job.company}`,
    matchedSkills,
    missingSkills,
    gapPercentage,
    matchPercentage: 100 - gapPercentage,
    roadmap,
  };
};
