const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

// Prevent unhandled promise rejections from crashing the server
process.on('unhandledRejection', (err) => {
  console.error('[ERROR] Unhandled rejection (suppressed):', err?.message || err);
});

process.on('uncaughtException', (err) => {
  console.error('[ERROR] Uncaught exception (suppressed):', err?.message || err);
});

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/student', require('./routes/student'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api', require('./routes/intelligence'));

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    // Start cron jobs after DB connection
    require('./services/cronService');
    require('./cron/agentCron');
    require('./cron/riskCron');

    // Start WebRTC signaling server
    require('./socket/signalingServer')(server);
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
