const Profile = require('../../models/Profile');
const Application = require('../../models/Application');
const User = require('../../models/User');

exports.detectRisks = async () => {
  const students = await User.find({ role: 'student' });
  const risks = [];

  for (const student of students) {
    const profile = await Profile.findOne({ userId: student._id });
    if (!profile) continue;

    const applications = await Application.find({ userId: student._id });
    const appCount = applications.length;
    const skillCount = profile.skills?.length || 0;
    const daysSinceActive = profile.lastActive
      ? Math.floor((Date.now() - new Date(profile.lastActive)) / (1000 * 60 * 60 * 24))
      : 999;

    const flags = [];
    if (skillCount < 3) flags.push('Low skills');
    if (appCount === 0) flags.push('No applications');
    if (daysSinceActive > 5) flags.push(`Inactive ${daysSinceActive} days`);
    if (profile.interviewScore < 4) flags.push('Low interview score');

    const riskLevel = flags.length >= 3 ? 'HIGH' : flags.length >= 2 ? 'MEDIUM' : flags.length === 1 ? 'LOW' : 'NONE';

    if (riskLevel !== 'NONE') {
      risks.push({
        student: { id: student._id, name: student.name, email: student.email },
        profile: { skillCount, appCount, interviewScore: profile.interviewScore, daysSinceActive },
        flags,
        riskLevel,
      });
    }
  }

  return risks;
};
