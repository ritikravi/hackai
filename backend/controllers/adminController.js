const User = require('../models/User');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const Alert = require('../models/Alert');
const Job = require('../models/Job');

// GET /api/admin/students
exports.getAllStudents = async (req, res, next) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    const profiles = await Profile.find();
    const applications = await Application.find().populate('jobId', 'company role');

    const data = students.map((s) => {
      const profile = profiles.find((p) => p.userId.toString() === s._id.toString());
      const apps = applications.filter((a) => a.userId.toString() === s._id.toString());
      return { student: s, profile, applications: apps };
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const profiles = await Profile.find();

    const placed = profiles.filter((p) =>
      ['Offered'].includes(p.riskLevel === 'Ready' ? 'Offered' : '')
    ).length;

    const ready = profiles.filter((p) => p.riskLevel === 'Ready').length;
    const atRisk = profiles.filter((p) => p.riskLevel === 'At Risk').length;
    const unprepared = profiles.filter((p) => p.riskLevel === 'Unprepared').length;

    const totalApplications = await Application.countDocuments();
    const offeredCount = await Application.countDocuments({ status: 'Offered' });

    res.json({
      totalStudents,
      placed: offeredCount,
      unplaced: totalStudents - offeredCount,
      ready,
      atRisk,
      unprepared,
      totalApplications,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/risk
exports.getRiskStudents = async (req, res, next) => {
  try {
    const riskProfiles = await Profile.find({ riskLevel: { $in: ['At Risk', 'Unprepared'] } }).populate(
      'userId',
      'name email'
    );
    res.json(riskProfiles);
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/alerts
exports.getAlerts = async (req, res, next) => {
  try {
    const alerts = await Alert.find({ targetRole: { $in: ['admin', 'both'] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('userId', 'name email');
    res.json(alerts);
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/jobs
exports.createJob = async (req, res, next) => {
  try {
    const job = await Job.create(req.body);
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/applications/:id/status
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(app);
  } catch (err) {
    next(err);
  }
};
