const InterviewResult = require('../../models/InterviewResult');

exports.getInterviewAnalytics = async (userId) => {
  const results = await InterviewResult.find({ userId }).sort({ createdAt: -1 }).limit(20);

  if (!results.length) {
    return {
      totalSessions: 0,
      avgScore: 0,
      technicalAvg: 0,
      communicationAvg: 0,
      confidenceAvg: 0,
      history: [],
    };
  }

  const avg = (arr, key) =>
    Math.round(arr.reduce((s, r) => s + (r[key] || 0), 0) / arr.length);

  return {
    totalSessions: results.length,
    avgScore: avg(results, 'score'),
    technicalAvg: avg(results, 'technicalScore'),
    communicationAvg: avg(results, 'communicationScore'),
    confidenceAvg: avg(results, 'confidenceScore'),
    history: results.map((r) => ({
      date: r.createdAt,
      score: r.score,
      topic: r.topic,
      technicalScore: r.technicalScore,
      communicationScore: r.communicationScore,
      confidenceScore: r.confidenceScore,
    })),
  };
};
