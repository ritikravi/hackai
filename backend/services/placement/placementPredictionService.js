const Profile = require('../../models/Profile');
const Application = require('../../models/Application');

// Weighted placement score formula
const calcScore = (skillCount, appCount, interviewScore) => {
  const s = Math.min(skillCount * 4, 40);   // max 40
  const a = Math.min(appCount * 6, 30);     // max 30
  const i = Math.round((interviewScore / 10) * 30); // max 30
  return Math.min(s + a + i, 100);
};

// Confidence based on data completeness
const calcConfidence = (profile, appCount) => {
  let score = 0;
  if (profile.skills?.length > 0) score += 30;
  if (profile.resumeText?.length > 100) score += 25;
  if (appCount > 0) score += 25;
  if (profile.interviewScore > 0) score += 20;
  return score;
};

exports.computePrediction = async (userId) => {
  const profile = await Profile.findOne({ userId });
  const applications = await Application.find({ userId });

  const skillCount = profile?.skills?.length || 0;
  const appCount = applications.length;
  const interviewScore = profile?.interviewScore || 0;

  const placementScore = calcScore(skillCount, appCount, interviewScore);
  const confidence = calcConfidence(profile, appCount);

  // Trend: compare current score vs stored score
  const prevScore = profile?.placementScore || 0;
  const trend = placementScore > prevScore + 2 ? 'up' : placementScore < prevScore - 2 ? 'down' : 'stable';

  // Save back to profile
  await Profile.findOneAndUpdate(
    { userId },
    { placementScore, confidence, trend, placementProbability: placementScore },
    { new: true }
  );

  return { placementScore, confidence, trend, skillCount, appCount, interviewScore };
};
