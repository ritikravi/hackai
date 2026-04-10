const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['warning', 'info', 'danger'], default: 'info' },
    read: { type: Boolean, default: false },
    targetRole: { type: String, enum: ['student', 'admin', 'both'], default: 'both' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
