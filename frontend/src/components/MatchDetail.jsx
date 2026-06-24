import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, Award, MapPin, Calendar, Users, Radio, Cpu, 
  RefreshCw, AlertCircle, Volume2, VolumeX, TrendingUp, Sparkles 
} from 'lucide-react';
import { soundSynth } from '../utils/soundSynth';

const MatchDetail = ({ matchId, socket }) => {
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

  // Sync sound utility state
  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundSynth.toggle(newState);
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
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {match.title} • {match.series}
          </span>
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
                              {b.name}
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
                            <td>{b.name}</td>
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
                          teamBatsmen.map((b) => (
                            <tr key={b.name}>
                              <td style={{ fontWeight: '500' }}>{b.name}</td>
                              <td style={{ color: b.isOut ? 'var(--color-danger)' : 'var(--color-secondary)' }}>
                                {b.isOut ? (b.howOut || 'Out') : 'Batting'}
                              </td>
                              <td className="text-right" style={{ fontWeight: '600' }}>{b.runs}</td>
                              <td className="text-right">{b.balls}</td>
                              <td className="text-right">{b.fours}</td>
                              <td className="text-right">{b.sixes}</td>
                              <td className="text-right">{b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(1) : '0.0'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>

                    <div style={{ padding: '0.5rem 1.2rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', borderTop: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.01)' }}>
                      <strong>Did Not Bat:</strong> {team.squad.filter(name => !match.batsmen.some(b => b.name === name)).join(', ') || 'None'}
                    </div>

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
                              <td style={{ fontWeight: '500' }}>{b.name}</td>
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
                        <span>{idx + 1}. {player}</span>
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
                        <span>{idx + 1}. {player}</span>
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
    </div>
  );
};

export default MatchDetail;
