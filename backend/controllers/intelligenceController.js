const { computePrediction } = require('../services/placement/placementPredictionService');
const { analyzeSkillGap } = require('../services/placement/skillGapService');
const { getDigitalTwin } = require('../services/ai/digitalTwinService');
const { getInterviewAnalytics } = require('../services/ai/interviewAnalyticsService');
const { getMarketJobs, getTrendingSkills, searchJobs } = require('../services/jobs/marketJobService');
const { detectRisks } = require('../services/placement/riskDetectionService');
const { runAgentCycle } = require('../services/ai/agentEngine');
const InterventionLog = require('../models/InterventionLog');
const InterviewResult = require('../models/InterviewResult');

// GET /api/student/prediction
exports.getPrediction = async (req, res, next) => {
  try {
    const data = await computePrediction(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
};

// GET /api/student/digital-twin
exports.getDigitalTwin = async (req, res, next) => {
  try {
    const data = await getDigitalTwin(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
};

// GET /api/student/skill-gap/:jobId
exports.getSkillGap = async (req, res, next) => {
  try {
    const data = await analyzeSkillGap(req.user.id, req.params.jobId);
    res.json(data);
  } catch (err) { next(err); }
};

// GET /api/student/interview-analytics
exports.getInterviewAnalytics = async (req, res, next) => {
  try {
    const data = await getInterviewAnalytics(req.user.id);
    res.json(data);
  } catch (err) { next(err); }
};

// POST /api/student/interview-result  (save after mock interview)
exports.saveInterviewResult = async (req, res, next) => {
  try {
    const { score, topic, questionsAnswered } = req.body;
    // Derive sub-scores from overall score with slight variation
    const technical = Math.min(10, Math.round(score * 0.9 + Math.random()));
    const communication = Math.min(10, Math.round(score * 0.85 + Math.random() * 2));
    const confidence = Math.min(10, Math.round(score * 0.95 + Math.random()));

    const result = await InterviewResult.create({
      userId: req.user.id,
      score, topic, questionsAnswered: questionsAnswered || 5,
      technicalScore: technical,
      communicationScore: communication,
      confidenceScore: confidence,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
};

// GET /api/jobs/search?q=react+developer
exports.searchJobs = async (req, res, next) => {
  try {
    const jobs = await searchJobs(req.query.q || 'software engineer India');
    res.json(jobs);
  } catch (err) { next(err); }
};
exports.getTrendingSkills = async (req, res, next) => {
  try {
    const data = await getTrendingSkills();
    res.json(data);
  } catch (err) { next(err); }
};

// GET /api/jobs/market
exports.getMarketJobs = async (req, res, next) => {
  try {
    const jobs = await getMarketJobs();
    res.json(Array.isArray(jobs) ? jobs : []);
  } catch (err) { next(err); }
};

// GET /api/admin/interventions
exports.getInterventions = async (req, res, next) => {
  try {
    const logs = await InterventionLog.find()
      .sort({ triggeredAt: -1 })
      .limit(50)
      .populate('userId', 'name email');
    res.json(logs);
  } catch (err) { next(err); }
};

// GET /api/admin/risk-detection
exports.getRiskDetection = async (req, res, next) => {
  try {
    const risks = await detectRisks();
    res.json(risks);
  } catch (err) { next(err); }
};

// POST /api/admin/run-agent
exports.runAgent = async (req, res, next) => {
  try {
    const results = await runAgentCycle();
    res.json({ message: 'Agent cycle complete', results });
  } catch (err) { next(err); }
};
