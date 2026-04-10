const mongoose = require('mongoose');

const trendingSkillSchema = new mongoose.Schema({
  skill: { type: String, required: true, unique: true },
  demand: { type: Number, default: 0 }, // percentage
  category: { type: String, default: 'General' },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('TrendingSkill', trendingSkillSchema);
