const mongoose = require('mongoose');

const interventionLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  flags: [{ type: String }],
  actions: [{ type: String }],
  triggeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('InterventionLog', interventionLogSchema);
