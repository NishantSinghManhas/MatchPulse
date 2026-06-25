import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Award, MapPin, Calendar, Users, Radio, Cpu, 
  RefreshCw, AlertCircle, Volume2, VolumeX, TrendingUp, Sparkles,
  ArrowLeft
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth';

const MatchDetail = ({ matchId, socket, onBack }) => {
  const [match, setMatch] = useState(null);
  const [activeTab, setActiveTab] = useState('commentary');
  const [simSpeed, setSimSpeed] = useState(3000);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio state
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Celebration state
  const [celebration, setCelebration] = useState(null); // { type: 'six'|'four'|'wicket', text: 'SIX!' }

  const prevCommentaryRef = useRef('');

  // Fetch match details on load
  const fetchMatchDetails = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/matches/${matchId}`);
      if (response.ok) {
        const data = await response.json();
        setMatch(data);
        if (data.commentary && data.commentary.length > 0) {
          prevCommentaryRef.current = data.commentary[0].text;
        }
      }
    } catch (error) {
      console.error('Error fetching match details:', error);
    }
  };

  useEffect(() => {
    fetchMatchDetails();

    // Listen to real-time updates for this match via socket.io
    if (socket) {
      socket.emit('join_match', matchId);

      socket.on(`match_update_${matchId}`, (updatedMatch) => {
        setMatch(updatedMatch);

        // Check if a new ball was bowled
        if (updatedMatch.commentary && updatedMatch.commentary.length > 0) {
          const latestComm = updatedMatch.commentary[0];
          
          if (latestComm.text !== prevCommentaryRef.current && latestComm.eventType !== 'info') {
            prevCommentaryRef.current = latestComm.text;
            
            // Trigger sound effects
            if (soundEnabled) {
              if (latestComm.eventType === 'wicket') {
                soundSynth.playWicket();
              } else if (latestComm.eventType === 'boundary') {
                soundSynth.playBoundary();
              } else if (latestComm.runs > 0) {
                soundSynth.playRun();
              } else {
                soundSynth.playDot();
              }
            }

            // Trigger visual boundary celebrations
            if (latestComm.eventType === 'wicket') {
              setCelebration({ type: 'wicket', text: 'OUT!' });
              setTimeout(() => setCelebration(null), 1800);
            } else if (latestComm.eventType === 'boundary') {
              setCelebration({ 
                type: latestComm.runs === 6 ? 'six' : 'four', 
                text: latestComm.runs === 6 ? 'SIX!' : 'FOUR!' 
              });
              setTimeout(() => setCelebration(null), 1800);
            }
          }
        }
      });

      return () => {
        socket.emit('leave_match', matchId);
        socket.off(`match_update_${matchId}`);
      };
    }
  }, [matchId, socket, soundEnabled]);

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Sync sound utility state
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundSynth.toggle(newState);
  };

  // Deterministic Player Profile Generator based on name string hash
  const generatePlayerProfile = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const roles = ['Top-order Batsman', 'Middle-order Batsman', 'Allrounder', 'Fast Bowler', 'Spin Bowler', 'Wicketkeeper Batsman'];
    const role = roles[hash % roles.length];
    
    const batStyles = ['Right-hand bat', 'Left-hand bat'];
    const batStyle = batStyles[hash % batStyles.length];
    
    const bowlStyles = ['Right-arm fast-medium', 'Right-arm offbreak', 'Left-arm orthodox spin', 'Left-arm fast', 'No bowling style'];
    let bowlStyle = bowlStyles[hash % bowlStyles.length];
    if (role.includes('Batsman') && hash % 3 !== 0) bowlStyle = 'Right-arm offbreak (occasional)';

    const matches = (hash % 150) + 15;
    const runs = role.includes('Batsman') || role.includes('Allrounder') 
      ? (hash % 6000) + 500 
      : (hash % 800) + 50;
    const batAvg = runs > 100 ? (runs / matches).toFixed(2) : '12.40';
    const strikeRate = (85 + (hash % 60) + (role.includes('Batsman') ? 15 : 0)).toFixed(1);

    const wickets = role.includes('Bowler') || role.includes('Allrounder')
      ? (hash % 280) + 10
      : (hash % 10);
    const bowlEcon = (wickets > 0 ? (3.5 + (hash % 45) / 10) : 0).toFixed(2);
    const bestBowling = wickets > 0 
      ? `${(hash % 5) + 2}/${(hash % 30) + 5}`
      : '1/12';

    const countries = ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'West Indies', 'Sri Lanka', 'Bangladesh', 'Afghanistan'];
    const country = countries[hash % countries.length];
    const age = 20 + (hash % 18);
    const hundreds = role.includes('Batsman') || role.includes('Allrounder') ? (hash % 15) : (hash % 2 === 0 ? 1 : 0);
    const fifties = role.includes('Batsman') || role.includes('Allrounder') ? (hash % 35) + 2 : (hash % 5);

    return {
      name,
      role,
      batStyle,
      bowlStyle,
      country,
      age,
      hundreds,
      fifties,
      stats: { matches, runs, batAvg, strikeRate, wickets, bowlEcon, bestBowling }
    };
  };

  const handlePlayerClick = (name) => {
    // Strip trailing stars, status text or symbols
    const cleanedName = name.replace(/\*$/, '').replace(/\(c\)|\(wk\)|\(c\/wk\)|\(sub\)/gi, '').trim();
    if (!cleanedName) return;
    setSelectedPlayer(generatePlayerProfile(cleanedName));
  };

  // Deterministic H2H / Fantasy Generator
  const getPremiumInsights = () => {
    let hash = 0;
    const title = match.title || "";
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);

    const totalMatches = (hash % 15) + 12;
    const teamAWins = Math.floor((hash % 7) / 10 * totalMatches) + Math.floor(totalMatches / 3);
    const teamBWins = totalMatches - teamAWins - (hash % 2 === 0 ? 1 : 0);
    const noResult = totalMatches - teamAWins - teamBWins;

    // Fantasy Picks
    const squadPlayers = [
      ...(match.batsmen || []).map(b => b.name),
      ...(match.bowlers || []).map(b => b.name)
    ].filter(Boolean);

    const fallbackPlayersA = ["Virat Kohli", "Jasprit Bumrah", "Rohit Sharma", "Rishabh Pant", "Hardik Pandya"];
    const fallbackPlayersB = ["Travis Head", "Pat Cummins", "Mitchell Starc", "Glenn Maxwell", "Adam Zampa"];
    const pool = squadPlayers.length > 4 ? squadPlayers : [...fallbackPlayersA, ...fallbackPlayersB];

    const topPicks = [
      pool[hash % pool.length],
      pool[(hash + 3) % pool.length],
      pool[(hash + 7) % pool.length]
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);

    if (topPicks.length < 3) {
      topPicks.push(pool[1] || "Virat Kohli");
    }
    if (topPicks.length < 3) {
      topPicks.push(pool[2] || "Travis Head");
    }
    
    const captain = pool[(hash + 2) % pool.length] || "Jasprit Bumrah";
    let viceCaptain = pool[(hash + 5) % pool.length] || "Pat Cummins";
    if (viceCaptain === captain) {
      viceCaptain = pool[(hash + 6) % pool.length] || "Pat Cummins";
    }

    return {
      totalMatches,
      teamAWins,
      teamBWins,
      noResult,
      topPicks: topPicks.slice(0, 3),
      captain,
      viceCaptain
    };
  };

  if (!match) {
    return (
      <div className="pulse-card" style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Loading match details...</p>
      </div>
    );
  }

  const isLive = match.status === 'live';
  const batTeamKey = match.currentInnings === 1 
    ? match.battingFirst 
    : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA');
  const bowlTeamKey = batTeamKey === 'teamA' ? 'teamB' : 'teamA';
  const battingTeam = match.teams[batTeamKey];
  const bowlingTeam = match.teams[bowlTeamKey];

  const currentScore = match.scores[batTeamKey] || { runs: 0, wickets: 0, overs: 0, balls: 0 };
  const opponentScore = match.scores[bowlTeamKey] || { runs: 0, wickets: 0, overs: 0, balls: 0 };

  const handleToggleSimulation = async (action) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/matches/${matchId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, speed: simSpeed })
      });
      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error('Error triggering simulation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualEvent = async (eventType, runs = 0) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/api/matches/${matchId}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, runs })
      });
      if (res.ok) {
        const data = await res.json();
        setMatch(data.match);
      }
    } catch (error) {
      console.error('Error triggering manual event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getLiveScoreDisplay = (teamKey) => {
    const score = match.scores[teamKey];
    if (!score) return '0/0 (0 ov)';
    if (match.status === 'upcoming' && score.runs === 0 && score.wickets === 0) {
      return '-';
    }
    return `${score.runs}/${score.wickets} (${score.overs}.${score.balls || 0} ov)`;
  };

  // Run rates
  const getRunRate = (runs, overs, balls) => {
    const totalOvers = overs + (balls / 6);
    if (totalOvers <= 0) return '0.00';
    return (runs / totalOvers).toFixed(2);
  };
  const currentRR = getRunRate(currentScore.runs, currentScore.overs, currentScore.balls);

  const getRequiredRR = () => {
    if (match.currentInnings !== 2 || !match.target) return null;
    const runsNeeded = match.target - currentScore.runs;
    const ballsRemaining = (match.oversLimit * 6) - ((currentScore.overs * 6) + currentScore.balls);
    if (ballsRemaining <= 0) return runsNeeded <= 0 ? '0.00' : '∞';
    return ((runsNeeded / ballsRemaining) * 6).toFixed(2);
  };
  const requiredRR = getRequiredRR();

  // AI Win Probability Calculation
  const calculateWinProbability = () => {
    if (match.status === 'completed') {
      return match.result.includes(battingTeam?.name) ? { bat: 100, bowl: 0 } : { bat: 0, bowl: 100 };
    }
    if (match.status === 'upcoming') {
      return { bat: 50, bowl: 50 };
    }
    
    // Innings 1
    if (match.currentInnings === 1) {
      const runs = currentScore.runs;
      const wickets = currentScore.wickets;
      const oversVal = currentScore.overs + (currentScore.balls / 6);
      
      let base = 52;
      // Add weight for score rate
      const crr = oversVal > 0 ? (runs / oversVal) : 7;
      base += (crr - 7.5) * 5;
      // Subtract weight for wickets
      base -= wickets * 4.5;
      
      const probability = Math.min(Math.max(Math.round(base), 10), 90);
      return { bat: probability, bowl: 100 - probability };
    } else {
      // Innings 2
      const runs = currentScore.runs;
      const wickets = currentScore.wickets;
      const target = match.target;
      const remainingBalls = (match.oversLimit * 6) - ((currentScore.overs * 6) + currentScore.balls);
      const runsNeeded = target - runs;
      
      if (runsNeeded <= 0) return { bat: 100, bowl: 0 };
      if (remainingBalls <= 0) return { bat: 0, bowl: 100 };

      let base = 50;
      const reqRR = (runsNeeded / remainingBalls) * 6;
      
      // Compare current rate and required rate
      base += (parseFloat(currentRR) - reqRR) * 12;
      // Wickets lost penalty
      base -= wickets * 7.5;
      
      const probability = Math.min(Math.max(Math.round(base), 5), 95);
      return { bat: probability, bowl: 100 - probability };
    }
  };
  
  const winProb = calculateWinProbability();

  // Project Score
  const getProjectedScore = () => {
    if (match.status !== 'live' || match.currentInnings !== 1) return null;
    const crr = parseFloat(currentRR) || 7.0;
    const remainingOvers = match.oversLimit - (currentScore.overs + (currentScore.balls / 6));
    const projected = Math.round(currentScore.runs + (crr * remainingOvers));
    return {
      currentRate: projected,
      highRate: Math.round(currentScore.runs + ((crr + 1.5) * remainingOvers)),
      lowRate: Math.round(currentScore.runs + (Math.max(crr - 1.5, 4) * remainingOvers))
    };
  };
  const projectedScore = getProjectedScore();

  // Wagon Wheel Line Coordinates Generator
  const getStrokeCoordinates = (runs, index) => {
    // stadium centers: cx=160, cy=160. Radius=150
    const cx = 160;
    const cy = 160;
    const radius = 140;
    
    // Pick deterministic angles depending on runs/hits
    const sectors = {
      4: [25, 75, 135, 205, 295], // off side / straight / pulls
      6: [85, 115, 195, 235],     // straight / midwicket / leg side
    };
    
    let angleDeg = (index * 73) % 360; // default dots/singles
    if (runs === 4) {
      const list = sectors[4];
      angleDeg = list[index % list.length] + ((index * 13) % 20) - 10;
    } else if (runs === 6) {
      const list = sectors[6];
      angleDeg = list[index % list.length] + ((index * 13) % 20) - 10;
    }
    
    const angleRad = (angleDeg * Math.PI) / 180;
    
    // Scale distance based on runs
    let strokeLength = radius * 0.4; // dots
    if (runs === 1) strokeLength = radius * 0.6;
    if (runs === 2) strokeLength = radius * 0.75;
    if (runs === 3) strokeLength = radius * 0.85;
    if (runs === 4 || runs === 6) strokeLength = radius; // border touch
    
    const x2 = cx + strokeLength * Math.cos(angleRad);
    const y2 = cy - strokeLength * Math.sin(angleRad); // negative y because svg coordinates start top-left
    
    return { x1: cx, y1: cy, x2, y2 };
  };

  return (
    <div className="view-section" style={{ position: 'relative' }}>
      {/* Dynamic Celebration Overlay */}
      {celebration && (
        <div className="celebration-overlay">
          <div className={`celebration-banner celebration-${celebration.type}`}>
            {celebration.text}
          </div>
        </div>
      )}

      {/* 1. Header Scorecard Display */}
      <div className={`detail-main-header ${isLive ? 'live-glow' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button 
              onClick={onBack || (() => window.history.back())}
              className="btn flex-row back-btn"
              style={{ 
                padding: '0.35rem 0.65rem', 
                fontSize: '0.75rem', 
                borderColor: 'var(--border-subtle)', 
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                borderRadius: '8px'
              }}
              title="Go back to matches list"
            >
              <ArrowLeft size={12} />
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {match.title} • {match.series}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {match.format && (
              <span className="badge badge-format" style={{ fontSize: '0.7rem' }}>{match.format}</span>
            )}
            {/* Audio Synth Toggle */}
            <button 
              onClick={handleToggleSound}
              className="btn flex-row"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: soundEnabled ? 'var(--color-secondary)' : 'var(--border-subtle)' }}
              title="Toggle crowd cheers & commentary sounds"
            >
              {soundEnabled ? (
                <>
                  <Volume2 size={12} color="var(--color-secondary)" />
                  <span style={{ color: 'var(--color-secondary)' }}>Stadium Audio On</span>
                </>
              ) : (
                <>
                  <VolumeX size={12} />
                  <span>Audio Muted</span>
                </>
              )}
            </button>

            {isLive && (
              <span className="badge badge-live flex-row" style={{ animation: 'pulse-badge 1.5s infinite' }}>
                <Radio size={12} className="logo-icon" /> Live Sim
              </span>
            )}
          </div>
        </div>

        <div className="score-display-row">
          <div className="score-team-card">
            <h3 className="score-team-name">{match.teams.teamA.name}</h3>
            <p className="score-team-runs">{getLiveScoreDisplay('teamA')}</p>
            {match.currentInnings === 1 && match.battingFirst === 'teamA' && isLive && (
              <span className="badge badge-upcoming" style={{ fontSize: '0.65rem' }}>Batting</span>
            )}
          </div>
          <div className="vs-divider">VS</div>
          <div className="score-team-card">
            <h3 className="score-team-name">{match.teams.teamB.name}</h3>
            <p className="score-team-runs">{getLiveScoreDisplay('teamB')}</p>
            {((match.currentInnings === 1 && match.battingFirst === 'teamB') || 
              (match.currentInnings === 2 && match.battingFirst !== 'teamB')) && isLive && (
              <span className="badge badge-upcoming" style={{ fontSize: '0.65rem' }}>Batting</span>
            )}
          </div>
        </div>

        <div className="status-bar flex-row" style={{ justifyContent: 'center' }}>
          <Award size={16} />
          <span>{match.result}</span>
        </div>

        {isLive && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '1rem', padding: '0.2rem 0.5rem' }}>
            <span>CRR: <strong style={{ color: 'var(--color-primary)' }}>{currentRR}</strong></span>
            {requiredRR && (
              <span>RRR: <strong style={{ color: 'var(--color-accent)' }}>{requiredRR}</strong></span>
            )}
            {match.target > 0 && (
              <span>Target: <strong style={{ color: '#FFF' }}>{match.target}</strong></span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '1rem', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--color-text-dark)' }}>
          <span className="flex-row"><MapPin size={12} /> {match.venue}</span>
          <span className="flex-row"><Calendar size={12} /> {match.date}</span>
        </div>
      </div>

      <div className="match-detail-grid">
        {/* Main Content Area */}
        <div>
          {/* Tabs Nav */}
          <div className="tabs-nav">
            <button className={`tab-btn ${activeTab === 'commentary' ? 'active' : ''}`} onClick={() => setActiveTab('commentary')}>Live Commentary</button>
            <button className={`tab-btn ${activeTab === 'wagon' ? 'active' : ''}`} onClick={() => setActiveTab('wagon')}>Pitch Wagon Wheel</button>
            <button className={`tab-btn ${activeTab === 'scorecard' ? 'active' : ''}`} onClick={() => setActiveTab('scorecard')}>Full Scorecard</button>
            <button className={`tab-btn ${activeTab === 'squads' ? 'active' : ''}`} onClick={() => setActiveTab('squads')}>Team Lineups</button>
            <button className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`} onClick={() => setActiveTab('control')}>Simulator Cockpit</button>
          </div>

          {/* Tab 1: Live Commentary */}
          {activeTab === 'commentary' && (
            <div className="pulse-card animate-entrance">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }} className="flex-row">
                <Radio size={16} className="logo-icon" /> Live Feed
              </h3>

              {isLive && (
                <>
                  <div className="tracker-row">
                    {/* Striker/Non-Striker */}
                    <div className="batsmen-tracker">
                      <div className="tracker-title">Batting</div>
                      <table className="tracker-table">
                        <thead>
                          <tr>
                            <th>Batsman</th>
                            <th className="text-right">R</th>
                            <th className="text-right">B</th>
                            <th className="text-right">4s</th>
                            <th className="text-right">6s</th>
                            <th className="text-right">SR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {match.batsmen.filter(b => !b.isOut).map((b) => (
                            <tr key={b.name} style={{ fontWeight: b.name === match.currentStriker ? '700' : '400', color: b.name === match.currentStriker ? '#FFF' : 'var(--color-text-muted)' }}>
                              <td className="flex-row" style={{ padding: '0.4rem 0' }}>
                                <span className="player-link" onClick={() => handlePlayerClick(b.name)}>
                                  {b.name}
                                </span>
                                {b.name === match.currentStriker && <span className="striker-dot" />}
                              </td>
                              <td className="text-right">{b.runs}</td>
                              <td className="text-right">{b.balls}</td>
                              <td className="text-right">{b.fours}</td>
                              <td className="text-right">{b.sixes}</td>
                              <td className="text-right">{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
   
                    {/* Bowlers */}
                    <div className="bowlers-tracker">
                      <div className="tracker-title">Bowling</div>
                      <table className="tracker-table">
                        <thead>
                          <tr>
                            <th>Bowler</th>
                            <th className="text-right">O</th>
                            <th className="text-right">M</th>
                            <th className="text-right">R</th>
                            <th className="text-right">W</th>
                            <th className="text-right">ER</th>
                          </tr>
                        </thead>
                        <tbody>
                          {match.bowlers.filter(b => b.isActive || b.name === match.currentBowler).map((b) => (
                            <tr key={b.name} style={{ fontWeight: b.name === match.currentBowler ? '700' : '400', color: b.name === match.currentBowler ? '#FFF' : 'var(--color-text-muted)' }}>
                              <td>
                                <span className="player-link" onClick={() => handlePlayerClick(b.name)}>
                                  {b.name}
                                </span>
                              </td>
                              <td className="text-right">{b.overs}</td>
                              <td className="text-right">{b.maidens}</td>
                              <td className="text-right">{b.runs}</td>
                              <td className="text-right">{b.wickets}</td>
                              <td className="text-right">{b.economy || '0.00'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Current Partnership Widget */}
                  {match.partnership && (
                    <div style={{ 
                      background: 'rgba(0, 240, 255, 0.02)', 
                      border: '1px solid var(--border-subtle)', 
                      borderRadius: '10px', 
                      padding: '0.8rem 1.2rem', 
                      marginTop: '1rem',
                      marginBottom: '1.2rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.8rem',
                      fontSize: '0.85rem'
                    }}>
                      <div className="flex-row" style={{ gap: '0.5rem' }}>
                        <Users size={14} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ color: 'var(--color-text-muted)' }}>Current Partnership:</span>
                        <strong style={{ color: '#FFF' }}>
                          {match.partnership.batsmanA} & {match.partnership.batsmanB}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span>Runs: <strong style={{ color: 'var(--color-accent)', fontSize: '0.95rem' }}>{match.partnership.runs}</strong></span>
                        <span style={{ color: 'var(--color-text-muted)' }}>Balls: <strong>{match.partnership.balls}</strong></span>
                        <span style={{ color: 'var(--color-text-dark)' }}>
                          RR: <strong>{match.partnership.balls > 0 ? ((match.partnership.runs / match.partnership.balls) * 6).toFixed(2) : '0.00'}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Current Over Widget */}
              {isLive && match.lastOver && match.lastOver.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(255,255,255,0.02)', padding: '0.8rem 1.2rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>This Over:</span>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {match.lastOver.map((ballVal, idx) => {
                      let style = { width: '28px', height: '28px', fontSize: '0.75rem' };
                      if (ballVal === 'W') style.borderColor = 'var(--color-danger)';
                      else if (ballVal === '4') style.borderColor = 'var(--color-accent)';
                      else if (ballVal === '6') style.borderColor = 'var(--color-primary)';
                      return (
                        <div key={idx} className="commentary-ball" style={style}>
                          {ballVal}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Commentary Log */}
              <div className="commentary-list">
                {match.commentary.length === 0 ? (
                  <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '2rem' }}>No commentary available yet. Start simulation to begin.</p>
                ) : (
                  match.commentary.map((comm, idx) => {
                    let typeClass = '';
                    if (comm.eventType === 'info') typeClass = 'info';
                    else if (comm.eventType === 'wicket') typeClass = 'wicket';
                    else if (comm.eventType === 'boundary' && comm.runs === 4) typeClass = 'boundary-4';
                    else if (comm.eventType === 'boundary' && comm.runs === 6) typeClass = 'boundary-6';

                    return (
                      <div key={idx} className={`commentary-item ${typeClass}`}>
                        <div className="commentary-ball">
                          {comm.eventType === 'info' ? 'i' : `${comm.over}`}
                        </div>
                        <div className="commentary-body">
                          <p className="commentary-text">{comm.text}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Wagon Wheel Pitch Visualizer */}
          {activeTab === 'wagon' && (
            <div className="pulse-card animate-entrance" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }} className="flex-row">
                <Sparkles size={16} className="logo-icon" /> Stadium Wagon Wheel Visualizer
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                Graphical vectors representing the shot placements of the last 25 balls.
              </p>

              {/* Stadium Drawing field */}
              <div className="stadium-oval">
                <div className="stadium-pitch"></div>
                
                {/* SVG canvas layer */}
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  {/* Outer circle rope */}
                  <circle cx="160" cy="160" r="142" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                  
                  {/* Radial sector labels (Off side, leg side) */}
                  <text x="50" y="40" fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="bold">OFF SIDE</text>
                  <text x="230" y="40" fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="bold">LEG SIDE</text>
                  <text x="135" y="305" fill="rgba(255,255,255,0.25)" fontSize="9" fontWeight="bold">WICKET KEEPER</text>
                  
                  {/* Draw vector lines for each valid commentary ball */}
                  {match.commentary
                    .filter(c => c.eventType && c.eventType !== 'info')
                    .slice(0, 25)
                    .map((comm, idx) => {
                      const coords = getStrokeCoordinates(comm.runs, idx);
                      let color = 'rgba(255,255,255,0.3)'; // dot
                      let strokeW = '1.5';
                      
                      if (comm.eventType === 'wicket') {
                        color = 'var(--color-danger)';
                        strokeW = '2';
                      } else if (comm.runs === 1 || comm.runs === 2 || comm.runs === 3) {
                        color = '#4FD1C5'; // soft teal
                      } else if (comm.runs === 4) {
                        color = 'var(--color-accent)'; // gold
                        strokeW = '2.5';
                      } else if (comm.runs === 6) {
                        color = 'var(--color-primary)'; // cyan
                        strokeW = '3';
                      }

                      return (
                        <g key={idx}>
                          <line 
                            x1={coords.x1} 
                            y1={coords.y1} 
                            x2={coords.x2} 
                            y2={coords.y2} 
                            stroke={color} 
                            strokeWidth={strokeW}
                            className="wagon-line"
                            style={{ filter: comm.runs >= 4 ? `drop-shadow(0 0 3px ${color})` : 'none' }}
                          />
                          {/* Dot at termination point */}
                          <circle cx={coords.x2} cy={coords.y2} r={comm.runs >= 4 ? '3' : '1.5'} fill={color} />
                        </g>
                      );
                    })}
                </svg>
              </div>

              {/* Legends list */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.2rem', marginTop: '1.5rem', fontSize: '0.8rem' }}>
                <span className="flex-row"><span style={{ width: '12px', height: '3px', background: 'var(--color-primary)', display: 'inline-block' }}></span> Six (6)</span>
                <span className="flex-row"><span style={{ width: '12px', height: '3px', background: 'var(--color-accent)', display: 'inline-block' }}></span> Four (4)</span>
                <span className="flex-row"><span style={{ width: '12px', height: '3px', background: '#4FD1C5', display: 'inline-block' }}></span> Singles/Runs</span>
                <span className="flex-row"><span style={{ width: '12px', height: '3px', background: 'var(--color-danger)', display: 'inline-block' }}></span> Wicket</span>
              </div>
            </div>
          )}

          {/* Tab 3: Full Scorecard */}
          {activeTab === 'scorecard' && (
            <div className="pulse-card scorecard-section animate-entrance">
              {['teamA', 'teamB'].map((teamKey) => {
                const team = match.teams[teamKey];
                const score = match.scores[teamKey];
                const didBat = match.battingFirst === teamKey || match.currentInnings === 2;
                if (!didBat && match.status === 'upcoming') return null;

                const teamBatsmen = match.batsmen.filter(b => team.squad.includes(b.name));
                const teamBowlers = match.bowlers.filter(b => {
                  const opponentKey = teamKey === 'teamA' ? 'teamB' : 'teamA';
                  return match.teams[opponentKey].squad.includes(b.name);
                });

                return (
                  <div key={teamKey} className="innings-card">
                    <div className="innings-header">
                      <h4 className="innings-title">{team.name} Innings</h4>
                      <div className="innings-total">
                        {score.runs}/{score.wickets} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>({score.overs}.{score.balls} Ov)</span>
                      </div>
                    </div>

                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th>Batsman</th>
                          <th>Status</th>
                          <th className="text-right">R</th>
                          <th className="text-right">B</th>
                          <th className="text-right">4s</th>
                          <th className="text-right">6s</th>
                          <th className="text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamBatsmen.length === 0 ? (
                          <tr>
                            <td colSpan="7" style={{ color: 'var(--color-text-dark)', textAlign: 'center' }}>Innings yet to start</td>
                          </tr>
                        ) : (
                          <>
                            {teamBatsmen.map((b) => (
                              <tr key={b.name}>
                                <td style={{ fontWeight: '500' }}>
                                  <span className="player-link" onClick={() => handlePlayerClick(b.name)}>
                                    {b.name}
                                  </span>
                                </td>
                                <td style={{ color: b.isOut ? 'var(--color-danger)' : 'var(--color-secondary)' }}>
                                  {b.isOut ? (b.howOut || 'Out') : 'Batting'}
                                </td>
                                <td className="text-right" style={{ fontWeight: '600' }}>{b.runs}</td>
                                <td className="text-right">{b.balls}</td>
                                <td className="text-right">{b.fours}</td>
                                <td className="text-right">{b.sixes}</td>
                                <td className="text-right">{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                              </tr>
                            ))}
                            {/* Extras Row */}
                            <tr className="scorecard-extras-row">
                              <td style={{ fontWeight: '500' }}>Extras</td>
                              <td colSpan="6" style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                <strong style={{ color: 'var(--color-text-main)', fontSize: '0.85rem' }}>{score.extras || 0}</strong>
                              </td>
                            </tr>
                            {/* Total Row */}
                            <tr className="scorecard-total-row">
                              <td style={{ fontWeight: 'bold' }}>Total</td>
                              <td colSpan="6" style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>
                                {score.runs}/{score.wickets} <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: '400' }}>({score.overs}.{score.balls || 0} Ov)</span>
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>

                    <div style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                      <strong>Did Not Bat:</strong>{' '}
                      {team.squad && team.squad.filter(name => !match.batsmen.some(b => b.name === name)).length > 0 ? (
                        team.squad.filter(name => !match.batsmen.some(b => b.name === name)).map((name, i, arr) => (
                          <span key={name}>
                            <span className="player-link" style={{ fontSize: '0.8rem' }} onClick={() => handlePlayerClick(name)}>
                              {name}
                            </span>
                            {i < arr.length - 1 ? ', ' : ''}
                          </span>
                        ))
                      ) : (
                        <span>None</span>
                      )}
                    </div>

                    {/* Fall of Wickets Section */}
                    {match.fow && match.fow[teamKey] && match.fow[teamKey].length > 0 && (
                      <div className="fow-container">
                        <strong>Fall of Wickets</strong>
                        <div className="fow-list">
                          {match.fow[teamKey].map((wicket, i) => {
                            // Extract player name from wicket string like "12-1 (Rohit Sharma, 1.3 ov)"
                            const nameMatch = wicket.match(/\(([^,]+),/);
                            const playerName = nameMatch ? nameMatch[1].trim() : '';
                            return (
                              <span 
                                key={i} 
                                className="fow-pill" 
                                style={{ cursor: playerName ? 'pointer' : 'default' }}
                                onClick={() => playerName && handlePlayerClick(playerName)}
                              >
                                {wicket}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--border-subtle)', padding: '0.4rem 1.2rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                      Bowling
                    </div>
                    <table className="scorecard-table">
                      <thead>
                        <tr>
                          <th>Bowler</th>
                          <th className="text-right">O</th>
                          <th className="text-right">M</th>
                          <th className="text-right">R</th>
                          <th className="text-right">W</th>
                          <th className="text-right">ER</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamBowlers.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ color: 'var(--color-text-dark)', textAlign: 'center' }}>No bowler statistics for this innings</td>
                          </tr>
                        ) : (
                          teamBowlers.map((b) => (
                            <tr key={b.name}>
                              <td style={{ fontWeight: '500' }}>
                                <span className="player-link" onClick={() => handlePlayerClick(b.name)}>
                                  {b.name}
                                </span>
                              </td>
                              <td className="text-right">{b.overs}</td>
                              <td className="text-right">{b.maidens}</td>
                              <td className="text-right">{b.runs}</td>
                              <td className="text-right" style={{ fontWeight: '600', color: b.wickets > 0 ? 'var(--color-secondary)' : 'inherit' }}>{b.wickets}</td>
                              <td className="text-right">{b.economy || '0.00'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 4: Squads */}
          {activeTab === 'squads' && (
            <div className="pulse-card animate-entrance">
              <h3 style={{ marginBottom: '1.2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Team Squads</h3>
              <div className="tracker-row">
                <div className="batsmen-tracker">
                  <div className="tracker-title" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{match.teams.teamA.name}</div>
                  <ul style={{ listStyle: 'none' }}>
                    {match.teams.teamA.squad.map((player, idx) => (
                      <li key={player} style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {idx + 1}.{' '}
                          <span className="player-link" onClick={() => handlePlayerClick(player)}>
                            {player}
                          </span>
                        </span>
                        {match.batsmen.some(b => b.name === player && b.isOut) && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Out</span>}
                        {match.batsmen.some(b => b.name === player && !b.isOut) && <span style={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}>Batting</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="batsmen-tracker">
                  <div className="tracker-title" style={{ fontSize: '1rem', color: 'var(--color-primary)' }}>{match.teams.teamB.name}</div>
                  <ul style={{ listStyle: 'none' }}>
                    {match.teams.teamB.squad.map((player, idx) => (
                      <li key={player} style={{ padding: '0.4rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {idx + 1}.{' '}
                          <span className="player-link" onClick={() => handlePlayerClick(player)}>
                            {player}
                          </span>
                        </span>
                        {match.batsmen.some(b => b.name === player && b.isOut) && <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem' }}>Out</span>}
                        {match.batsmen.some(b => b.name === player && !b.isOut) && <span style={{ color: 'var(--color-secondary)', fontSize: '0.75rem' }}>Batting</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Simulator Cockpit */}
          {activeTab === 'control' && (
            <div className="control-room animate-entrance">
              <h3 className="control-header"><Cpu size={18} /> Sandbox Simulator Cockpit</h3>
              
              <div className="simulation-switch">
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Take control of the live game. You can start/pause the automated simulation ticker, or manually inject specific ball events.
                </p>

                <div className="form-group" style={{ margin: '0.5rem 0' }}>
                  <label>Auto-Simulation Pace (seconds per ball)</label>
                  <select 
                    value={simSpeed} 
                    onChange={(e) => setSimSpeed(Number(e.target.value))}
                    className="form-input"
                    style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-main)' }}
                    disabled={match.simulationSpeed > 0}
                  >
                    <option value={1500}>1.5s (Turbo)</option>
                    <option value={3000}>3s (Fast)</option>
                    <option value={5000}>5s (Medium)</option>
                    <option value={8000}>8s (Slow)</option>
                  </select>
                </div>

                <div className="flex-row">
                  {match.simulationSpeed === 0 ? (
                    <button 
                      onClick={() => handleToggleSimulation('start')} 
                      className="btn btn-primary"
                      disabled={isSubmitting || match.status === 'completed'}
                    >
                      <Play size={14} /> Start Auto-Simulation
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggleSimulation('stop')} 
                      className="btn btn-danger"
                      disabled={isSubmitting}
                    >
                      <Square size={14} /> Pause Auto-Simulation
                    </button>
                  )}
                  {match.status === 'completed' && (
                    <span className="flex-row" style={{ color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600 }}>
                      <AlertCircle size={14} /> Match completed. Simulator disabled.
                    </span>
                  )}
                </div>
              </div>

              {match.status === 'live' && (
                <div style={{ borderTop: '1px solid rgba(0, 240, 255, 0.1)', paddingTop: '1.2rem', marginTop: '0.5rem' }}>
                  <h4 style={{ color: 'var(--color-accent)', fontSize: '0.95rem', marginBottom: '0.8rem' }} className="flex-row">
                    <RefreshCw size={14} /> Manual Ball Event Injection
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.8rem' }}>
                    Inject a custom event instantly. Make sure auto-simulation is paused if you want full control over each ball.
                  </p>

                  <div className="override-grid">
                    <button onClick={() => handleManualEvent('dot', 0)} className="btn btn-event" disabled={isSubmitting}>Dot Ball (0)</button>
                    <button onClick={() => handleManualEvent('run', 1)} className="btn btn-event" disabled={isSubmitting}>Single (1)</button>
                    <button onClick={() => handleManualEvent('run', 2)} className="btn btn-event" disabled={isSubmitting}>Double (2)</button>
                    <button onClick={() => handleManualEvent('run', 3)} className="btn btn-event" disabled={isSubmitting}>Triple (3)</button>
                    <button onClick={() => handleManualEvent('boundary', 4)} className="btn btn-primary btn-event" disabled={isSubmitting}>FOUR! (4)</button>
                    <button onClick={() => handleManualEvent('boundary', 6)} className="btn btn-primary btn-event" disabled={isSubmitting}>SIX! (6)</button>
                    <button onClick={() => handleManualEvent('wide', 1)} className="btn btn-accent btn-event" disabled={isSubmitting}>Wide Extra</button>
                    <button onClick={() => handleManualEvent('noball', 1)} className="btn btn-accent btn-event" disabled={isSubmitting}>No Ball Extra</button>
                    <button onClick={() => handleManualEvent('wicket', 0)} className="btn btn-danger btn-event" disabled={isSubmitting}>WICKET! (W)</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Analytics Panels */}
        <div className="sidebar-panel">
          {/* win probability widget */}
          {match.status !== 'upcoming' && (
            <div className="pulse-card">
              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <TrendingUp size={16} /> Win Probability Index
              </h4>
              
              <div style={{ marginTop: '1rem' }}>
                <div className="win-prob-bar-container">
                  <div className="win-prob-team-a" style={{ width: `${winProb.bat}%` }}>
                    {winProb.bat > 15 ? `${battingTeam?.shortName} ${winProb.bat}%` : ''}
                  </div>
                  <div className="win-prob-team-b" style={{ width: `${winProb.bowl}%` }}>
                    {winProb.bowl > 15 ? `${winProb.bowl}% ${bowlingTeam?.shortName}` : ''}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  <span>{battingTeam?.name} (Bat)</span>
                  <span>{bowlingTeam?.name} (Bowl)</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Score Predictor */}
          {projectedScore && (
            <div className="pulse-card">
              <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Cpu size={16} /> AI Score Projections
              </h4>
              <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>At Current RR ({currentRR}):</span>
                  <strong style={{ color: '#FFF' }}>{projectedScore.currentRate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>At High Gear (8.5+ rpo):</span>
                  <strong style={{ color: 'var(--color-secondary)' }}>{projectedScore.highRate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>At Low Gear (5.0 rpo):</span>
                  <strong style={{ color: 'var(--color-danger)' }}>{projectedScore.lowRate}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Premium Insights Widget */}
          <div className="pulse-card" style={{ 
            border: '1px solid rgba(255, 215, 0, 0.25)', 
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.02) 0%, rgba(255, 255, 255, 0.005) 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Gold Premium Ribbon */}
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '-28px',
              background: 'linear-gradient(90deg, #D4AF37, #FFDF00)',
              color: '#000',
              fontSize: '0.55rem',
              fontWeight: '800',
              padding: '0.15rem 2.2rem',
              transform: 'rotate(45deg)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              zIndex: 1
            }}>
              PRO
            </div>

            <h4 style={{ fontSize: '0.95rem', borderBottom: '1px solid rgba(255,215,0,0.15)', paddingBottom: '0.4rem', color: '#FFD700', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
              <Star size={14} fill="#FFD700" color="#FFD700" /> MatchPulse Premium Insights
            </h4>

            {(() => {
              const insights = getPremiumInsights();
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.8rem' }}>
                  {/* H2H Section */}
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-primary)', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Head-to-Head (H2H) History
                    </strong>
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                        <span>Total Matches:</span>
                        <strong style={{ color: '#FFF' }}>{insights.totalMatches}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <span>{match.teams.teamA.shortName || match.teams.teamA.name} Wins: <strong>{insights.teamAWins}</strong></span>
                        <span>{match.teams.teamB.shortName || match.teams.teamB.name} Wins: <strong>{insights.teamBWins}</strong></span>
                      </div>
                      {insights.noResult > 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-dark)', marginTop: '0.15rem' }}>
                          No Result / Ties: {insights.noResult}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fantasy Insights Section */}
                  <div>
                    <strong style={{ display: 'block', color: 'var(--color-accent)', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Fantasy / Dream11 Insights
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: '6px', padding: '0.5rem' }}>
                      <div>
                        <span style={{ color: 'var(--color-text-muted)' }}>Top Picks: </span>
                        <strong style={{ color: '#FFF', fontSize: '0.75rem' }}>{insights.topPicks.join(', ')}</strong>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.3rem', marginTop: '0.1rem', gap: '0.15rem' }}>
                        <div>Captain: <strong style={{ color: 'var(--color-primary)' }}>{insights.captain}</strong></div>
                        <div>Vice-Captain: <strong style={{ color: 'var(--color-secondary)' }}>{insights.viceCaptain}</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Match Quick Info */}
          <div className="pulse-card">
            <h4 style={{ fontSize: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem', color: 'var(--color-primary)' }}>Match Quick Info</h4>
            <div style={{ marginTop: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
              <div><strong>Match:</strong> {match.title}</div>
              <div><strong>Series:</strong> {match.series}</div>
              <div><strong>Venue:</strong> {match.venue}</div>
              <div><strong>Date:</strong> {match.date}</div>
              <div><strong>Limit:</strong> {match.oversLimit} Overs</div>
              <div><strong>Toss:</strong> {match.toss.text || 'Yet to occur'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Profile Modal */}
      {selectedPlayer && (
        <div className="modal-overlay" onClick={() => setSelectedPlayer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button 
              onClick={() => setSelectedPlayer(null)} 
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                lineHeight: '1'
              }}
            >
              &times;
            </button>
            
            <div className="player-profile-header">
              <div className="player-avatar-large">
                {selectedPlayer.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div className="player-meta-info">
                <h2>{selectedPlayer.name}</h2>
                <p>{selectedPlayer.role}</p>
              </div>
            </div>

            <div className="player-bio-grid">
              <div className="bio-item">
                <div className="bio-label">Country</div>
                <div className="bio-value">{selectedPlayer.country}</div>
              </div>
              <div className="bio-item">
                <div className="bio-label">Age</div>
                <div className="bio-value">{selectedPlayer.age} years</div>
              </div>
              <div className="bio-item">
                <div className="bio-label">Batting Style</div>
                <div className="bio-value">{selectedPlayer.batStyle}</div>
              </div>
              <div className="bio-item">
                <div className="bio-label">Bowling Style</div>
                <div className="bio-value">{selectedPlayer.bowlStyle}</div>
              </div>
            </div>

            <div className="player-stats-section">
              <h3>Career Statistics</h3>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>Format</th>
                    <th className="text-right">Mat</th>
                    <th className="text-right">Runs</th>
                    <th className="text-right">Avg</th>
                    <th className="text-right">100s</th>
                    <th className="text-right">50s</th>
                    <th className="text-right">Wkts</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>T20I/League</td>
                    <td className="text-right">{selectedPlayer.stats.matches}</td>
                    <td className="text-right">{selectedPlayer.stats.runs}</td>
                    <td className="text-right">{selectedPlayer.stats.batAvg}</td>
                    <td className="text-right">{selectedPlayer.hundreds}</td>
                    <td className="text-right">{selectedPlayer.fifties}</td>
                    <td className="text-right">{selectedPlayer.stats.wickets}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span><strong>Strike Rate:</strong> {selectedPlayer.stats.strikeRate}</span>
                {selectedPlayer.stats.wickets > 0 && (
                  <span><strong>Best Bowl:</strong> {selectedPlayer.stats.bestBowling} (Econ: {selectedPlayer.stats.bowlEcon})</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetail;
