const Profile = require('../models/Profile');
const InterviewResult = require('../models/InterviewResult');
const { analyzeResumeWithAI, chatWithMentor, conductMockInterview } = require('../services/openaiService');

// POST /api/ai/analyze-resume
exports.analyzeResume = async (req, res, next) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'Resume text required' });
    const analysis = await analyzeResumeWithAI(resumeText);
    res.json(analysis);
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/chat
exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    const profile = await Profile.findOne({ userId: req.user.id });
    const reply = await chatWithMentor(message, history || [], profile);
    res.json({ reply });
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/mock-interview
exports.mockInterview = async (req, res, next) => {
  try {
    const { action, question, answer, topic, history } = req.body;
    const profile = await Profile.findOne({ userId: req.user.id });

    const result = await conductMockInterview({ action, question, answer, topic, history, profile });

    // If evaluating, update interview score and save result
    if (action === 'evaluate' && result.score !== undefined) {
      const current = profile?.interviewScore || 0;
      const newScore = Math.round((current + result.score) / 2);
      await Profile.findOneAndUpdate({ userId: req.user.id }, { interviewScore: newScore });

      // Save detailed result
      const technical = Math.min(10, Math.round(result.score * 0.9 + Math.random()));
      const communication = Math.min(10, Math.round(result.score * 0.85 + Math.random() * 2));
      const confidence = Math.min(10, Math.round(result.score * 0.95 + Math.random()));
      await InterviewResult.create({
        userId: req.user.id,
        score: result.score,
        topic: topic || 'General',
        technicalScore: technical,
        communicationScore: communication,
        confidenceScore: confidence,
      });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
};
