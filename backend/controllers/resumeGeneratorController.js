const { fetchGitHubData, fetchLeetCodeData, aggregateProfiles } = require('../services/ai/profileAggregatorService');
const { generateResume } = require('../services/ai/resumeGeneratorService');
const Job = require('../models/Job');
const Task = require('../models/Task');

// POST /api/ai/generate-resume
exports.generateResume = async (req, res, next) => {
  try {
    const { githubUsername, leetcodeUsername, linkedinSummary, jobId, marketJob } = req.body;

    if (!githubUsername && !leetcodeUsername && !linkedinSummary) {
      return res.status(400).json({ message: 'Provide at least a GitHub username or LeetCode username' });
    }

    // Fetch all profile data in parallel
    const [githubData, leetcodeData] = await Promise.all([
      fetchGitHubData(githubUsername),
      fetchLeetCodeData(leetcodeUsername),
    ]);

    // Aggregate with enhanced intelligence
    const aggregatedData = aggregateProfiles(githubData, leetcodeData, linkedinSummary);

    // Generate resume + AI intelligence
    const result = await generateResume(aggregatedData);

    // ── Job-aware mode ──────────────────────────────────────────────────────
    let jobMatchScore = null;
    let missingSkills = [];
    let jobTitle = null;

    // Support both DB job (jobId) and live market job (marketJob object)
    const targetJob = marketJob || (jobId ? await Job.findById(jobId).catch(() => null) : null);

    if (targetJob) {
      try {
        jobTitle = `${targetJob.role} at ${targetJob.company}`;
        const studentSkillsLower = aggregatedData.skills.map((s) => s.toLowerCase());
        const required = (targetJob.skillsRequired || []).map((s) => s.toLowerCase());
        const matched = required.filter((s) => studentSkillsLower.includes(s));
        missingSkills = (targetJob.skillsRequired || []).filter((s) => !studentSkillsLower.includes(s.toLowerCase()));
        jobMatchScore = required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;

        // Auto-assign tasks for missing skills
        if (missingSkills.length > 0 && req.user?.id) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const agentTasks = missingSkills.slice(0, 3).map((skill) => ({
            text: `📚 Learn ${skill} to qualify for ${targetJob.role} at ${targetJob.company}`,
            type: 'general',
            completed: false,
            dueDate: tomorrow,
          }));
          await Task.findOneAndUpdate(
            { userId: req.user.id },
            { $push: { tasks: { $each: agentTasks } } },
            { upsert: true }
          );
        }
      } catch (err) {
        console.error('[ResumeGen] Job match error:', err.message);
      }
    }

    res.json({
      success: true,
      githubData,
      leetcodeData,
      // Core resume output
      resumeText: result.resumeText,
      suggestions: result.suggestions,
      improvementPlan: result.improvementPlan,
      // Structured arrays
      suggestionsArray: result.suggestionsArray,
      roadmapArray: result.roadmapArray,
      summary: result.summary,
      highlights: result.highlights,
      // Intelligence scores
      resumeScore: aggregatedData.resumeScore,
      profileCompleteness: aggregatedData.profileCompleteness,
      skillIntelligence: aggregatedData.skillIntelligence,
      projectsDetailed: aggregatedData.projectsDetailed,
      // Job-aware (optional)
      jobMatchScore,
      missingSkills,
      jobTitle,
      // Full aggregated data
      aggregatedData,
    });
  } catch (err) {
    next(err);
  }
};
