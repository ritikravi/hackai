const router = require('express').Router();
const { auth } = require('../middleware/auth');
const { analyzeResume, chat, mockInterview } = require('../controllers/aiController');
const { generateResume } = require('../controllers/resumeGeneratorController');
const { textToSpeech } = require('../controllers/ttsController');

router.use(auth);

router.post('/analyze-resume', analyzeResume);
router.post('/chat', chat);
router.post('/mock-interview', mockInterview);
router.post('/generate-resume', generateResume);
router.post('/tts', textToSpeech);

module.exports = router;
