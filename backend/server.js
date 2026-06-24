import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import matchesRouter, { syncLiveMatches } from './routes/matches.js';
import { dbService } from './services/dbService.js';
import { startSimulation } from './services/matchSimulator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
await connectDB();

// Middlewares
app.use(cors({
  origin: '*', // Allow all origins for local testing ease
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/matches', matchesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Setup server and socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Save socket server to app state so it is accessible in routes
app.set('io', io);

// Socket events handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join_match', (matchId) => {
    socket.join(String(matchId));
    console.log(`Client ${socket.id} joined room for match ${matchId}`);
  });

  socket.on('leave_match', (matchId) => {
    socket.leave(String(matchId));
    console.log(`Client ${socket.id} left room for match ${matchId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Auto-resume simulations that were active before server restart
const resumeSimulations = async () => {
  try {
    const matches = await dbService.getMatches();
    let resumeCount = 0;
    for (const match of matches) {
      if (match.status === 'live' && match.simulationSpeed > 0) {
        startSimulation(match._id, io, match.simulationSpeed);
        resumeCount++;
      }
    }
    if (resumeCount > 0) {
      console.log(`Resumed ${resumeCount} active match simulations from DB.`);
    }
  } catch (error) {
    console.error('Error resuming active simulations:', error);
  }
};

// Start listening
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Seed the DB if it is empty to ensure user has a great immediate experience
  try {
    const response = await fetch(`http://localhost:${PORT}/api/matches/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log('Database seeding check completed:', data.message);
  } catch (err) {
    console.log('Server started, self-seeding trigger skipped (will run on first request).');
  }

  // Resume active simulations
  await resumeSimulations();

  // Initial sync check
  syncLiveMatches(io).catch(err => console.error('Initial live sync error:', err.message));

  // Periodically sync live matches list in background every 60 seconds
  setInterval(() => {
    syncLiveMatches(io).catch(err => console.error('Recurring live sync error:', err.message));
  }, 60000);
});
