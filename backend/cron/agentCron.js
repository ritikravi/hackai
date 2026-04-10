const cron = require('node-cron');
const { runAgentCycle } = require('../services/ai/agentEngine');

// Run agent every day at 7 AM
cron.schedule('0 7 * * *', async () => {
  console.log('[AGENT CRON] Running autonomous agent cycle...');
  const results = await runAgentCycle();
  console.log(`[AGENT CRON] Done. Processed ${results.length} students.`);
});

console.log('[AGENT CRON] Initialized');
