import { dbService } from './dbService.js';

const activeSimulations = new Map();

// Generate a random commentary text based on runs and wicket events
const getCommentaryText = (batsman, bowler, runs, eventType, detail = '') => {
  const templates = {
    dot: [
      `Good length ball, defended back to the bowler.`,
      `Short of a length outside off, left alone by the batsman.`,
      `Beaten! Beautiful shape away, ${batsman} pokes at it and misses.`,
      `Quick delivery on the pads, tucked away to square leg, no run.`,
      `Fuller length, driven straight to mid-off. No run.`
    ],
    single: [
      `Tucked away to deep mid-wicket for a single.`,
      `Guided down to third man to rotate the strike.`,
      `Full toss on the pads, flicked to deep square leg for a run.`,
      `Pushed gently into the cover gap, quick single taken.`,
      `Edged! Soft hands, rolls down to fine leg, just one.`
    ],
    double: [
      `Driven beautifully past extra cover, the fielders chase and they get two.`,
      `Flicked off the pads behind square, excellent running for a couple.`,
      `Short ball pulled away to deep mid-wicket, they run hard and complete the double.`,
      `Pushed into the gap at long-on, comfortable two runs.`
    ],
    triple: [
      `Superb timing! Pierces the covers, fielders pull it back just inside the boundary. Three runs.`,
      `Straight drive, slow outfield. The fielders hunt it down, they take three runs.`
    ],
    four: [
      `FOUR! Glorious cover drive! Out of the middle of the bat and races away.`,
      `FOUR! Pitched up, ${batsman} lofts it straight back over the bowler's head!`,
      `FOUR! Short and punished! Pulled away behind square leg for a boundary.`,
      `FOUR! Edged but safe! Flies past the diving slip fielder and runs to the fence.`,
      `FOUR! Delicate touch! Late cut past short third man. Brilliant execution.`
    ],
    six: [
      `SIX! Monstruous hit! Right in the slot and sent high into the stands!`,
      `SIX! Clean as a whistle. ${batsman} dances down the track and lofts it over long-on!`,
      `SIX! Hooked away! Short ball, ${batsman} gets on top of it and clears the square leg fence!`,
      `SIX! Spectacular! Inside out drive over extra cover, sails all the way!`
    ],
    wicket: [
      `OUT! BOWLED HIM! The off-stump is knocked out of the ground! Beautiful delivery by ${bowler}.`,
      `OUT! CAUGHT! Lofts it high towards long-off, the fielder settles under it and takes a comfortable catch.`,
      `OUT! LBW! Plumb! Yorker length on the middle stump, ${batsman} misses and the umpire's finger goes straight up.`,
      `OUT! CAUGHT BEHIND! Edged and taken! Faint edge as ${batsman} tried to cut, keeper makes no mistake.`,
      `OUT! RUN OUT! Incredible direct hit from cover! ${batsman} is short of his crease.`
    ],
    wide: [
      `Wide ball! Sprayed down the leg side. Extra run to the batting team.`,
      `Wide ball! Too wide outside off, past the tramline. Must bowl again.`
    ],
    noball: [
      `No ball! Overstepped by ${bowler}. Extra run and a Free Hit coming up!`,
      `No ball! High full toss above waist height. Penalty run and Free Hit.`
    ]
  };

  if (eventType === 'wicket') {
    const list = templates.wicket;
    return detail || list[Math.floor(Math.random() * list.length)];
  }
  if (eventType === 'wide' || eventType === 'noball') {
    const list = templates[eventType];
    return list[Math.floor(Math.random() * list.length)];
  }
  
  const scoreMap = { 0: 'dot', 1: 'single', 2: 'double', 3: 'triple', 4: 'four', 6: 'six' };
  const type = scoreMap[runs] || 'dot';
  const list = templates[type];
  const prefix = `${bowler} to ${batsman}, `;
  const baseCommentary = list[Math.floor(Math.random() * list.length)];
  
  return prefix + baseCommentary;
};

// Main simulation step
export const simulateBall = async (match, io, manualEvent = null) => {
  // Determine batting and bowling team
  const batTeamKey = match.currentInnings === 1 
    ? match.battingFirst 
    : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA');
    
  const bowlTeamKey = batTeamKey === 'teamA' ? 'teamB' : 'teamA';
  
  const battingTeam = match.teams[batTeamKey];
  const bowlingTeam = match.teams[bowlTeamKey];
  
  // Make sure players exist in arrays, if not, initialize them
  if (match.batsmen.length === 0) {
    // Initialize opening batsmen
    if (!battingTeam.squad || battingTeam.squad.length < 2) {
      battingTeam.squad = Array.from({ length: 11 }, (_, i) => `${battingTeam.shortName} Player ${i + 1}`);
    }
    match.batsmen = [
      { name: battingTeam.squad[0], runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isStriker: true },
      { name: battingTeam.squad[1], runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false, isNonStriker: true }
    ];
    match.currentStriker = battingTeam.squad[0];
    match.currentNonStriker = battingTeam.squad[1];
  }
  
  if (match.bowlers.length === 0 || !match.currentBowler) {
    // Initialize first bowler
    if (!bowlingTeam.squad || bowlingTeam.squad.length === 0) {
      bowlingTeam.squad = Array.from({ length: 11 }, (_, i) => `${bowlingTeam.shortName} Player ${i + 1}`);
    }
    // Pick from bowler squad (often near end of lineup, index 10)
    const bowlerName = bowlingTeam.squad[10] || bowlingTeam.squad[0];
    match.bowlers = [
      { name: bowlerName, overs: 0, maidens: 0, runs: 0, wickets: 0, isActive: true }
    ];
    match.currentBowler = bowlerName;
  }
  
  let striker = match.batsmen.find(b => b.name === match.currentStriker && !b.isOut);
  let nonStriker = match.batsmen.find(b => b.name === match.currentNonStriker && !b.isOut);
  
  // Fallback if striker is out or not found
  if (!striker) {
    striker = match.batsmen.find(b => !b.isOut);
    if (striker) {
      striker.isStriker = true;
      match.currentStriker = striker.name;
    }
  }
  if (!nonStriker && striker) {
    nonStriker = match.batsmen.find(b => b.name !== striker.name && !b.isOut);
    if (nonStriker) {
      nonStriker.isNonStriker = true;
      match.currentNonStriker = nonStriker.name;
    }
  }

  let bowler = match.bowlers.find(b => b.name === match.currentBowler);
  if (!bowler) {
    bowler = { name: match.currentBowler, overs: 0, maidens: 0, runs: 0, wickets: 0, isActive: true };
    match.bowlers.push(bowler);
  }

  // Initialize and update partnership state
  if (!match.partnership) {
    match.partnership = { runs: 0, balls: 0, batsmanA: '', batsmanB: '' };
  }
  match.partnership.batsmanA = striker.name;
  match.partnership.batsmanB = nonStriker ? nonStriker.name : '';

  // Determine outcome
  let eventType = 'run';
  let runsScored = 0;
  let isExtra = false;
  let isWicket = false;
  let extraType = ''; // 'wd', 'nb'

  if (manualEvent) {
    eventType = manualEvent.eventType;
    runsScored = manualEvent.runs || 0;
    isExtra = eventType === 'wide' || eventType === 'noball';
    isWicket = eventType === 'wicket';
    if (eventType === 'wide') extraType = 'wd';
    if (eventType === 'noball') extraType = 'nb';
  } else {
    // Random outcome simulator
    // 0: dot (35%), 1: single (38%), 2: double (8%), 3: triple (1%), 4: four (10%), 6: six (4%), wicket: wicket (3%), wide/noball: extra (1%)
    const rand = Math.random() * 100;
    if (rand < 35) {
      eventType = 'dot';
      runsScored = 0;
    } else if (rand < 73) {
      eventType = 'run';
      runsScored = 1;
    } else if (rand < 81) {
      eventType = 'run';
      runsScored = 2;
    } else if (rand < 82) {
      eventType = 'run';
      runsScored = 3;
    } else if (rand < 92) {
      eventType = 'boundary';
      runsScored = 4;
    } else if (rand < 96) {
      eventType = 'boundary';
      runsScored = 6;
    } else if (rand < 99) {
      eventType = 'wicket';
      isWicket = true;
    } else {
      isExtra = true;
      const extraRand = Math.random();
      if (extraRand < 0.7) {
        eventType = 'wide';
        extraType = 'wd';
        runsScored = 1; // Wide counts as 1 extra run
      } else {
        eventType = 'noball';
        extraType = 'nb';
        runsScored = 1; // No ball counts as 1 extra run + batter gets free hit
      }
    }
  }

  // Process Event
  const scoreRef = match.scores[batTeamKey];
  
  if (isExtra) {
    scoreRef.runs += runsScored;
    scoreRef.extras = (scoreRef.extras || 0) + runsScored;
    // extras runs are added to bowler as well
    bowler.runs += runsScored;
    
    // Add to partnership
    if (match.partnership) {
      match.partnership.runs += runsScored;
    }
    
    // Add to last over tracker
    const extraLabel = runsScored > 1 ? `${runsScored}${extraType}` : extraType;
    match.lastOver.push(extraLabel);
    
    // Create commentary
    const text = getCommentaryText(striker.name, bowler.name, runsScored, eventType);
    match.commentary.unshift({
      over: scoreRef.overs,
      ball: scoreRef.balls + 1,
      bowler: bowler.name,
      batsman: striker.name,
      runs: runsScored,
      eventType: eventType,
      text: text
    });
  } else if (isWicket) {
    scoreRef.wickets += 1;
    bowler.wickets += 1;
    
    // Update bowler balls bowled (since legal ball)
    scoreRef.balls += 1;
    
    // Add to partnership
    if (match.partnership) {
      match.partnership.balls += 1; // legal ball
      match.partnership.runs = 0;
      match.partnership.balls = 0;
    }
    
    // Batsman is out
    striker.balls += 1;
    striker.isOut = true;
    striker.isStriker = false;
    
    const howOutOptions = [
      `b ${bowler.name}`,
      `ct & b ${bowler.name}`,
      `lbw b ${bowler.name}`,
      `ct ${bowlingTeam.squad[Math.floor(Math.random() * 8)] || 'Fielder'} b ${bowler.name}`
    ];
    striker.howOut = howOutOptions[Math.floor(Math.random() * howOutOptions.length)];
    
    // Add to Fall of Wickets
    const fowString = `${scoreRef.runs}-${scoreRef.wickets} (${striker.name}, ${scoreRef.overs}.${scoreRef.balls} ov)`;
    if (!match.fow) {
      match.fow = { teamA: [], teamB: [] };
    }
    const fowKey = batTeamKey === 'teamA' ? 'teamA' : 'teamB';
    if (!match.fow[fowKey]) match.fow[fowKey] = [];
    match.fow[fowKey].push(fowString);

    match.lastOver.push('W');
    
    const text = getCommentaryText(striker.name, bowler.name, 0, 'wicket', `${bowler.name} strikes! ${striker.name} ${striker.howOut}. Big wicket!`);
    match.commentary.unshift({
      over: scoreRef.overs,
      ball: scoreRef.balls,
      bowler: bowler.name,
      batsman: striker.name,
      runs: 0,
      eventType: 'wicket',
      text: text
    });

    // Check if team is all out (10 wickets)
    const isAllOut = scoreRef.wickets >= 10;
    
    if (!isAllOut) {
      // Bring next batsman from squad
      const currentBattedCount = match.batsmen.length;
      if (currentBattedCount < battingTeam.squad.length) {
        const nextBatName = battingTeam.squad[currentBattedCount];
        const newBatter = {
          name: nextBatName,
          runs: 0,
          balls: 0,
          fours: 0,
          sixes: 0,
          isOut: false,
          isStriker: true
        };
        match.batsmen.push(newBatter);
        match.currentStriker = nextBatName;
        striker = newBatter;
      }
    }
  } else {
    // Normal run or boundary
    scoreRef.runs += runsScored;
    scoreRef.balls += 1;
    
    // Add to partnership
    if (match.partnership) {
      match.partnership.runs += runsScored;
      match.partnership.balls += 1;
    }
    
    // Update batsman performance
    striker.runs += runsScored;
    striker.balls += 1;
    if (runsScored === 4) striker.fours += 1;
    if (runsScored === 6) striker.sixes += 1;
    
    // Update bowler performance
    bowler.runs += runsScored;
    
    match.lastOver.push(String(runsScored));
    
    const text = getCommentaryText(striker.name, bowler.name, runsScored, eventType);
    match.commentary.unshift({
      over: scoreRef.overs,
      ball: scoreRef.balls,
      bowler: bowler.name,
      batsman: striker.name,
      runs: runsScored,
      eventType: runsScored === 4 || runsScored === 6 ? 'boundary' : (runsScored === 0 ? 'dot' : 'run'),
      text: text
    });

    // Rotate strike on odd runs (1 or 3)
    if (runsScored === 1 || runsScored === 3) {
      // Swap striker & non-striker
      if (nonStriker) {
        striker.isStriker = false;
        striker.isNonStriker = true;
        nonStriker.isStriker = true;
        nonStriker.isNonStriker = false;
        
        const temp = match.currentStriker;
        match.currentStriker = match.currentNonStriker;
        match.currentNonStriker = temp;
        
        // Update local variables references
        const tempBatter = striker;
        striker = nonStriker;
        nonStriker = tempBatter;
      }
    }
  }

  // Check Over Completion
  if (scoreRef.balls >= 6) {
    // Complete the over
    scoreRef.overs += 1;
    scoreRef.balls = 0;
    
    // Update bowler overs count
    // Safe float summation helper
    const fullOvers = Math.floor(bowler.overs);
    const partialBalls = Math.round((bowler.overs - fullOvers) * 10);
    let newBalls = partialBalls + 1;
    if (newBalls >= 6) {
      bowler.overs = fullOvers + 1;
    } else {
      bowler.overs = fullOvers + (newBalls / 10);
    }
    
    // Rotate strike at the end of the over
    if (nonStriker) {
      striker.isStriker = false;
      striker.isNonStriker = true;
      nonStriker.isStriker = true;
      nonStriker.isNonStriker = false;
      
      const temp = match.currentStriker;
      match.currentStriker = match.currentNonStriker;
      match.currentNonStriker = temp;
      
      const tempBatter = striker;
      striker = nonStriker;
      nonStriker = tempBatter;
    }
    
    // Select new bowler (must not be the active bowler, select another from squad)
    const activeBowlerName = bowler.name;
    bowler.isActive = false;
    
    // Pick bowler from index 6 to 10 of bowling squad, distinct from current bowler
    const bowlerSquadNames = bowlingTeam.squad.slice(5); // Typical bowlers
    let newBowlerName = bowlerSquadNames.find(name => name !== activeBowlerName) || bowlingTeam.squad[5];
    
    // Add new bowler to match bowling list if not already there, and set active
    let nextBowler = match.bowlers.find(b => b.name === newBowlerName);
    if (!nextBowler) {
      nextBowler = { name: newBowlerName, overs: 0, maidens: 0, runs: 0, wickets: 0, isActive: true };
      match.bowlers.push(nextBowler);
    } else {
      nextBowler.isActive = true;
    }
    match.currentBowler = newBowlerName;
    
    // Add end of over commentary info
    match.commentary.unshift({
      over: scoreRef.overs,
      ball: 0,
      text: `End of Over ${scoreRef.overs}. ${battingTeam.shortName}: ${scoreRef.runs}/${scoreRef.wickets}. Bowler: ${activeBowlerName}.`,
      eventType: 'info'
    });
    
    // Clear last over tracker for next over
    match.lastOver = [];
  } else {
    // If not over completion, still update bowler partial overs
    if (!isExtra) {
      const fullOvers = Math.floor(bowler.overs);
      const partialBalls = Math.round((bowler.overs - fullOvers) * 10);
      let newBalls = partialBalls + 1;
      if (newBalls >= 6) {
        bowler.overs = fullOvers + 1;
      } else {
        bowler.overs = Number((fullOvers + (newBalls / 10)).toFixed(1));
      }
    }
  }

  // Calculate Economy Rate for active bowlers
  match.bowlers.forEach(b => {
    const oversF = Math.floor(b.overs);
    const ballsF = Math.round((b.overs - oversF) * 10);
    const totalBalls = (oversF * 6) + ballsF;
    if (totalBalls > 0) {
      b.economy = Number(((b.runs / totalBalls) * 6).toFixed(2));
    } else {
      b.economy = 0.0;
    }
  });

  // CHECK INNINGS / MATCH OVER CONDITIONS
  const scoreRuns = scoreRef.runs;
  const scoreWickets = scoreRef.wickets;
  const currentOversFloat = scoreRef.overs + (scoreRef.balls / 10);
  
  let endInnings = false;
  let endMatch = false;

  // Check if team is all out or overs reached
  if (scoreWickets >= 10 || currentOversFloat >= match.oversLimit) {
    endInnings = true;
  }

  if (match.currentInnings === 1) {
    if (endInnings) {
      // Transition to Innings 2
      match.currentInnings = 2;
      match.target = scoreRuns + 1;
      match.result = `${bowlingTeam.name} need ${match.target} runs in ${match.oversLimit} overs to win.`;
      
      // Swap batting team for next innings
      // Clear live striker, batsman list, bowler list, for innings 2
      match.batsmen = [];
      match.bowlers = [];
      match.currentStriker = '';
      match.currentNonStriker = '';
      match.currentBowler = '';
      match.lastOver = [];
      
      match.commentary.unshift({
        over: currentOversFloat,
        ball: 0,
        text: `Innings break. ${battingTeam.name} finish on ${scoreRuns}/${scoreWickets} in ${currentOversFloat} overs. Target: ${match.target} runs.`,
        eventType: 'info'
      });
    } else {
      match.result = `${battingTeam.shortName} chose to bat. Current Innings: 1.`;
    }
  } else {
    // Innings 2 (run chase)
    const target = match.target;
    const battingFirstKey = match.battingFirst;
    const batFirstTeam = match.teams[battingFirstKey];
    
    // Batting second score details
    if (scoreRuns >= target) {
      // Batting second chased it down, Wins!
      endMatch = true;
      match.result = `${battingTeam.name} won by ${10 - scoreWickets} wickets!`;
    } else if (endInnings) {
      // Batting second finished innings but short of target
      endMatch = true;
      if (scoreRuns < target - 1) {
        match.result = `${batFirstTeam.name} won by ${target - 1 - scoreRuns} runs!`;
      } else {
        match.result = `Match Tied!`;
      }
    } else {
      // Live progress chase commentary
      const runsNeeded = target - scoreRuns;
      const ballsRemaining = (match.oversLimit * 6) - ((scoreRef.overs * 6) + scoreRef.balls);
      match.result = `${battingTeam.name} need ${runsNeeded} runs in ${ballsRemaining} balls.`;
    }

    if (endMatch) {
      match.status = 'completed';
      match.simulationSpeed = 0;
      
      match.commentary.unshift({
        over: currentOversFloat,
        ball: 0,
        text: `Match Ended. ${match.result}`,
        eventType: 'info'
      });
      
      // Kill the timer in local registry
      stopSimulation(match._id);
    }
  }

  // Save the updated match state
  const updatedMatch = await dbService.updateMatch(match._id, {
    scores: match.scores,
    currentInnings: match.currentInnings,
    target: match.target,
    result: match.result,
    status: match.status,
    batsmen: match.batsmen,
    bowlers: match.bowlers,
    currentStriker: match.currentStriker,
    currentNonStriker: match.currentNonStriker,
    currentBowler: match.currentBowler,
    commentary: match.commentary,
    lastOver: match.lastOver,
    simulationSpeed: match.simulationSpeed
  });

  // Broadcast to all sockets listening to this match
  if (io) {
    io.emit(`match_update_${match._id}`, updatedMatch);
    io.emit(`matches_list_update`, updatedMatch); // broadcast for the home dashboard
  }

  return updatedMatch;
};

// Start simulation loop
export const startSimulation = (matchId, io, speed = 5000) => {
  if (activeSimulations.has(String(matchId))) {
    // Already running, update speed if needed
    clearInterval(activeSimulations.get(String(matchId)));
  }

  const intervalId = setInterval(async () => {
    try {
      const match = await dbService.getMatchById(matchId);
      if (!match || match.status !== 'live') {
        stopSimulation(matchId);
        return;
      }
      await simulateBall(match, io);
    } catch (error) {
      console.error(`Error in simulation step for match ${matchId}:`, error);
    }
  }, speed);

  activeSimulations.set(String(matchId), intervalId);
  console.log(`Started live simulation for Match: ${matchId} at speed ${speed}ms`);
};

// Stop simulation
export const stopSimulation = (matchId) => {
  const idStr = String(matchId);
  if (activeSimulations.has(idStr)) {
    clearInterval(activeSimulations.get(idStr));
    activeSimulations.delete(idStr);
    console.log(`Stopped simulation for Match: ${matchId}`);
  }
};
