const router = require('express').Router();
const { auth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getDashboard,
  uploadResume,
  getJobRecommendations,
  getTasks,
  completeTask,
  applyToJob,
} = require('../controllers/studentController');

router.use(auth);

router.get('/dashboard', getDashboard);
router.post('/upload-resume', upload.single('resume'), uploadResume);
router.get('/jobs', getJobRecommendations);
router.get('/tasks', getTasks);
router.patch('/tasks/:taskId/complete', completeTask);
router.post('/apply/:jobId', applyToJob);

module.exports = router;
