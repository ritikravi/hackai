const mongoose = require('mongoose');

const interviewResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topic: { type: String, default: 'General' },
  score: { type: Number, default: 0 },           // overall 0-10
  technicalScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  confidenceScore: { type: Number, default: 0 },
  questionsAnswered: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('InterviewResult', interviewResultSchema);
