const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company: { type: String, required: true },
    role: { type: String, required: true },
    skillsRequired: [{ type: String }],
    description: { type: String, default: '' },
    location: { type: String, default: 'Remote' },
    salary: { type: String, default: 'Not disclosed' },
    deadline: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);
