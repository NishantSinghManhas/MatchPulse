import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { 
  Radio, PlusCircle, LayoutDashboard, Database, RefreshCw, 
  Trash2, Award, Calendar, Archive, Newspaper, Tv, Users, 
  HelpCircle, User, CreditCard, CheckCircle, Flame, Sun, Moon
} from 'lucide-react';

import MatchList from './components/MatchList';
import MatchDetail from './components/MatchDetail';
import AdminPanel from './components/AdminPanel';
import Rankings from './components/Rankings';
import NewsHub from './components/NewsHub';
import VideoGallery from './components/VideoGallery';
import TeamsGallery from './components/TeamsGallery';

// Connect to socket server
const socket = io('http://localhost:5000');

const teamThemes = {
  IND: '#00F0FF', // Electric Cyan
  AUS: '#FFD700', // Gold / Yellow
  PAK: '#00E676', // Emerald Green
  NZ: '#A0AEC0',  // Slate Gray
  RSA: '#E53E3E', // Crimson / Orange Red
  ENG: '#ED64A6'  // Pink
};

function App() {
  const [matches, setMatches] = useState([]);
  const [activeView, setActiveView] = useState('news'); // 'news', 'matches', 'detail', 'admin', 'rankings', 'teams', 'videos'
  const [matchFilter, setMatchFilter] = useState('all'); // 'all', 'live', 'upcoming', 'completed'
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Theme State
  const [theme, setTheme] = useState('dark'); // 'dark' | 'light'

  // User State
  const [user, setUser] = useState({
    name: 'Cricket Fan',
    favTeam: 'IND',
    isPro: false
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [tempName, setTempName] = useState(user.name);

  // Form payment fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const profileRef = useRef(null);

  // Fetch initial matches
  const fetchMatches = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/matches');
      if (response.ok) {
        const data = await response.json();
        setMatches(data);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    socket.on('matches_list_update', (data) => {
      if (data.deleted) {
        setMatches(prev => prev.filter(m => m._id !== data._id));
      } else {
        setMatches(prev => {
          const idx = prev.findIndex(m => m._id === data._id);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = data;
            return updated;
          } else {
            return [data, ...prev];
          }
        });
      }
    });

    return () => {
      socket.off('matches_list_update');
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectMatch = (id) => {
    setSelectedMatchId(id);
    setActiveView('detail');
  };

  const handleDeleteMatch = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this match?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/matches/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        if (selectedMatchId === id) {
          setActiveView('news');
          setSelectedMatchId(null);
        }
      }
    } catch (err) {
      console.error('Error deleting match:', err);
    }
  };

  const handleUpgrade = (e) => {
    e.preventDefault();
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setUpgradeSuccess(true);
      setTimeout(() => {
        setUser(prev => ({ ...prev, isPro: true }));
        setShowPremiumModal(false);
        setUpgradeSuccess(false);
        setCardNumber('');
        setCardExpiry('');
        setCardCVV('');
      }, 1500);
    }, 2000);
  };

  const handleSaveProfile = () => {
    setUser(prev => ({ ...prev, name: tempName }));
    setShowProfileMenu(false);
  };

  // Generate dynamic CSS overrides for custom themes
  const currentAccent = teamThemes[user.favTeam];
  const accentGlow = currentAccent + '40'; // 25% opacity
  const accentDim = currentAccent + '15';  // 8% opacity

  return (
    <div 
      className={`app-container ${theme === 'light' ? 'light-theme' : ''}`}
      style={{
        '--team-accent': currentAccent,
        '--team-accent-glow': accentGlow,
        '--team-accent-dim': accentDim
      }}
    >
      {/* Premium Glassmorphic Header */}
      <header className="main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div className="logo-container" onClick={() => { setActiveView('news'); setSelectedMatchId(null); }}>
            <Radio size={24} className="logo-icon" />
            <span className="logo-text">MatchPulse</span>
          </div>
          <div className="api-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)', fontWeight: 500 }}>
            <span style={{ width: '6px', height: '6px', background: '#10B981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px #10B981', animation: 'pulse 2s infinite' }}></span>
            Live API Active
          </div>
        </div>

        {/* Cricbuzz Header navigation Links */}
        <nav className="nav-links">
          <button 
            className={`nav-link ${activeView === 'matches' && matchFilter === 'live' ? 'active' : ''}`}
            onClick={() => { setActiveView('matches'); setMatchFilter('live'); setSelectedMatchId(null); }}
          >
            <Radio size={14} className="logo-icon" /> Live Scores
          </button>
          
          <button 
            className={`nav-link ${activeView === 'matches' && matchFilter === 'upcoming' ? 'active' : ''}`}
            onClick={() => { setActiveView('matches'); setMatchFilter('upcoming'); setSelectedMatchId(null); }}
          >
            <Calendar size={14} /> Schedule
          </button>
          
          <button 
            className={`nav-link ${activeView === 'matches' && matchFilter === 'completed' ? 'active' : ''}`}
            onClick={() => { setActiveView('matches'); setMatchFilter('completed'); setSelectedMatchId(null); }}
          >
            <Archive size={14} /> Archives
          </button>
          
          <button 
            className={`nav-link ${activeView === 'news' ? 'active' : ''}`}
            onClick={() => { setActiveView('news'); setSelectedMatchId(null); }}
          >
            <Newspaper size={14} /> News
          </button>

          <button 
            className={`nav-link ${activeView === 'teams' ? 'active' : ''}`}
            onClick={() => { setActiveView('teams'); setSelectedMatchId(null); }}
          >
            <Users size={14} /> Teams
          </button>

          <button 
            className={`nav-link ${activeView === 'videos' ? 'active' : ''}`}
            onClick={() => { setActiveView('videos'); setSelectedMatchId(null); }}
          >
            <Tv size={14} /> Videos
          </button>

          <button 
            className={`nav-link ${activeView === 'rankings' ? 'active' : ''}`}
            onClick={() => { setActiveView('rankings'); setSelectedMatchId(null); }}
          >
            <Award size={14} /> Rankings
          </button>

          <button 
            className={`nav-link ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => { setActiveView('admin'); setSelectedMatchId(null); }}
          >
            <PlusCircle size={14} /> Sandbox Control
          </button>
        </nav>

        {/* Header Right Widgets */}
        <div className="header-right">
          {/* Theme Switcher Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="btn flex-row" 
            style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', border: '1px solid var(--border-subtle)' }}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {!user.isPro ? (
            <button 
              className="btn btn-accent flex-row" 
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', animation: 'pulse-badge 2s infinite' }}
              onClick={() => setShowPremiumModal(true)}
            >
              <Flame size={14} fill="var(--color-accent)" /> Go Premium
            </button>
          ) : (
            <span className="pro-badge">PRO Account</span>
          )}

          {/* User Profile Dropper */}
          <div className="dropdown-container" ref={profileRef}>
            <div className="avatar-wrapper" onClick={() => setShowProfileMenu(!showProfileMenu)}>
              <div className={`avatar-icon ${user.isPro ? 'pro-glow' : ''}`}>
                <User size={16} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
            </div>

            {/* Profile Dropdown Form */}
            {showProfileMenu && (
              <div className="dropdown-menu" style={{ minWidth: '220px', padding: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.6rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <User size={14} className="logo-icon" /> Profile Settings
                </h4>
                
                <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-dark)' }}>Display Name</label>
                  <input 
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)} 
                    className="form-input" 
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--color-text-dark)' }}>Favorite Team Theme</label>
                  <select 
                    value={user.favTeam} 
                    onChange={(e) => setUser(prev => ({ ...prev, favTeam: e.target.value }))}
                    className="form-input"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: 'var(--bg-main)' }}
                  >
                    <option value="IND">🇮🇳 India (Cyan)</option>
                    <option value="AUS">🇦🇺 Australia (Gold)</option>
                    <option value="PAK">🇵🇰 Pakistan (Green)</option>
                    <option value="NZ">🇳🇿 New Zealand (Slate)</option>
                    <option value="RSA">🇿🇦 South Africa (Crimson)</option>
                    <option value="ENG">🇬🇧 England (Pink)</option>
                  </select>
                </div>

                <button onClick={handleSaveProfile} className="btn btn-primary" style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem' }}>
                  Save Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Top Ticker Slider for live match list */}
      {matches.length > 0 && (
        <div className="ticker-container">
          {matches.map((match) => {
            const isLive = match.status === 'live';
            const batTeamKey = match.currentInnings === 1 
              ? match.battingFirst 
              : (match.battingFirst === 'teamA' ? 'teamB' : 'teamA');

            return (
              <div 
                key={match._id} 
                className={`ticker-card ${isLive ? 'live' : ''}`}
                onClick={() => handleSelectMatch(match._id)}
              >
                <div className="ticker-header">
                  <span>{match.title.split('-')[0].trim()}</span>
                  {isLive ? (
                    <span className="ticker-badge-live">Live</span>
                  ) : (
                    <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-text-dark)' }}>
                      {match.status}
                    </span>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="ticker-match-row">
                    <span>{match.teams?.teamA?.shortName || 'TBA'}</span>
                    <span className={`ticker-match-score ${isLive && batTeamKey === 'teamA' ? 'batting' : ''}`}>
                      {match.scores?.teamA?.runs > 0 || match.scores?.teamA?.wickets > 0 || match.status === 'completed'
                        ? `${match.scores?.teamA?.runs}/${match.scores?.teamA?.wickets}` 
                        : '-'}
                    </span>
                  </div>
                  <div className="ticker-match-row">
                    <span>{match.teams?.teamB?.shortName || 'TBA'}</span>
                    <span className={`ticker-match-score ${isLive && batTeamKey === 'teamB' ? 'batting' : ''}`}>
                      {match.scores?.teamB?.runs > 0 || match.scores?.teamB?.wickets > 0 || match.status === 'completed'
                        ? `${match.scores?.teamB?.runs}/${match.scores?.teamB?.wickets}` 
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="ticker-result">
                  {match.status === 'completed' 
                    ? match.result 
                    : (isLive && match.scores?.[batTeamKey]
                        ? `${match.scores[batTeamKey].overs}.${match.scores[batTeamKey].balls || 0} Ov` 
                        : (isLive && match.scores?.teamA 
                            ? `${match.scores.teamA.overs}.${match.scores.teamA.balls || 0} Ov` 
                            : 'Preview'))}
                </div>
                
                <button
                  onClick={(e) => handleDeleteMatch(match._id, e)}
                  title="Delete match"
                  style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-dark)',
                    cursor: 'pointer',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                  }}
                  className="delete-ticker-btn"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content Router Deck */}
      <main className="main-content">
        {loading ? (
          <div className="pulse-card" style={{ flex: 1, textAlign: 'center', padding: '3rem' }}>
            <p className="flex-row" style={{ justifyContent: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
              <RefreshCw className="logo-icon" size={16} /> Loading MatchPulse...
            </p>
          </div>
        ) : (
          <>
            {activeView === 'matches' && (
              <MatchList 
                matches={matches} 
                onSelectMatch={handleSelectMatch} 
                defaultFilter={matchFilter}
              />
            )}
            
            {activeView === 'detail' && (
              <MatchDetail 
                matchId={selectedMatchId} 
                socket={socket} 
              />
            )}

            {activeView === 'admin' && (
              <AdminPanel 
                onMatchCreated={(id) => handleSelectMatch(id)}
                onBack={() => { setActiveView('news'); }}
              />
            )}

            {activeView === 'rankings' && <Rankings />}
            {activeView === 'news' && (
              <div className="view-section" style={{ gap: '0.8rem' }}>
                <div className="quick-access-bar flex-row">
                  <span className="quick-access-title">Quick Access:</span>
                  <button 
                    className="quick-access-btn" 
                    onClick={() => { setActiveView('matches'); setMatchFilter('live'); }}
                  >
                    🏆 Live Matches
                  </button>
                  <button 
                    className="quick-access-btn" 
                    onClick={() => { setActiveView('matches'); setMatchFilter('all'); }}
                  >
                    📅 ICC World Cup
                  </button>
                  <button 
                    className="quick-access-btn" 
                    onClick={() => { setActiveView('teams'); }}
                  >
                    👥 India (IND)
                  </button>
                  <button 
                    className="quick-access-btn" 
                    onClick={() => { setActiveView('teams'); }}
                  >
                    👥 Australia (AUS)
                  </button>
                  <button 
                    className="quick-access-btn premium flex-row" 
                    onClick={() => setShowPremiumModal(true)}
                  >
                    ⭐ Go Ad-free
                  </button>
                </div>
                <NewsHub />
              </div>
            )}
            {activeView === 'videos' && <VideoGallery />}
            {activeView === 'teams' && <TeamsGallery />}
          </>
        )}
      </main>

      {/* Premium Subscription Checkout Modal */}
      {showPremiumModal && (
        <div className="modal-overlay" onClick={() => setShowPremiumModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Flame size={20} fill="var(--color-accent)" /> Unlock MatchPulse PRO
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.2rem' }}>
              Enjoy real-time cricket coverage with custom analytics and advanced features.
            </p>

            {upgradeSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <CheckCircle size={54} color="var(--color-secondary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ color: '#FFF', fontSize: '1.15rem' }}>Upgrade Successful!</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>Welcome to MatchPulse PRO tier.</p>
              </div>
            ) : (
              <form onSubmit={handleUpgrade} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>🌟 Premium Perks:</div>
                  <div>• Ball-by-ball real-time WebSocket feeds (Enabled)</div>
                  <div>• Simulator manual override injection (Enabled)</div>
                  <div>• Dynamic Team Theme Switcher (Enabled)</div>
                  <div>• Zero third-party ad interruptions</div>
                </div>

                <div className="form-group">
                  <label>Card Number</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="4111 2222 3333 4444" 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value)} 
                      className="form-input" 
                      style={{ width: '100%', paddingLeft: '2.5rem' }} 
                      maxLength="19"
                      required 
                    />
                    <CreditCard size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--color-text-dark)' }} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      value={cardExpiry} 
                      onChange={(e) => setCardExpiry(e.target.value)} 
                      className="form-input" 
                      maxLength="5"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV Code</label>
                    <input 
                      type="password" 
                      placeholder="123" 
                      value={cardCVV} 
                      onChange={(e) => setCardCVV(e.target.value)} 
                      className="form-input" 
                      maxLength="3"
                      required 
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', padding: '0.8rem' }} disabled={isUpgrading}>
                  {isUpgrading ? 'Authorizing Payment...' : 'Unlock PRO Tier - $2.99 / mo'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
