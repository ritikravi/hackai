const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Rejected'],
      default: 'Applied',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Application', applicationSchema);
