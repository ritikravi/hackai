const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const c = require('../controllers/intelligenceController');

// Student routes
router.get('/student/prediction', auth, c.getPrediction);
router.get('/student/digital-twin', auth, c.getDigitalTwin);
router.get('/student/skill-gap/:jobId', auth, c.getSkillGap);
router.get('/student/interview-analytics', auth, c.getInterviewAnalytics);
router.post('/student/interview-result', auth, c.saveInterviewResult);

// Jobs routes
router.get('/jobs/trending', auth, c.getTrendingSkills);
router.get('/jobs/market', auth, c.getMarketJobs);
router.get('/jobs/search', auth, c.searchJobs);

// Admin routes
router.get('/admin/interventions', auth, adminOnly, c.getInterventions);
router.get('/admin/risk-detection', auth, adminOnly, c.getRiskDetection);
router.post('/admin/run-agent', auth, adminOnly, c.runAgent);

module.exports = router;
