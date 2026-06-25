import React, { useState } from 'react';
import { Trophy, Calendar, Medal, Users, ShieldAlert, Award, Star } from 'lucide-react';

const Tournaments = () => {
  const [activeTournament, setActiveTournament] = useState('ipl'); // 'ipl' | 'wc'
  const [activeSubTab, setActiveSubTab] = useState('points'); // 'points' | 'stats' | 'fixtures'

  const iplPointsTable = [
    { rank: 1, name: 'Mumbai Indians', short: 'MI', played: 14, won: 10, lost: 4, nrr: '+0.582', pts: 20 },
    { rank: 2, name: 'Chennai Super Kings', short: 'CSK', played: 14, won: 9, lost: 5, nrr: '+0.421', pts: 18 },
    { rank: 3, name: 'Kolkata Knight Riders', short: 'KKR', played: 14, won: 9, lost: 5, nrr: '+0.312', pts: 18 },
    { rank: 4, name: 'Rajasthan Royals', short: 'RR', played: 14, won: 8, lost: 6, nrr: '+0.128', pts: 16 },
    { rank: 5, name: 'Royal Challengers Bengaluru', short: 'RCB', played: 14, won: 7, lost: 7, nrr: '-0.045', pts: 14 },
    { rank: 6, name: 'Gujarat Titans', short: 'GT', played: 14, won: 7, lost: 7, nrr: '-0.102', pts: 14 },
    { rank: 7, name: 'Sunrisers Hyderabad', short: 'SRH', played: 14, won: 6, lost: 8, nrr: '-0.198', pts: 12 },
    { rank: 8, name: 'Delhi Capitals', short: 'DC', played: 14, won: 5, lost: 9, nrr: '-0.340', pts: 10 },
    { rank: 9, name: 'Lucknow Super Giants', short: 'LSG', played: 14, won: 5, lost: 9, nrr: '-0.420', pts: 10 },
    { rank: 10, name: 'Punjab Kings', short: 'PBKS', played: 14, won: 4, lost: 10, nrr: '-0.510', pts: 8 }
  ];

  const iplOrangeCap = [
    { rank: 1, name: 'Shubman Gill', team: 'GT', runs: 680, matches: 14, avg: '56.67', sr: '148.5' },
    { rank: 2, name: 'Virat Kohli', team: 'RCB', runs: 640, matches: 14, avg: '53.33', sr: '144.2' },
    { rank: 3, name: 'Ruturaj Gaikwad', team: 'CSK', runs: 590, matches: 14, avg: '49.17', sr: '139.8' },
    { rank: 4, name: 'Yashasvi Jaiswal', team: 'RR', runs: 575, matches: 13, avg: '47.92', sr: '159.2' },
    { rank: 5, name: 'Heinrich Klaasen', team: 'SRH', runs: 540, matches: 14, avg: '54.00', sr: '172.6' }
  ];

  const iplPurpleCap = [
    { rank: 1, name: 'Jasprit Bumrah', team: 'MI', wickets: 24, matches: 14, econ: '6.45', avg: '16.42' },
    { rank: 2, name: 'Yuzvendra Chahal', team: 'RR', wickets: 21, matches: 14, econ: '7.85', avg: '19.20' },
    { rank: 3, name: 'Rashid Khan', team: 'GT', wickets: 19, matches: 14, econ: '6.90', avg: '21.05' },
    { rank: 4, name: 'Matheesha Pathirana', team: 'CSK', wickets: 18, matches: 12, econ: '7.30', avg: '17.80' },
    { rank: 5, name: 'Harshal Patel', team: 'PBKS', wickets: 18, matches: 14, econ: '8.40', avg: '23.40' }
  ];

  const wcStandings = {
    groupA: [
      { rank: 1, name: 'India', short: 'IND', played: 4, won: 4, lost: 0, nrr: '+1.850', pts: 8 },
      { rank: 2, name: 'USA', short: 'USA', played: 4, won: 2, lost: 1, nrr: '+0.120', pts: 5 },
      { rank: 3, name: 'Pakistan', short: 'PAK', played: 4, won: 2, lost: 2, nrr: '+0.294', pts: 4 },
      { rank: 4, name: 'Canada', short: 'CAN', played: 4, won: 1, lost: 3, nrr: '-0.950', pts: 2 },
      { rank: 5, name: 'Ireland', short: 'IRE', played: 4, won: 0, lost: 3, nrr: '-1.290', pts: 1 }
    ],
    groupB: [
      { rank: 1, name: 'Australia', short: 'AUS', played: 4, won: 4, lost: 0, nrr: '+2.100', pts: 8 },
      { rank: 2, name: 'England', short: 'ENG', played: 4, won: 2, lost: 1, nrr: '+1.210', pts: 5 },
      { rank: 3, name: 'Scotland', short: 'SCO', played: 4, won: 2, lost: 1, nrr: '+1.155', pts: 5 },
      { rank: 4, name: 'Namibia', short: 'NAM', played: 4, won: 1, lost: 3, nrr: '-1.450', pts: 2 },
      { rank: 5, name: 'Oman', short: 'OMA', played: 4, won: 0, lost: 4, nrr: '-3.050', pts: 0 }
    ]
  };

  const fixtures = {
    ipl: [
      { id: 101, match: 'Kolkata Knight Riders vs Mumbai Indians', venue: 'Eden Gardens, Kolkata', date: 'June 28, 2026', time: '7:30 PM IST', status: 'upcoming' },
      { id: 102, match: 'Chennai Super Kings vs Rajasthan Royals', venue: 'M. A. Chidambaram Stadium, Chennai', date: 'June 29, 2026', time: '7:30 PM IST', status: 'upcoming' },
      { id: 103, match: 'Royal Challengers Bengaluru vs Delhi Capitals', venue: 'M. Chinnaswamy Stadium, Bengaluru', date: 'June 30, 2026', time: '7:30 PM IST', status: 'upcoming' }
    ],
    wc: [
      { id: 201, match: 'India vs England (Semi Final 1)', venue: 'Providence Stadium, Guyana', date: 'June 26, 2026', time: '8:00 PM IST', status: 'upcoming' },
      { id: 202, match: 'Australia vs South Africa (Semi Final 2)', venue: 'Brian Lara Stadium, Trinidad', date: 'June 27, 2026', time: '6:00 AM IST', status: 'upcoming' },
      { id: 203, match: 'TBD vs TBD (World Cup Final)', venue: 'Kensington Oval, Barbados', date: 'June 29, 2026', time: '7:30 PM IST', status: 'upcoming' }
    ]
  };

  return (
    <div className="view-section animate-entrance">
      {/* 1. Header Tab Deck */}
      <div className="pulse-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }} className="flex-row">
            <Trophy size={20} className="logo-icon" /> Tournaments Center
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Browse points tables, standings, player caps, and fixtures.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button
            onClick={() => { setActiveTournament('ipl'); setActiveSubTab('points'); }}
            className={`btn ${activeTournament === 'ipl' ? 'btn-primary' : ''}`}
            style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
          >
            IPL 2026
          </button>
          <button
            onClick={() => { setActiveTournament('wc'); setActiveSubTab('points'); }}
            className={`btn ${activeTournament === 'wc' ? 'btn-primary' : ''}`}
            style={{ padding: '0.4rem 1.2rem', fontSize: '0.85rem' }}
          >
            T20 World Cup
          </button>
        </div>
      </div>

      {/* 2. Subtabs deck */}
      <div className="pulse-card">
        <div className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
          <button
            className={`tab-btn ${activeSubTab === 'points' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('points')}
          >
            Standings & Points Table
          </button>
          {activeTournament === 'ipl' && (
            <button
              className={`tab-btn ${activeSubTab === 'stats' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('stats')}
            >
              Orange & Purple Caps
            </button>
          )}
          <button
            className={`tab-btn ${activeSubTab === 'fixtures' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('fixtures')}
          >
            Fixtures & Schedule
          </button>
        </div>

        {/* 3. Render content depending on active sub-tab */}
        {activeSubTab === 'points' && (
          <div>
            {activeTournament === 'ipl' ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="rankings-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>Rank</th>
                      <th>Team</th>
                      <th className="text-right">P</th>
                      <th className="text-right">W</th>
                      <th className="text-right">L</th>
                      <th className="text-right">NRR</th>
                      <th className="text-right">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iplPointsTable.map((team, idx) => (
                      <tr key={team.short} style={{ background: idx < 4 ? 'rgba(0, 240, 255, 0.015)' : 'none' }}>
                        <td>
                          <span style={{ fontWeight: idx < 4 ? '700' : '400', color: idx < 4 ? 'var(--color-primary)' : 'inherit' }}>
                            {team.rank}
                          </span>
                        </td>
                        <td>
                          <div className="flex-row">
                            <div className="team-logo-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.65rem' }}>
                              {team.short}
                            </div>
                            <span style={{ fontWeight: idx < 4 ? '600' : '500', color: idx < 4 ? '#FFF' : 'inherit' }}>{team.name}</span>
                            {idx < 4 && <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', background: 'rgba(0, 240, 255, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Q</span>}
                          </div>
                        </td>
                        <td className="text-right">{team.played}</td>
                        <td className="text-right" style={{ color: '#10B981', fontWeight: 600 }}>{team.won}</td>
                        <td className="text-right" style={{ color: 'var(--color-danger)' }}>{team.lost}</td>
                        <td className="text-right">{team.nrr}</td>
                        <td className="text-right" style={{ fontWeight: '700', color: 'var(--color-secondary)' }}>{team.pts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // World Cup Group tables
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {['groupA', 'groupB'].map((groupKey) => (
                  <div key={groupKey}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-accent)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {groupKey === 'groupA' ? 'Group A Standings' : 'Group B Standings'}
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="rankings-table">
                        <thead>
                          <tr>
                            <th style={{ width: '50px' }}>Rank</th>
                            <th>Team</th>
                            <th className="text-right">P</th>
                            <th className="text-right">W</th>
                            <th className="text-right">L</th>
                            <th className="text-right">NRR</th>
                            <th className="text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wcStandings[groupKey].map((team, idx) => (
                            <tr key={team.short} style={{ background: idx < 2 ? 'rgba(0, 240, 255, 0.015)' : 'none' }}>
                              <td>
                                <span style={{ fontWeight: idx < 2 ? '700' : '400', color: idx < 2 ? 'var(--color-primary)' : 'inherit' }}>
                                  {team.rank}
                                </span>
                              </td>
                              <td>
                                <div className="flex-row">
                                  <div className="team-logo-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.65rem' }}>
                                    {team.short}
                                  </div>
                                  <span style={{ fontWeight: idx < 2 ? '600' : '500', color: idx < 2 ? '#FFF' : 'inherit' }}>{team.name}</span>
                                  {idx < 2 && <span style={{ fontSize: '0.6rem', color: 'var(--color-primary)', background: 'rgba(0, 240, 255, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Super 8</span>}
                                </div>
                              </td>
                              <td className="text-right">{team.played}</td>
                              <td className="text-right" style={{ color: '#10B981', fontWeight: 600 }}>{team.won}</td>
                              <td className="text-right" style={{ color: 'var(--color-danger)' }}>{team.lost}</td>
                              <td className="text-right">{team.nrr}</td>
                              <td className="text-right" style={{ fontWeight: '700', color: 'var(--color-secondary)' }}>{team.pts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'stats' && activeTournament === 'ipl' && (
          <div className="tracker-row">
            {/* Orange Cap Section */}
            <div className="batsmen-tracker">
              <h3 style={{ fontSize: '1rem', color: '#FFA500', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <Medal size={18} fill="#FFA500" /> Orange Cap (Most Runs)
              </h3>
              <table className="tracker-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Batsman</th>
                    <th className="text-right">Runs</th>
                    <th className="text-right">Avg</th>
                    <th className="text-right">SR</th>
                  </tr>
                </thead>
                <tbody>
                  {iplOrangeCap.map((b, idx) => (
                    <tr key={b.name} style={{ fontWeight: idx === 0 ? '700' : '400', color: idx === 0 ? '#FFF' : 'var(--color-text-muted)' }}>
                      <td style={{ padding: '0.6rem 0' }}>
                        <div className="flex-row">
                          <span style={{ minWidth: '15px' }}>{idx + 1}.</span>
                          <span>{b.name} <strong style={{ fontSize: '0.75rem', opacity: 0.6 }}>({b.team})</strong></span>
                        </div>
                      </td>
                      <td className="text-right" style={{ fontWeight: '700', color: '#FFA500' }}>{b.runs}</td>
                      <td className="text-right">{b.avg}</td>
                      <td className="text-right">{b.sr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Purple Cap Section */}
            <div className="bowlers-tracker">
              <h3 style={{ fontSize: '1rem', color: '#8A2BE2', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <Medal size={18} fill="#8A2BE2" /> Purple Cap (Most Wickets)
              </h3>
              <table className="tracker-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Bowler</th>
                    <th className="text-right">Wkts</th>
                    <th className="text-right">Econ</th>
                    <th className="text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {iplPurpleCap.map((bowler, idx) => (
                    <tr key={bowler.name} style={{ fontWeight: idx === 0 ? '700' : '400', color: idx === 0 ? '#FFF' : 'var(--color-text-muted)' }}>
                      <td style={{ padding: '0.6rem 0' }}>
                        <div className="flex-row">
                          <span style={{ minWidth: '15px' }}>{idx + 1}.</span>
                          <span>{bowler.name} <strong style={{ fontSize: '0.75rem', opacity: 0.6 }}>({bowler.team})</strong></span>
                        </div>
                      </td>
                      <td className="text-right" style={{ fontWeight: '700', color: '#8A2BE2' }}>{bowler.wickets}</td>
                      <td className="text-right">{bowler.econ}</td>
                      <td className="text-right">{bowler.avg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'fixtures' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {fixtures[activeTournament].map((fixture) => (
              <div key={fixture.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-subtle)', borderRadius: '12px', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FFF' }}>{fixture.match}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    {fixture.venue}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  <div style={{ color: 'var(--color-primary)', fontWeight: 600 }} className="flex-row"><Calendar size={12} /> {fixture.date}</div>
                  <div style={{ color: 'var(--color-text-dark)', marginTop: '0.1rem' }}>{fixture.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
