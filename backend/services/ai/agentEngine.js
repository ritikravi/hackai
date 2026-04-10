const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Application = require('../../models/Application');
const Task = require('../../models/Task');
const { generateAITasks } = require('../openaiService');
const { generateRuleBasedTasks } = require('../decisionEngine');
const { computePrediction } = require('../placement/placementPredictionService');
const { triggerIntervention } = require('./interventionService');
const { detectRisks } = require('../placement/riskDetectionService');

/**
 * Core Agentic Engine
 * Analyzes all students, makes decisions, assigns tasks, triggers interventions
 */
exports.runAgentCycle = async () => {
  console.log('[AGENT] Starting autonomous agent cycle...');
  const results = [];

  try {
    const risks = await detectRisks();

    for (const risk of risks) {
      const { student, flags, riskLevel } = risk;

      // HIGH risk → trigger full intervention
      if (riskLevel === 'HIGH') {
        const profile = await Profile.findOne({ userId: student.id });
        const actions = await triggerIntervention(student, profile, flags);
        results.push({ student: student.name, riskLevel, actions });
        continue;
      }

      // MEDIUM/LOW → generate smart tasks
      const profile = await Profile.findOne({ userId: student.id });
      const applications = await Application.find({ userId: student.id });

      let tasks;
      try {
        tasks = await generateAITasks(profile, applications.length);
      } catch {
        tasks = generateRuleBasedTasks(profile, applications.length);
      }

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tasksWithDate = tasks.map((t) => ({ ...t, completed: false, dueDate: tomorrow }));

      await Task.findOneAndUpdate(
        { userId: student.id },
        { tasks: tasksWithDate, lastGenerated: new Date() },
        { upsert: true }
      );

      // Recompute prediction score
      await computePrediction(student.id);

      results.push({ student: student.name, riskLevel, actions: [`Generated ${tasks.length} tasks`] });
    }

    console.log(`[AGENT] Cycle complete. Processed ${results.length} at-risk students.`);
  } catch (err) {
    console.error('[AGENT] Error in agent cycle:', err.message);
  }

  return results;
};
