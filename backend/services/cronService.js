const cron = require('node-cron');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Task = require('../models/Task');
const Application = require('../models/Application');
const Alert = require('../models/Alert');
const { generateAITasks } = require('./openaiService');
const { generateRuleBasedTasks, calculatePlacementProbability, classifyRisk } = require('./decisionEngine');

/**
 * Daily cron job – runs at 6 AM every day
 * 1. Regenerates AI tasks for each student
 * 2. Recalculates placement probability
 * 3. Classifies risk and fires alerts
 */
cron.schedule('0 6 * * *', async () => {
  console.log('[CRON] Running daily placement intelligence job...');

  try {
    const students = await User.find({ role: 'student' });

    for (const student of students) {
      const profile = await Profile.findOne({ userId: student._id });
      if (!profile) continue;

      const applications = await Application.find({ userId: student._id });

      // Recalculate probability and risk
      const probability = calculatePlacementProbability(profile, applications);
      const riskLevel = classifyRisk(profile, applications);
      profile.placementProbability = probability;
      profile.riskLevel = riskLevel;
      await profile.save();

      // Generate tasks (AI with rule-based fallback)
      let newTasks;
      try {
        newTasks = await generateAITasks(profile, applications.length);
      } catch {
        newTasks = generateRuleBasedTasks(profile, applications.length);
      }

      // Add due date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tasksWithDate = newTasks.map((t) => ({ ...t, completed: false, dueDate: tomorrow }));

      // Replace incomplete tasks with fresh ones
      await Task.findOneAndUpdate(
        { userId: student._id },
        { tasks: tasksWithDate, lastGenerated: new Date() },
        { upsert: true }
      );

      // Fire alerts for high-risk students
      if (riskLevel === 'Unprepared' || riskLevel === 'At Risk') {
        await Alert.create({
          userId: student._id,
          message: `Student ${student.name} is classified as "${riskLevel}". Immediate attention needed.`,
          type: riskLevel === 'Unprepared' ? 'danger' : 'warning',
          targetRole: 'admin',
        });

        await Alert.create({
          userId: student._id,
          message: `Your placement readiness is "${riskLevel}". Complete your daily tasks to improve.`,
          type: 'warning',
          targetRole: 'student',
        });
      }

      // Alert for inactive students (no activity in 3 days)
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      if (profile.lastActive < threeDaysAgo) {
        await Alert.create({
          userId: student._id,
          message: `${student.name} has been inactive for 3+ days.`,
          type: 'warning',
          targetRole: 'admin',
        });
      }
    }

    console.log('[CRON] Daily job completed successfully');
  } catch (err) {
    console.error('[CRON] Error in daily job:', err.message);
  }
});

console.log('[CRON] Scheduler initialized');
