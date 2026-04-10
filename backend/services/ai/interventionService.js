const Task = require('../../models/Task');
const Alert = require('../../models/Alert');
const InterventionLog = require('../../models/InterventionLog');

exports.triggerIntervention = async (student, profile, flags) => {
  const actions = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Build targeted tasks based on flags
  const newTasks = [];
  if (flags.includes('Low skills')) {
    newTasks.push({ text: '🚨 URGENT: Add at least 5 skills to your profile', type: 'resume', dueDate: tomorrow });
    newTasks.push({ text: 'Complete a JavaScript/Python crash course today', type: 'dsa', dueDate: tomorrow });
  }
  if (flags.includes('No applications')) {
    newTasks.push({ text: '🚨 URGENT: Apply to at least 3 companies today', type: 'apply', dueDate: tomorrow });
  }
  if (flags.some((f) => f.includes('Inactive'))) {
    newTasks.push({ text: '🚨 Log in daily and complete at least one task', type: 'general', dueDate: tomorrow });
  }
  if (flags.includes('Low interview score')) {
    newTasks.push({ text: '🚨 Practice mock interview — score needs improvement', type: 'interview', dueDate: tomorrow });
  }

  // Inject tasks
  if (newTasks.length > 0) {
    await Task.findOneAndUpdate(
      { userId: student.id },
      { $push: { tasks: { $each: newTasks } } },
      { upsert: true }
    );
    actions.push(`Assigned ${newTasks.length} intervention tasks`);
  }

  // Create alert for student
  await Alert.create({
    userId: student.id,
    message: `⚠️ AI Intervention: Your placement is at risk. Flags: ${flags.join(', ')}. Check your tasks immediately.`,
    type: 'danger',
    targetRole: 'student',
  });

  // Create alert for admin
  await Alert.create({
    userId: student.id,
    message: `🚨 Auto-intervention triggered for ${student.name}. Risk flags: ${flags.join(', ')}`,
    type: 'danger',
    targetRole: 'admin',
  });

  actions.push('Alerts sent to student and admin');

  // Log intervention
  await InterventionLog.create({
    userId: student.id,
    flags,
    actions,
    triggeredAt: new Date(),
  });

  return actions;
};
