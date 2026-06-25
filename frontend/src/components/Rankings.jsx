import React, { useState } from 'react';
import { Award, ChevronRight, Star } from 'lucide-react';

const Rankings = () => {
  const [format, setFormat] = useState('t20'); // 'test', 'odi', 't20'
  const [category, setCategory] = useState('teams'); // 'teams', 'batsmen', 'bowlers'

  const rankingsData = {
    test: {
      teams: [
        { rank: 1, name: 'India', short: 'IND', rating: 122, points: 3450 },
        { rank: 2, name: 'Australia', short: 'AUS', rating: 118, points: 3120 },
        { rank: 3, name: 'England', short: 'ENG', rating: 115, points: 2980 },
        { rank: 4, name: 'South Africa', short: 'RSA', rating: 108, points: 2420 },
        { rank: 5, name: 'New Zealand', short: 'NZ', rating: 104, points: 2310 }
      ],
      batsmen: [
        { rank: 1, name: 'Joe Root', team: 'ENG', rating: 897 },
        { rank: 2, name: 'Kane Williamson', team: 'NZ', rating: 859 },
        { rank: 3, name: 'Steve Smith', team: 'AUS', rating: 818 },
        { rank: 4, name: 'Virat Kohli', team: 'IND', rating: 775 },
        { rank: 5, name: 'Travis Head', team: 'AUS', rating: 760 }
      ],
      bowlers: [
        { rank: 1, name: 'Jasprit Bumrah', team: 'IND', rating: 867 },
        { rank: 2, name: 'Ravichandran Ashwin', team: 'IND', rating: 840 },
        { rank: 3, name: 'Pat Cummins', team: 'AUS', rating: 821 },
        { rank: 4, name: 'Kagiso Rabada', team: 'RSA', rating: 812 },
        { rank: 5, name: 'Josh Hazlewood', team: 'AUS', rating: 806 }
      ],
      allrounders: [
        { rank: 1, name: 'Ravindra Jadeja', team: 'IND', rating: 455 },
        { rank: 2, name: 'Ravichandran Ashwin', team: 'IND', rating: 370 },
        { rank: 3, name: 'Shakib Al Hasan', team: 'BAN', rating: 332 },
        { rank: 4, name: 'Jason Holder', team: 'WI', rating: 280 },
        { rank: 5, name: 'Ben Stokes', team: 'ENG', rating: 272 }
      ]
    },
    odi: {
      teams: [
        { rank: 1, name: 'India', short: 'IND', rating: 121, points: 4110 },
        { rank: 2, name: 'Australia', short: 'AUS', rating: 116, points: 3820 },
        { rank: 3, name: 'South Africa', short: 'RSA', rating: 110, points: 3420 },
        { rank: 4, name: 'Pakistan', short: 'PAK', rating: 106, points: 3180 },
        { rank: 5, name: 'New Zealand', short: 'NZ', rating: 101, points: 2940 }
      ],
      batsmen: [
        { rank: 1, name: 'Babar Azam', team: 'PAK', rating: 824 },
        { rank: 2, name: 'Shubman Gill', team: 'IND', rating: 801 },
        { rank: 3, name: 'Virat Kohli', team: 'IND', rating: 768 },
        { rank: 4, name: 'Rohit Sharma', team: 'IND', rating: 746 },
        { rank: 5, name: 'Daryl Mitchell', team: 'NZ', rating: 728 }
      ],
      bowlers: [
        { rank: 1, name: 'Keshav Maharaj', team: 'RSA', rating: 716 },
        { rank: 2, name: 'Josh Hazlewood', team: 'AUS', rating: 688 },
        { rank: 3, name: 'Adam Zampa', team: 'AUS', rating: 686 },
        { rank: 4, name: 'Kuldeep Yadav', team: 'IND', rating: 682 },
        { rank: 5, name: 'Mohammed Siraj', team: 'IND', rating: 670 }
      ],
      allrounders: [
        { rank: 1, name: 'Mohammad Nabi', team: 'AFG', rating: 320 },
        { rank: 2, name: 'Shakib Al Hasan', team: 'BAN', rating: 292 },
        { rank: 3, name: 'Sikandar Raza', team: 'ZIM', rating: 287 },
        { rank: 4, name: 'Assad Vala', team: 'PNG', rating: 248 },
        { rank: 5, name: 'Mitchell Santner', team: 'NZ', rating: 240 }
      ]
    },
    t20: {
      teams: [
        { rank: 1, name: 'India', short: 'IND', rating: 266, points: 15430 },
        { rank: 2, name: 'Australia', short: 'AUS', rating: 256, points: 11250 },
        { rank: 3, name: 'England', short: 'ENG', rating: 252, points: 12420 },
        { rank: 4, name: 'West Indies', short: 'WI', rating: 250, points: 11680 },
        { rank: 5, name: 'South Africa', short: 'RSA', rating: 244, points: 10920 }
      ],
      batsmen: [
        { rank: 1, name: 'Suryakumar Yadav', team: 'IND', rating: 861 },
        { rank: 2, name: 'Phil Salt', team: 'ENG', rating: 802 },
        { rank: 3, name: 'Mohammad Rizwan', team: 'PAK', rating: 781 },
        { rank: 4, name: 'Babar Azam', team: 'PAK', rating: 755 },
        { rank: 5, name: 'Aiden Markram', team: 'RSA', rating: 740 }
      ],
      bowlers: [
        { rank: 1, name: 'Adil Rashid', team: 'ENG', rating: 726 },
        { rank: 2, name: 'Akeal Hosein', team: 'WI', rating: 687 },
        { rank: 3, name: 'Ravi Bishnoi', team: 'IND', rating: 681 },
        { rank: 4, name: 'Wanindu Hasaranga', team: 'SL', rating: 679 },
        { rank: 5, name: 'Rashid Khan', team: 'AFG', rating: 672 }
      ],
      allrounders: [
        { rank: 1, name: 'Hardik Pandya', team: 'IND', rating: 245 },
        { rank: 2, name: 'Wanindu Hasaranga', team: 'SL', rating: 228 },
        { rank: 3, name: 'Marcus Stoinis', team: 'AUS', rating: 211 },
        { rank: 4, name: 'Sikandar Raza', team: 'ZIM', rating: 208 },
        { rank: 5, name: 'Shakib Al Hasan', team: 'BAN', rating: 206 }
      ]
    }
  };

  const activeList = rankingsData[format][category];

  return (
    <div className="view-section animate-entrance">
      <div className="pulse-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }} className="flex-row">
            <Award size={20} className="logo-icon" /> ICC Player & Team Rankings
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
            Official ICC cricket ratings for international matches.
          </p>
        </div>

        {/* Format Selectors */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['test', 'odi', 't20'].map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`btn ${format === f ? 'btn-primary' : ''}`}
              style={{ textTransform: 'uppercase', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
            >
              {f === 't20' ? 'T20I' : f}
            </button>
          ))}
        </div>
      </div>

      <div className="pulse-card">
        {/* Category Selector Tabs */}
        <div className="tabs-nav" style={{ marginBottom: '1rem' }}>
          <button 
            className={`tab-btn ${category === 'teams' ? 'active' : ''}`} 
            onClick={() => setCategory('teams')}
          >
            Team Rankings
          </button>
          <button 
            className={`tab-btn ${category === 'batsmen' ? 'active' : ''}`} 
            onClick={() => setCategory('batsmen')}
          >
            Top Batsmen
          </button>
          <button 
            className={`tab-btn ${category === 'bowlers' ? 'active' : ''}`} 
            onClick={() => setCategory('bowlers')}
          >
            Top Bowlers
          </button>
          <button 
            className={`tab-btn ${category === 'allrounders' ? 'active' : ''}`} 
            onClick={() => setCategory('allrounders')}
          >
            All-Rounders
          </button>
        </div>

        {/* Rankings Table */}
        <table className="rankings-table">
          <thead>
            {category === 'teams' ? (
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Team Name</th>
                <th className="text-right">Points</th>
                <th className="text-right">Rating</th>
              </tr>
            ) : (
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Player</th>
                <th>Nation</th>
                <th className="text-right">Rating Points</th>
              </tr>
            )}
          </thead>
          <tbody>
            {activeList.map((item) => (
              <tr key={item.rank} style={{ background: item.rank === 1 ? 'rgba(255,215,0,0.01)' : 'none' }}>
                <td className="rankings-rank">
                  {item.rank === 1 ? (
                    <span className="flex-row" style={{ color: 'var(--color-accent)' }}>
                      <Star size={14} fill="var(--color-accent)" /> 1
                    </span>
                  ) : (
                    item.rank
                  )}
                </td>
                
                {category === 'teams' ? (
                  <>
                    <td>
                      <div className="flex-row">
                        <div className="team-logo-placeholder" style={{ width: '28px', height: '28px', fontSize: '0.65rem' }}>
                          {item.short}
                        </div>
                        <span style={{ fontWeight: '600' }}>{item.name}</span>
                      </div>
                    </td>
                    <td className="text-right" style={{ color: 'var(--color-text-muted)' }}>{item.points.toLocaleString()}</td>
                    <td className="text-right" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{item.rating}</td>
                  </>
                ) : (
                  <>
                    <td>
                      <span style={{ fontWeight: '600', color: '#FFF' }}>{item.name}</span>
                    </td>
                    <td>
                      <div className="flex-row">
                        <div className="team-logo-placeholder" style={{ width: '24px', height: '24px', fontSize: '0.6rem' }}>
                          {item.team}
                        </div>
                        <span>{item.team}</span>
                      </div>
                    </td>
                    <td className="text-right" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{item.rating}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-subtle)', borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <Star size={16} className="logo-icon" />
          <span>
            Rankings are updated dynamically after each international series. Upgrade to <strong>MatchPulse Premium</strong> to unlock full historical rating charts and projections!
          </span>
        </div>
      </div>
    </div>
  );
};

export default Rankings;
