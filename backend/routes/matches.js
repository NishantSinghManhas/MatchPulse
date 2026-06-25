import express from 'express';
import { dbService } from '../services/dbService.js';
import { startSimulation, stopSimulation, simulateBall } from '../services/matchSimulator.js';
import { cricketApiService } from '../services/cricketApiService.js';

const router = express.Router();

export const syncLiveMatches = async (io) => {
  try {
    const liveMatches = await cricketApiService.getLiveMatches();
    if (!liveMatches || liveMatches.length === 0) return;
    
    const existingMatches = await dbService.getMatches();

    // Clean up any mock/simulated matches so only real live matches are displayed
    for (const match of existingMatches) {
      if (!match.externalId) {
        console.log('Cleaning up old mock match:', match.title);
        await dbService.deleteMatch(match._id);
        if (io) {
          io.emit('matches_list_update', { _id: match._id, deleted: true });
        }
      }
    }
    
    // Refresh list of existing matches after cleanup
    const activeMatches = await dbService.getMatches();
    
    for (const liveMatch of liveMatches) {
      // If the list scraper says it is live, fetch its details to get the actual live scores!
      if (liveMatch.status === 'live') {
        try {
          const details = await cricketApiService.getMatchDetails(liveMatch.externalId);
          if (details) {
            liveMatch.scores = details.scores;
            liveMatch.teams = details.teams;
            liveMatch.status = details.status;
            liveMatch.result = details.result;
            liveMatch.toss = details.toss;
            liveMatch.fow = details.fow;
          }
        } catch (err) {
          console.error(`Error fetching detail in list sync for match ${liveMatch.externalId}:`, err.message);
        }
      }

      const existing = activeMatches.find(m => 
        m.externalId === liveMatch.externalId && 
        m.externalSource === liveMatch.externalSource
      );
      
      if (existing) {
        const updateData = {
          title: liveMatch.title,
          series: liveMatch.series,
          format: liveMatch.format,
          scores: liveMatch.scores,
          status: liveMatch.status,
          result: liveMatch.result,
          toss: liveMatch.toss || existing.toss,
          fow: liveMatch.fow || existing.fow
        };
        
        // Merge team info
        if (liveMatch.teams) {
          updateData.teams = {
            teamA: { ...existing.teams.teamA, name: liveMatch.teams.teamA.name, shortName: liveMatch.teams.teamA.shortName, squad: liveMatch.teams.teamA.squad || existing.teams.teamA.squad },
            teamB: { ...existing.teams.teamB, name: liveMatch.teams.teamB.name, shortName: liveMatch.teams.teamB.shortName, squad: liveMatch.teams.teamB.squad || existing.teams.teamB.squad }
          };
        }
        
        const updated = await dbService.updateMatch(existing._id, updateData);
        if (io && updated) {
          io.emit(`match_update_${existing._id}`, updated);
          io.emit('matches_list_update', updated);
        }
      } else {
        // Create new external match
        const created = await dbService.createMatch(liveMatch);
        if (io && created) {
          io.emit('matches_list_update', created);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing live matches list:', error.message);
  }
};

// Get list of matches
router.get('/', async (req, res) => {
  try {
    // Trigger background sync
    const io = req.app.get('io');
    syncLiveMatches(io).catch(err => console.error('Background sync failed:', err));

    const matches = await dbService.getMatches();
    res.json(matches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Seed mock matches
router.post('/seed', async (req, res) => {
  try {
    const existing = await dbService.getMatches();
    if (existing.length > 0) {
      return res.json({ message: 'Database already has matches. Skipping seeding.' });
    }

    const mockMatches = [
      {
        title: "ICC Men's T20 World Cup - Final",
        series: "ICC Men's T20 World Cup, 2026",
        format: "T20I",
        venue: "Narendra Modi Stadium, Ahmedabad",
        date: new Date().toLocaleDateString(),
        time: "7:30 PM IST",
        status: "live",
        oversLimit: 20,
        teams: {
          teamA: {
            name: "India",
            shortName: "IND",
            squad: ["Rohit Sharma", "Virat Kohli", "Suryakumar Yadav", "Rishabh Pant", "Hardik Pandya", "Ravindra Jadeja", "Axar Patel", "Kuldeep Yadav", "Jasprit Bumrah", "Arshdeep Singh", "Mohammed Siraj"]
          },
          teamB: {
            name: "Australia",
            shortName: "AUS",
            squad: ["Travis Head", "David Warner", "Mitchell Marsh", "Glenn Maxwell", "Marcus Stoinis", "Tim David", "Matthew Wade", "Pat Cummins", "Mitchell Starc", "Josh Hazlewood", "Adam Zampa"]
          }
        },
        toss: {
          winner: "teamA",
          decision: "bat",
          text: "India won the toss and elected to bat first"
        },
        battingFirst: "teamA",
        currentInnings: 1,
        scores: {
          teamA: { runs: 86, wickets: 2, overs: 9, balls: 2, declared: false },
          teamB: { runs: 0, wickets: 0, overs: 0, balls: 0, declared: false }
        },
        partnership: {
          runs: 58,
          balls: 32,
          batsmanA: "Rohit Sharma",
          batsmanB: "Suryakumar Yadav"
        },
        batsmen: [
          { name: "Rohit Sharma", runs: 42, balls: 26, fours: 4, sixes: 2, isOut: false, isStriker: false, isNonStriker: true },
          { name: "Virat Kohli", runs: 12, balls: 14, fours: 1, sixes: 0, isOut: true, howOut: "ct Warner b Starc" },
          { name: "Suryakumar Yadav", runs: 28, balls: 16, fours: 3, sixes: 1, isOut: false, isStriker: true }
        ],
        bowlers: [
          { name: "Mitchell Starc", overs: 2, maidens: 0, runs: 22, wickets: 1, isActive: false },
          { name: "Josh Hazlewood", overs: 2.2, maidens: 0, runs: 18, wickets: 0, isActive: false },
          { name: "Pat Cummins", overs: 2, maidens: 0, runs: 24, wickets: 0, isActive: false },
          { name: "Adam Zampa", overs: 3, maidens: 0, runs: 22, wickets: 1, isActive: true }
        ],
        currentStriker: "Suryakumar Yadav",
        currentNonStriker: "Rohit Sharma",
        currentBowler: "Adam Zampa",
        lastOver: ["1", "4", "W", "0", "6", "1"],
        commentary: [
          { over: 9, ball: 2, bowler: "Adam Zampa", batsman: "Suryakumar Yadav", runs: 1, eventType: "run", text: "Adam Zampa to Suryakumar Yadav, 1 run. Driven past mid-off to keep the strike." },
          { over: 9, ball: 1, bowler: "Adam Zampa", batsman: "Rohit Sharma", runs: 6, eventType: "boundary", text: "Adam Zampa to Rohit Sharma, SIX! Rohit goes big! Swept away over backward square leg for a maximum." },
          { over: 8, ball: 6, bowler: "Pat Cummins", batsman: "Rohit Sharma", runs: 1, eventType: "run", text: "Pat Cummins to Rohit Sharma, 1 run. Guided down to third man for a single." },
          { over: 8, ball: 5, bowler: "Pat Cummins", batsman: "Suryakumar Yadav", runs: 4, eventType: "boundary", text: "Pat Cummins to Suryakumar Yadav, FOUR! Flicked away elegantly off the pads to the boundary." }
        ],
        simulationSpeed: 0
      },
      {
        title: "The Ashes - 1st Test",
        series: "The Ashes, 2026",
        format: "TEST",
        venue: "Lord's, London",
        date: "26 June 2026",
        time: "3:30 PM IST",
        status: "upcoming",
        oversLimit: 90,
        teams: {
          teamA: {
            name: "England",
            shortName: "ENG",
            squad: ["Zak Crawley", "Ben Duckett", "Ollie Pope", "Joe Root", "Harry Brook", "Ben Stokes", "Jamie Smith", "Chris Woakes", "Gus Atkinson", "Mark Wood", "Shoaib Bashir"]
          },
          teamB: {
            name: "Australia",
            shortName: "AUS",
            squad: ["Usman Khawaja", "Steve Smith", "Marnus Labuschagne", "Travis Head", "Mitchell Marsh", "Alex Carey", "Pat Cummins", "Mitchell Starc", "Nathan Lyon", "Josh Hazlewood", "Scott Boland"]
          }
        },
        toss: {
          winner: "",
          decision: "",
          text: "Toss to take place 30 minutes before match start"
        },
        result: "Match starts in 1 hour"
      },
      {
        title: "T20 International Series - Match 3",
        series: "India tour of South Africa, 2026",
        format: "T20I",
        venue: "New Wanderers Stadium, Johannesburg",
        date: "2026-06-20",
        time: "8:00 PM IST",
        status: "completed",
        oversLimit: 20,
        teams: {
          teamA: {
            name: "South Africa",
            shortName: "RSA",
            squad: ["Reeza Hendricks", "Quinton de Kock", "Aiden Markram", "Heinrich Klaasen", "David Miller", "Tristan Stubbs", "Marco Jansen", "Keshav Maharaj", "Kagiso Rabada", "Anrich Nortje", "Gerald Coetzee"]
          },
          teamB: {
            name: "India",
            shortName: "IND",
            squad: ["Sanju Samson", "Abhishek Sharma", "Suryakumar Yadav", "Hardik Pandya", "Rinku Singh", "Jitesh Sharma", "Axar Patel", "Ravi Bishnoi", "Arshdeep Singh", "Avesh Khan", "Varun Chakaravarthy"]
          }
        },
        toss: {
          winner: "teamB",
          decision: "bowl",
          text: "India won the toss and elected to field"
        },
        battingFirst: "teamA",
        currentInnings: 2,
        scores: {
          teamA: { runs: 168, wickets: 8, overs: 20, balls: 0, declared: false },
          teamB: { runs: 172, wickets: 4, overs: 18.4, balls: 4, declared: false }
        },
        result: "India won by 6 wickets"
      }
    ];

    const seeded = [];
    for (const match of mockMatches) {
      const created = await dbService.createMatch(match);
      seeded.push(created);
    }
    
    res.json({ message: 'Database successfully seeded!', matches: seeded });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get individual match
router.get('/:id', async (req, res) => {
  try {
    let match = await dbService.getMatchById(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // On-demand scraper detailed sync for live/upcoming external matches
    // Also sync if completed but no detailed scorecard has been loaded yet (no batsmen details)
    if (match.externalId && (match.status !== 'completed' || !match.batsmen || match.batsmen.length === 0)) {
      try {
        const details = await cricketApiService.getMatchDetails(match.externalId);
        if (details) {
          const updateData = {
            toss: details.toss,
            commentary: details.commentary,
            lastOver: details.lastOver,
            currentStriker: details.currentStriker,
            currentNonStriker: details.currentNonStriker,
            currentBowler: details.currentBowler,
            status: details.status,
            result: details.result,
            fow: details.fow
          };

          if (details.scores) {
            updateData.scores = {
              teamA: {
                runs: details.scores.teamA?.runs || 0,
                wickets: details.scores.teamA?.wickets || 0,
                overs: details.scores.teamA?.overs || 0,
                balls: details.scores.teamA?.balls || 0,
                extras: details.extras?.teamA || 0,
                declared: details.scores.teamA?.declared || false
              },
              teamB: {
                runs: details.scores.teamB?.runs || 0,
                wickets: details.scores.teamB?.wickets || 0,
                overs: details.scores.teamB?.overs || 0,
                balls: details.scores.teamB?.balls || 0,
                extras: details.extras?.teamB || 0,
                declared: details.scores.teamB?.declared || false
              }
            };
          }

          if (details.teams && details.teams.teamA && details.teams.teamA.squad.length > 0) {
            updateData.teams = {
              teamA: { ...match.teams.teamA, name: details.teams.teamA.name, shortName: details.teams.teamA.shortName, squad: details.teams.teamA.squad },
              teamB: { ...match.teams.teamB, name: details.teams.teamB.name, shortName: details.teams.teamB.shortName, squad: details.teams.teamB.squad }
            };
          }

          if (details.batsmen && details.batsmen.length > 0) {
            updateData.batsmen = details.batsmen;
          }
          if (details.bowlers && details.bowlers.length > 0) {
            updateData.bowlers = details.bowlers;
          }

          match = await dbService.updateMatch(match._id, updateData);
          
          const io = req.app.get('io');
          if (io && match) {
            io.emit(`match_update_${match._id}`, match);
            io.emit('matches_list_update', match);
          }
        }
      } catch (err) {
        console.error(`Failed to sync details for match ${match.externalId}:`, err.message);
      }
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new custom match
router.post('/', async (req, res) => {
  try {
    const newMatch = await dbService.createMatch(req.body);
    // Trigger socket broadcast for list update
    if (req.app.get('io')) {
      req.app.get('io').emit('matches_list_update', newMatch);
    }
    res.status(201).json(newMatch);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toggle simulation
router.post('/:id/simulate', async (req, res) => {
  const { id } = req.params;
  const { action, speed } = req.body; // action: 'start' or 'stop', speed in ms (default 5000)

  try {
    const match = await dbService.getMatchById(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (action === 'start') {
      if (match.status === 'upcoming') {
        // Change status to live, set toss if not set
        match.status = 'live';
        if (!match.toss.winner) {
          match.toss.winner = 'teamA';
          match.toss.decision = 'bat';
          match.toss.text = `${match.teams.teamA.name} won the toss & elected to bat`;
          match.battingFirst = 'teamA';
        }
      }

      const simSpeed = speed || 4000;
      const updated = await dbService.updateMatch(id, { 
        status: match.status,
        toss: match.toss,
        battingFirst: match.battingFirst,
        simulationSpeed: simSpeed 
      });

      // Start the runner
      const io = req.app.get('io');
      startSimulation(id, io, simSpeed);
      
      if (io) {
        io.emit(`match_update_${id}`, updated);
        io.emit('matches_list_update', updated);
      }
      res.json({ message: 'Simulation started', match: updated });
    } else {
      // Stop the runner
      stopSimulation(id);
      const updated = await dbService.updateMatch(id, { simulationSpeed: 0 });
      
      const io = req.app.get('io');
      if (io) {
        io.emit(`match_update_${id}`, updated);
        io.emit('matches_list_update', updated);
      }
      res.json({ message: 'Simulation stopped', match: updated });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger a manual event for debugging and admin override
router.post('/:id/event', async (req, res) => {
  const { id } = req.params;
  const { eventType, runs } = req.body; // eventType: 'run'|'boundary'|'wicket'|'wide'|'noball', runs: number

  try {
    const match = await dbService.getMatchById(id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'live') {
      return res.status(400).json({ error: 'Cannot trigger event on non-live matches' });
    }

    const io = req.app.get('io');
    const updated = await simulateBall(match, io, { eventType, runs });
    
    res.json({ message: 'Event successfully triggered', match: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete match
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    stopSimulation(id);
    await dbService.deleteMatch(id);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('matches_list_update', { _id: id, deleted: true });
    }
    
    res.json({ success: true, message: 'Match deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
