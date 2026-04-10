const router = require('express').Router();
const { auth, adminOnly } = require('../middleware/auth');
const {
  getAllStudents,
  getAnalytics,
  getRiskStudents,
  getAlerts,
  createJob,
  updateApplicationStatus,
} = require('../controllers/adminController');

router.use(auth, adminOnly);

router.get('/students', getAllStudents);
router.get('/analytics', getAnalytics);
router.get('/risk', getRiskStudents);
router.get('/alerts', getAlerts);
router.post('/jobs', createJob);
router.patch('/applications/:id/status', updateApplicationStatus);

module.exports = router;
