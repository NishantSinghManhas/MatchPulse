import React, { useState } from 'react';
import { PlusCircle, Database, HelpCircle, ArrowLeft } from 'lucide-react';

const AdminPanel = ({ onMatchCreated, onBack }) => {
  const [title, setTitle] = useState('1st T20I');
  const [series, setSeries] = useState('World Bilateral Series, 2026');
  const [venue, setVenue] = useState('Eden Gardens, Kolkata');
  const [format, setFormat] = useState('T20');
  const [oversLimit, setOversLimit] = useState(20);
  
  // Team A
  const [teamAName, setTeamAName] = useState('India');
  const [teamAShort, setTeamAShort] = useState('IND');
  const [teamASquad, setTeamASquad] = useState('Rohit Sharma, Virat Kohli, Suryakumar Yadav, Rishabh Pant, Hardik Pandya, Ravindra Jadeja, Axar Patel, Kuldeep Yadav, Jasprit Bumrah, Arshdeep Singh, Mohammed Siraj');

  // Team B
  const [teamBName, setTeamBName] = useState('New Zealand');
  const [teamBShort, setTeamBShort] = useState('NZ');
  const [teamBSquad, setTeamBSquad] = useState('Devon Conway, Rachin Ravindra, Kane Williamson, Daryl Mitchell, Glenn Phillips, Mark Chapman, Mitchell Santner, Matt Henry, Tim Southee, Lockie Ferguson, Ish Sodhi');

  const [tossWinner, setTossWinner] = useState('teamA');
  const [tossDecision, setTossDecision] = useState('bat');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const parseSquad = (squadText) => {
    return squadText.split(',').map(name => name.trim()).filter(name => name.length > 0);
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const squadA = parseSquad(teamASquad);
    const squadB = parseSquad(teamBSquad);

    if (squadA.length < 2 || squadB.length < 2) {
      setMessage({ type: 'error', text: 'Each team squad must have at least 2 players!' });
      setIsSubmitting(false);
      return;
    }

    const tossText = `${tossWinner === 'teamA' ? teamAName : teamBName} won the toss and elected to ${tossDecision}`;

    const matchData = {
      title,
      series,
      format,
      venue,
      oversLimit: Number(oversLimit),
      teams: {
        teamA: { name: teamAName, shortName: teamAShort, squad: squadA },
        teamB: { name: teamBName, shortName: teamBShort, squad: squadB }
      },
      toss: {
        winner: tossWinner,
        decision: tossDecision,
        text: tossText
      },
      battingFirst: tossWinner === 'teamA' 
        ? (tossDecision === 'bat' ? 'teamA' : 'teamB') 
        : (tossDecision === 'bat' ? 'teamB' : 'teamA'),
      status: 'upcoming',
      result: 'Match starts soon',
      commentary: [],
      batsmen: [],
      bowlers: [],
      scores: {
        teamA: { runs: 0, wickets: 0, overs: 0, balls: 0 },
        teamB: { runs: 0, wickets: 0, overs: 0, balls: 0 }
      }
    };

    try {
      const response = await fetch('http://localhost:5000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
      });
      if (response.ok) {
        const created = await response.json();
        setMessage({ type: 'success', text: 'Match successfully created!' });
        setTimeout(() => {
          onMatchCreated(created._id);
        }, 1500);
      } else {
        const err = await response.json();
        setMessage({ type: 'error', text: err.error || 'Failed to create match' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error connecting to API backend' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:5000/api/matches/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error seeding database' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="view-section">
      <div className="pulse-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} className="btn flex-row" style={{ padding: '0.4rem 0.8rem' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <h2 style={{ fontSize: '1.4rem' }} className="flex-row">
          <PlusCircle size={20} className="logo-icon" /> Match Control Room
        </h2>
      </div>

      <div className="match-detail-grid">
        {/* Creation Form */}
        <div className="pulse-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.2rem', color: 'var(--color-primary)' }}>Create Custom Cricket Match</h3>
          
          {message && (
            <div style={{
              background: message.type === 'success' ? 'rgba(0, 230, 90, 0.1)' : 'rgba(255, 46, 99, 0.1)',
              border: `1px solid ${message.type === 'success' ? 'var(--color-secondary)' : 'var(--color-danger)'}`,
              borderRadius: '8px',
              padding: '0.8rem',
              marginBottom: '1.2rem',
              color: message.type === 'success' ? 'var(--color-secondary)' : 'var(--color-danger)',
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleCreateMatch}>
            {/* General Info */}
            <div className="form-row">
              <div className="form-group">
                <label>Match Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label>Series / Tournament Name</label>
                <input type="text" value={series} onChange={(e) => setSeries(e.target.value)} className="form-input" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Venue (Stadium, Location)</label>
                <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Format</label>
                  <select value={format} onChange={(e) => setFormat(e.target.value)} className="form-input" style={{ background: 'var(--bg-main)', color: 'var(--color-text-main)' }}>
                    <option value="T20">T20</option>
                    <option value="T20I">T20I</option>
                    <option value="ODI">ODI</option>
                    <option value="TEST">TEST</option>
                  </select>
                </div>
                <div>
                  <label>Overs Limit</label>
                  <input type="number" min="1" max="100" value={oversLimit} onChange={(e) => {
                    setOversLimit(e.target.value);
                    const val = Number(e.target.value);
                    if (val === 50) setFormat('ODI');
                    else if (val >= 90) setFormat('TEST');
                    else if (val === 20) setFormat('T20');
                  }} className="form-input" required />
                </div>
              </div>
            </div>

            {/* Team A Details */}
            <div className="form-section-title">Team A Details</div>
            <div className="form-row">
              <div className="form-group">
                <label>Team A Full Name</label>
                <input type="text" value={teamAName} onChange={(e) => setTeamAName(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label>Team A Short Code</label>
                <input type="text" maxLength="4" value={teamAShort} onChange={(e) => setTeamAShort(e.target.value)} className="form-input" required />
              </div>
            </div>
            <div className="form-group">
              <label>Team A Squad (11 comma-separated players, ordered by batting order)</label>
              <textarea 
                rows="3" 
                value={teamASquad} 
                onChange={(e) => setTeamASquad(e.target.value)} 
                className="form-input" 
                style={{ fontFamily: 'sans-serif', resize: 'vertical' }}
                required 
              />
            </div>

            {/* Team B Details */}
            <div className="form-section-title">Team B Details</div>
            <div className="form-row">
              <div className="form-group">
                <label>Team B Full Name</label>
                <input type="text" value={teamBName} onChange={(e) => setTeamBName(e.target.value)} className="form-input" required />
              </div>
              <div className="form-group">
                <label>Team B Short Code</label>
                <input type="text" maxLength="4" value={teamBShort} onChange={(e) => setTeamBShort(e.target.value)} className="form-input" required />
              </div>
            </div>
            <div className="form-group">
              <label>Team B Squad (11 comma-separated players, ordered by batting order)</label>
              <textarea 
                rows="3" 
                value={teamBSquad} 
                onChange={(e) => setTeamBSquad(e.target.value)} 
                className="form-input" 
                style={{ fontFamily: 'sans-serif', resize: 'vertical' }}
                required 
              />
            </div>

            {/* Toss and Starting Setup */}
            <div className="form-section-title">Toss Setup</div>
            <div className="form-row">
              <div className="form-group">
                <label>Toss Winner</label>
                <select value={tossWinner} onChange={(e) => setTossWinner(e.target.value)} className="form-input">
                  <option value="teamA">{teamAName}</option>
                  <option value="teamB">{teamBName}</option>
                </select>
              </div>
              <div className="form-group">
                <label>Toss Decision</label>
                <select value={tossDecision} onChange={(e) => setTossDecision(e.target.value)} className="form-input">
                  <option value="bat">Elected to Bat</option>
                  <option value="bowl">Elected to Bowl</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem' }} disabled={isSubmitting}>
              {isSubmitting ? 'Creating Match...' : 'Initialize & Save Match'}
            </button>
          </form>
        </div>

        {/* Sidebar Settings Panel */}
        <div className="sidebar-panel">
          <div className="pulse-card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--color-accent)' }} className="flex-row">
              <Database size={16} /> Database Management
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.2rem', lineValue: 1.4 }}>
              If your database store is empty, or you want to restore default mock matches (e.g. World Cup Final, Ashes Test), use the system seed utility below.
            </p>
            <button 
              onClick={handleSeedDatabase} 
              className="btn btn-accent" 
              style={{ width: '100%', padding: '0.6rem' }} 
              disabled={isSubmitting}
            >
              <Database size={14} /> Seed Default Match Database
            </button>
          </div>

          <div className="pulse-card">
            <h4 style={{ fontSize: '0.95rem', color: '#FFF', marginBottom: '0.6rem' }} className="flex-row">
              <HelpCircle size={14} /> Creator Guide
            </h4>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div>• Enter 11 player names for each squad, separated by commas.</div>
              <div>• Setting the toss will define which team bats first. If Team A wins the toss and elects to bat, Team A will bat first. If they elect to bowl, Team B will bat first.</div>
              <div>• Once created, you can navigate to the match and use the <strong>Simulator Cockpit</strong> tab to start/stop live score simulations or inject manual events!</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
