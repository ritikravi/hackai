const mongoose = require('mongoose');

const taskItemSchema = new mongoose.Schema({
  text: { type: String, required: true },
  type: { type: String, enum: ['dsa', 'apply', 'resume', 'interview', 'general'], default: 'general' },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date },
});

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tasks: [taskItemSchema],
    lastGenerated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
