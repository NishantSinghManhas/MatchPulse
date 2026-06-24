import mongoose from 'mongoose';

const PlayerPerformanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  runs: { type: Number, default: 0 },
  balls: { type: Number, default: 0 },
  fours: { type: Number, default: 0 },
  sixes: { type: Number, default: 0 },
  isOut: { type: Boolean, default: false },
  howOut: { type: String, default: '' },
  isStriker: { type: Boolean, default: false },
  isNonStriker: { type: Boolean, default: false }
});

const BowlerPerformanceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  overs: { type: Number, default: 0 }, // e.g. 3.2
  maidens: { type: Number, default: 0 },
  runs: { type: Number, default: 0 },
  wickets: { type: Number, default: 0 },
  isActive: { type: Boolean, default: false }
});

const CommentarySchema = new mongoose.Schema({
  over: { type: Number, required: true },
  ball: { type: Number, required: true },
  bowler: { type: String, default: '' },
  batsman: { type: String, default: '' },
  runs: { type: Number, default: 0 },
  eventType: { type: String, default: 'run' }, // run, boundary, wicket, extra, dot
  text: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const TeamDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  logo: { type: String, default: '' },
  squad: [{ type: String }]
});

const MatchSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "1st T20I"
  series: { type: String, required: true }, // e.g., "India tour of Australia, 2026"
  format: { type: String, default: 'T20' }, // e.g., "T20", "T20I", "ODI", "TEST"
  venue: { type: String, required: true }, // e.g., "Melbourne Cricket Ground"
  date: { type: String, default: () => new Date().toLocaleDateString() },
  status: { type: String, enum: ['upcoming', 'live', 'completed'], default: 'upcoming' },
  oversLimit: { type: Number, default: 20 },
  externalSource: { type: String, default: '' },
  externalId: { type: String, default: '' },

  teams: {
    teamA: TeamDetailsSchema,
    teamB: TeamDetailsSchema
  },
  toss: {
    winner: { type: String, default: '' }, // "teamA" or "teamB"
    decision: { type: String, enum: ['bat', 'bowl', ''], default: '' },
    text: { type: String, default: '' } // e.g., "India won the toss & elected to bat"
  },
  battingFirst: { type: String, default: '' }, // "teamA" or "teamB"
  currentInnings: { type: Number, default: 1 },
  scores: {
    teamA: {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 }, // exact ball count in this over (0 to 5)
      declared: { type: Boolean, default: false }
    },
    teamB: {
      runs: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      overs: { type: Number, default: 0 },
      balls: { type: Number, default: 0 },
      declared: { type: Boolean, default: false }
    }
  },
  target: { type: Number, default: 0 },
  result: { type: String, default: 'Match yet to start' },
  
  // Live batting cards for the current innings
  batsmen: [PlayerPerformanceSchema],
  // Live bowling cards for the current innings
  bowlers: [BowlerPerformanceSchema],
  
  currentStriker: { type: String, default: '' },
  currentNonStriker: { type: String, default: '' },
  currentBowler: { type: String, default: '' },
  
  commentary: [CommentarySchema],
  lastOver: [{ type: String }], // Array of events in current over e.g., ["1", "4", "W", "2wd", "6"]
  
  simulationSpeed: { type: Number, default: 0 }, // 0 = paused, 4000 = run ball every 4s
  simIntervalId: { type: String, default: null } // internal tracking helper
}, { timestamps: true });

const Match = mongoose.model('Match', MatchSchema);
export default Match;
