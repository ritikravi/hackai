const fs = require('fs');
const path = require('path');
const Profile = require('../models/Profile');
const Task = require('../models/Task');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Alert = require('../models/Alert');
const { analyzeResumeWithAI } = require('../services/openaiService');
const { calculatePlacementProbability, classifyRisk } = require('../services/decisionEngine');

// Helper: extract text from PDF with fallback for malformed PDFs
const extractPdfText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  // Try strict parse first, fall back to lenient options
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch {
    try {
      const pdfParse = require('pdf-parse');
      // Lenient mode: ignore bad xref, use max pages
      const data = await pdfParse(dataBuffer, {
        max: 0,
        version: 'v1.10.100',
      });
      return data.text;
    } catch {
      // Last resort: extract raw readable strings from buffer
      const raw = dataBuffer.toString('latin1');
      const strings = raw.match(/\(([^\)]{3,200})\)/g) || [];
      return strings
        .map((s) => s.slice(1, -1))
        .filter((s) => /[a-zA-Z]{3,}/.test(s))
        .join(' ')
        .slice(0, 4000);
    }
  }
};
exports.getDashboard = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    const taskDoc = await Task.findOne({ userId: req.user.id });
    const applications = await Application.find({ userId: req.user.id }).populate('jobId', 'company role');
    const alerts = await Alert.find({ userId: req.user.id, read: false }).sort({ createdAt: -1 }).limit(5);

    // Update last active
    if (profile) {
      profile.lastActive = new Date();
      await profile.save();
    }

    res.json({
      profile,
      tasks: taskDoc?.tasks || [],
      applications,
      alerts,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/upload-resume
exports.uploadResume = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);

    // Extract text with fallback for malformed PDFs
    let resumeText = '';
    try {
      resumeText = await extractPdfText(filePath);
    } catch (err) {
      console.error('PDF parse error:', err.message);
    }

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(422).json({
        message: 'Could not extract text from this PDF. Please try a different PDF (avoid scanned/image-only PDFs).',
      });
    }

    // Send to OpenAI for analysis
    const analysis = await analyzeResumeWithAI(resumeText);

    // Update profile
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.id },
      {
        resumeUrl: `/uploads/${req.file.filename}`,
        resumeText,
        skills: analysis.skills || [],
        weaknesses: analysis.weaknesses || [],
        projects: analysis.projects || [],
      },
      { new: true, upsert: true }
    );

    // Recalculate placement probability
    const applications = await Application.find({ userId: req.user.id });
    const probability = calculatePlacementProbability(profile, applications);
    const riskLevel = classifyRisk(profile, applications);
    profile.placementProbability = probability;
    profile.riskLevel = riskLevel;
    await profile.save();

    res.json({ message: 'Resume analyzed successfully', analysis, profile });
  } catch (err) {
    next(err);
  }
};

// GET /api/student/jobs
exports.getJobRecommendations = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ userId: req.user.id });
    const studentSkills = profile?.skills?.map((s) => s.toLowerCase()) || [];

    const jobs = await Job.find({ isActive: true });

    // Score each job by skill overlap
    const scored = jobs.map((job) => {
      const required = job.skillsRequired.map((s) => s.toLowerCase());
      const matched = required.filter((s) => studentSkills.includes(s));
      const score = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;
      return { ...job.toObject(), matchScore: score, matchedSkills: matched };
    });

    scored.sort((a, b) => b.matchScore - a.matchScore);
    res.json(scored);
  } catch (err) {
    next(err);
  }
};

// GET /api/student/tasks
exports.getTasks = async (req, res, next) => {
  try {
    const taskDoc = await Task.findOne({ userId: req.user.id });
    res.json(taskDoc?.tasks || []);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/student/tasks/:taskId/complete
exports.completeTask = async (req, res, next) => {
  try {
    const taskDoc = await Task.findOne({ userId: req.user.id });
    if (!taskDoc) return res.status(404).json({ message: 'Tasks not found' });

    const task = taskDoc.tasks.id(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.completed = true;
    await taskDoc.save();

    // Boost activity score
    await Profile.findOneAndUpdate({ userId: req.user.id }, { $inc: { activityScore: 5 } });

    res.json({ message: 'Task marked complete' });
  } catch (err) {
    next(err);
  }
};

// POST /api/student/apply/:jobId
exports.applyToJob = async (req, res, next) => {
  try {
    const exists = await Application.findOne({ userId: req.user.id, jobId: req.params.jobId });
    if (exists) return res.status(409).json({ message: 'Already applied' });

    const application = await Application.create({ userId: req.user.id, jobId: req.params.jobId });

    // Boost activity score
    await Profile.findOneAndUpdate({ userId: req.user.id }, { $inc: { activityScore: 10 } });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
};
