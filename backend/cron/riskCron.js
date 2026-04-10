const cron = require('node-cron');
const { detectRisks } = require('../services/placement/riskDetectionService');
const { triggerIntervention } = require('../services/ai/interventionService');
const Profile = require('../models/Profile');

// Run risk detection every day at 8 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[RISK CRON] Running risk detection...');
  try {
    const risks = await detectRisks();
    for (const risk of risks) {
      if (risk.riskLevel === 'HIGH') {
        const profile = await Profile.findOne({ userId: risk.student.id });
        await triggerIntervention(risk.student, profile, risk.flags);
        console.log(`[RISK CRON] Intervention triggered for ${risk.student.name}`);
      }
    }
    console.log(`[RISK CRON] Done. Found ${risks.length} at-risk students.`);
  } catch (err) {
    console.error('[RISK CRON] Error:', err.message);
  }
});

console.log('[RISK CRON] Initialized');
