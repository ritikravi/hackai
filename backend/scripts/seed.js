/**
 * Seed script – populates demo data for hackathon demo
 * Run: node scripts/seed.js
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const User = require('../models/User');
const Profile = require('../models/Profile');
const Job = require('../models/Job');
const Task = require('../models/Task');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hackai';

const jobs = [
  { company: 'Google', role: 'Software Engineer', skillsRequired: ['JavaScript', 'Python', 'Data Structures', 'System Design'], location: 'Bangalore', salary: '₹25 LPA', description: 'Build scalable systems at Google.' },
  { company: 'Microsoft', role: 'Frontend Developer', skillsRequired: ['React', 'TypeScript', 'CSS', 'JavaScript'], location: 'Hyderabad', salary: '₹18 LPA', description: 'Build world-class UI at Microsoft.' },
  { company: 'Amazon', role: 'Backend Engineer', skillsRequired: ['Node.js', 'AWS', 'MongoDB', 'Python'], location: 'Remote', salary: '₹20 LPA', description: 'Scale backend services at Amazon.' },
  { company: 'Flipkart', role: 'Full Stack Developer', skillsRequired: ['React', 'Node.js', 'MongoDB', 'SQL'], location: 'Bangalore', salary: '₹15 LPA', description: 'Full stack role at Flipkart.' },
  { company: 'Infosys', role: 'Java Developer', skillsRequired: ['Java', 'Spring Boot', 'SQL', 'REST APIs'], location: 'Pune', salary: '₹8 LPA', description: 'Java development at Infosys.' },
  { company: 'Startup XYZ', role: 'React Developer', skillsRequired: ['React', 'JavaScript', 'CSS'], location: 'Remote', salary: '₹10 LPA', description: 'Build product at a fast-growing startup.' },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Job.deleteMany({});
  console.log('Cleared jobs');

  // Insert jobs
  await Job.insertMany(jobs);
  console.log(`Inserted ${jobs.length} jobs`);

  // Create demo admin if not exists
  const adminExists = await User.findOne({ email: 'admin@hackai.com' });
  if (!adminExists) {
    await User.create({ name: 'TPC Admin', email: 'admin@hackai.com', password: 'admin123', role: 'admin' });
    console.log('Created admin: admin@hackai.com / admin123');
  }

  // Create demo student if not exists
  const studentExists = await User.findOne({ email: 'student@hackai.com' });
  if (!studentExists) {
    const student = await User.create({ name: 'Demo Student', email: 'student@hackai.com', password: 'student123', role: 'student' });
    await Profile.create({
      userId: student._id,
      skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
      weaknesses: ['System Design', 'DSA'],
      projects: ['E-commerce App', 'Chat Application'],
      placementProbability: 62,
      interviewScore: 6,
      activityScore: 20,
      riskLevel: 'At Risk',
    });
    await Task.create({
      userId: student._id,
      tasks: [
        { text: 'Practice 2 DSA problems on LeetCode', type: 'dsa', completed: false },
        { text: 'Apply to at least 2 companies today', type: 'apply', completed: false },
        { text: 'Complete a mock interview session', type: 'interview', completed: false },
      ],
    });
    console.log('Created student: student@hackai.com / student123');
  }

  console.log('\n✅ Seed complete!');
  console.log('Demo credentials:');
  console.log('  Admin:   admin@hackai.com   / admin123');
  console.log('  Student: student@hackai.com / student123');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
