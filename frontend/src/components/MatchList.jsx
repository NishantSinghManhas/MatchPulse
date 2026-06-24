import React, { useState } from 'react';
import { Calendar, MapPin, Award, Radio } from 'lucide-react';

const MatchList = ({ matches, onSelectMatch, defaultFilter = 'all' }) => {
  const [filter, setFilter] = React.useState(defaultFilter);

  React.useEffect(() => {
    setFilter(defaultFilter);
  }, [defaultFilter]);

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    return match.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'live':
        return <span className="badge badge-live flex-row"><Radio size={12} className="logo-icon" /> Live</span>;
      case 'upcoming':
        return <span className="badge badge-upcoming">Upcoming</span>;
      case 'completed':
        return <span className="badge badge-completed">Completed</span>;
      default:
        return null;
    }
  };

  const getTeamScoreText = (match, teamKey) => {
    const isBattingNow = match.status === 'live' && 
      ((match.currentInnings === 1 && match.battingFirst === teamKey) ||
       (match.currentInnings === 2 && match.battingFirst !== teamKey));

    const score = match.scores && match.scores[teamKey];
    if (!score || (score.runs === 0 && score.wickets === 0 && score.overs === 0 && match.status === 'upcoming')) {
      return '';
    }

    return (
      <span className={`team-score ${isBattingNow ? 'active-bat' : ''}`}>
        {score.runs}/{score.wickets}
        <span className="team-overs" style={{ fontSize: '0.8rem', marginLeft: '0.2rem' }}>
          ({score.overs}.{score.balls || 0} ov)
        </span>
      </span>
    );
  };

  return (
    <div className="view-section">
      <div className="pulse-card" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.4rem' }}>Cricket Matches</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'live', 'upcoming', 'completed'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`btn ${filter === type ? 'btn-primary' : ''}`}
              style={{ textTransform: 'capitalize', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="pulse-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>No matches found in this category.</p>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map((match) => {
            const isLive = match.status === 'live';
            return (
              <div
                key={match._id}
                onClick={() => onSelectMatch(match._id)}
                className={`match-list-card ${isLive ? 'live-card' : ''}`}
              >
                <div>
                  <div className="card-top">
                    <div className="series-title" title={`${match.title} • ${match.series}`}>
                      <span style={{ color: 'var(--color-text-main)', fontWeight: 600 }}>{match.title}</span>
                      {match.series && (
                        <>
                          <span style={{ margin: '0 0.3rem', opacity: 0.6 }}>•</span>
                          <span>{match.series}</span>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      {match.format && (
                        <span className="badge badge-format">{match.format}</span>
                      )}
                      {getStatusBadge(match.status)}
                    </div>
                  </div>

                  {/* Team A Row */}
                  <div className="team-row">
                    <div className="team-info">
                      <div className="team-logo-placeholder">
                        {match.teams.teamA.shortName}
                      </div>
                      <span className="team-name">{match.teams.teamA.name}</span>
                    </div>
                    {getTeamScoreText(match, 'teamA')}
                  </div>

                  {/* Team B Row */}
                  <div className="team-row">
                    <div className="team-info">
                      <div className="team-logo-placeholder">
                        {match.teams.teamB.shortName}
                      </div>
                      <span className="team-name">{match.teams.teamB.name}</span>
                    </div>
                    {getTeamScoreText(match, 'teamB')}
                  </div>
                </div>

                <div className="card-footer">
                  <div className="match-result-text flex-row">
                    <Award size={14} />
                    <span>{match.result || 'Match starts soon'}</span>
                  </div>
                  <div className="match-venue flex-row">
                    <MapPin size={12} />
                    <span>{match.venue.split(',')[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MatchList;
