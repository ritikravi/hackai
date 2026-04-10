const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: [{ type: String }],
    weaknesses: [{ type: String }],
    projects: [{ type: String }],
    resumeUrl: { type: String, default: '' },
    resumeText: { type: String, default: '' },
    placementProbability: { type: Number, default: 0 }, // 0-100
    interviewScore: { type: Number, default: 0 },       // avg mock interview score
    activityScore: { type: Number, default: 0 },        // engagement metric
    riskLevel: { type: String, enum: ['Ready', 'At Risk', 'Unprepared'], default: 'Unprepared' },
    lastActive: { type: Date, default: Date.now },
    placementScore: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    trend: { type: String, enum: ['up', 'down', 'stable'], default: 'stable' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
