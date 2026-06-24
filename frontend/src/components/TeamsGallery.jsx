import React, { useState } from 'react';
import { Users, Shield, Trophy, UserCheck } from 'lucide-react';

const TeamsGallery = () => {
  const [selectedTeam, setSelectedTeam] = useState('IND');

  const teamsData = [
    {
      code: 'IND',
      name: 'India',
      board: 'Board of Control for Cricket in India (BCCI)',
      achievements: ['ICC ODI World Cup: 1983, 2011', 'ICC T20 World Cup: 2007, 2024', 'ICC Champions Trophy: 2002, 2013'],
      captain: 'Rohit Sharma',
      coach: 'Rahul Dravid',
      squad: ["Rohit Sharma", "Virat Kohli", "Suryakumar Yadav", "Rishabh Pant", "Hardik Pandya", "Ravindra Jadeja", "Axar Patel", "Kuldeep Yadav", "Jasprit Bumrah", "Arshdeep Singh", "Mohammed Siraj"]
    },
    {
      code: 'AUS',
      name: 'Australia',
      board: 'Cricket Australia (CA)',
      achievements: ['ICC ODI World Cup: 1987, 1999, 2003, 2007, 2015, 2023', 'ICC T20 World Cup: 2021', 'ICC World Test Championship: 2021-2023'],
      captain: 'Mitchell Marsh',
      coach: 'Andrew McDonald',
      squad: ["Travis Head", "David Warner", "Mitchell Marsh", "Glenn Maxwell", "Marcus Stoinis", "Tim David", "Matthew Wade", "Pat Cummins", "Mitchell Starc", "Josh Hazlewood", "Adam Zampa"]
    },
    {
      code: 'ENG',
      name: 'England',
      board: 'England and Wales Cricket Board (ECB)',
      achievements: ['ICC ODI World Cup: 2019', 'ICC T20 World Cup: 2010, 2022'],
      captain: 'Jos Buttler',
      coach: 'Brendon McCullum',
      squad: ["Jos Buttler", "Phil Salt", "Will Jacks", "Jonny Bairstow", "Harry Brook", "Liam Livingstone", "Moeen Ali", "Sam Curran", "Jofra Archer", "Adil Rashid", "Mark Wood"]
    },
    {
      code: 'RSA',
      name: 'South Africa',
      board: 'Cricket South Africa (CSA)',
      achievements: ['ICC Champions Trophy: 1998'],
      captain: 'Aiden Markram',
      coach: 'Rob Walter',
      squad: ["Reeza Hendricks", "Quinton de Kock", "Aiden Markram", "Heinrich Klaasen", "David Miller", "Tristan Stubbs", "Marco Jansen", "Keshav Maharaj", "Kagiso Rabada", "Anrich Nortje", "Gerald Coetzee"]
    },
    {
      code: 'NZ',
      name: 'New Zealand',
      board: 'New Zealand Cricket (NZC)',
      achievements: ['ICC World Test Championship: 2019-2021', 'ICC KnockOut Trophy: 2000'],
      captain: 'Kane Williamson',
      coach: 'Gary Stead',
      squad: ["Devon Conway", "Rachin Ravindra", "Kane Williamson", "Daryl Mitchell", "Glenn Phillips", "Mark Chapman", "Mitchell Santner", "Matt Henry", "Tim Southee", "Lockie Ferguson", "Ish Sodhi"]
    },
    {
      code: 'PAK',
      name: 'Pakistan',
      board: 'Pakistan Cricket Board (PCB)',
      achievements: ['ICC ODI World Cup: 1992', 'ICC T20 World Cup: 2009', 'ICC Champions Trophy: 2017'],
      captain: 'Babar Azam',
      coach: 'Gary Kirsten',
      squad: ["Babar Azam", "Mohammad Rizwan", "Fakhar Zaman", "Saim Ayub", "Iftikhar Ahmed", "Shadab Khan", "Imad Wasim", "Shaheen Afridi", "Naseem Shah", "Haris Rauf", "Mohammad Amir"]
    }
  ];

  const activeTeam = teamsData.find(t => t.code === selectedTeam);

  return (
    <div className="view-section animate-entrance">
      {/* Page Header */}
      <div className="pulse-card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Users className="logo-icon" size={20} />
        <h2 style={{ fontSize: '1.4rem' }}>International Cricket Teams</h2>
      </div>

      <div className="match-detail-grid">
        {/* Teams Selector Sidebar */}
        <div className="pulse-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem', marginBottom: '0.5rem' }}>
            National Boards
          </h3>
          {teamsData.map((team) => (
            <button
              key={team.code}
              onClick={() => setSelectedTeam(team.code)}
              className={`btn ${selectedTeam === team.code ? 'btn-primary' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 1rem', fontSize: '0.9rem' }}
            >
              <span>{team.name}</span>
              <strong style={{ fontSize: '0.75rem', opacity: 0.7 }}>{team.code}</strong>
            </button>
          ))}
        </div>

        {/* Team Details Panel */}
        <div className="pulse-card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.6rem', color: '#FFF' }} className="flex-row">
                <Shield size={24} className="logo-icon" /> {activeTeam.name}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                {activeTeam.board}
              </p>
            </div>
            <div className="team-logo-placeholder" style={{ width: '48px', height: '48px', fontSize: '1.1rem', borderColor: 'var(--color-primary)' }}>
              {activeTeam.code}
            </div>
          </div>

          <div className="tracker-row">
            {/* Roster list */}
            <div className="batsmen-tracker">
              <div className="tracker-title flex-row">
                <UserCheck size={14} className="logo-icon" /> Lineup Roster (11)
              </div>
              <ul style={{ listStyle: 'none' }}>
                {activeTeam.squad.map((player, idx) => (
                  <li key={player} style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.02)', fontSize: '0.9rem', color: idx === 0 || player === activeTeam.captain ? '#FFF' : 'var(--color-text-muted)' }}>
                    {idx + 1}. {player} {player === activeTeam.captain && <span style={{ color: 'var(--color-accent)', fontSize: '0.75rem', marginLeft: '0.3rem' }}>(c)</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Achievements & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="bowlers-tracker" style={{ padding: '1rem' }}>
                <div className="tracker-title">Team Leadership</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
                  <div><strong>Captain:</strong> {activeTeam.captain}</div>
                  <div><strong>Head Coach:</strong> {activeTeam.coach}</div>
                </div>
              </div>

              <div className="bowlers-tracker" style={{ padding: '1rem' }}>
                <div className="tracker-title flex-row">
                  <Trophy size={14} style={{ color: 'var(--color-accent)' }} /> Key Silverwares
                </div>
                {activeTeam.achievements.length > 0 ? (
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {activeTeam.achievements.map((ach) => (
                      <li key={ach} style={{ fontSize: '0.85rem', color: 'var(--color-accent)', paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-accent)' }}>
                        {ach}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark)', fontStyle: 'italic' }}>None listed recently</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamsGallery;
