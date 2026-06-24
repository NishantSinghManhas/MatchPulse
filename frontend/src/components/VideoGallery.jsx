import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, X, Tv, Film } from 'lucide-react';

const VideoGallery = () => {
  const [activeVideo, setActiveVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const videos = [
    {
      id: 1,
      title: "Virat Kohli's Masterclass: 82* (53) vs Pakistan Highlights",
      duration: "12:40",
      views: "2.4M views",
      date: "3 days ago",
      description: "Relive one of the greatest T20 innings ever played in cricket history. Virat Kohli guides India from a precarious position to a legendary win against Pakistan at the MCG."
    },
    {
      id: 2,
      title: "Dhoni finishes it off in style! 2011 World Cup Winning Six",
      duration: "05:15",
      views: "10.8M views",
      date: "4 years ago",
      description: "Relive the iconic moment as MS Dhoni strikes the winning six off Nuwan Kulasekara to end India's 28-year wait for an ICC World Cup title at Wankhede."
    },
    {
      id: 3,
      title: "Ashes 2026: Pat Cummins' Game-Winning Bowled Spell at Lord's",
      duration: "08:22",
      views: "850K views",
      date: "2 weeks ago",
      description: "Watch Australia captain Pat Cummins strike thrice in consecutive overs with high-speed reverse-swing deliveries to seal the second Test of the Ashes series."
    },
    {
      id: 4,
      title: "Gravity Defied! Top 10 Boundary Line Catches of the Decade",
      duration: "10:05",
      views: "1.2M views",
      date: "1 month ago",
      description: "A compilation of spectacular athletic feats on the boundary rope, including relay catches, leaping intercepts, and diving boundary saves."
    }
  ];

  // Simulate progress bar movement when playing
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1.5;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleOpenVideo = (video) => {
    setActiveVideo(video);
    setIsPlaying(true);
    setProgress(0);
  };

  const handleCloseVideo = () => {
    setActiveVideo(null);
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="view-section animate-entrance">
      {/* Page Header */}
      <div className="pulse-card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Tv className="logo-icon" size={20} />
        <h2 style={{ fontSize: '1.4rem' }}>Cricket Video Highlights</h2>
      </div>

      {/* Video Cards Grid */}
      <div className="video-grid">
        {videos.map((vid) => (
          <div key={vid.id} className="video-card" onClick={() => handleOpenVideo(vid)}>
            <div className="video-thumb-container">
              <Film size={40} style={{ opacity: 0.1 }} />
              <div className="video-play-overlay">
                <div className="video-play-btn">
                  <Play fill="#000" size={20} style={{ marginLeft: '2px' }} />
                </div>
              </div>
              <span className="video-duration">{vid.duration}</span>
            </div>

            <div className="video-meta">
              <h3 className="video-title">{vid.title}</h3>
              <p className="video-desc">{vid.views} • {vid.date}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive Mock Video Player Modal */}
      {activeVideo && (
        <div className="modal-overlay" onClick={handleCloseVideo}>
          <div className="modal-content" style={{ maxWidth: '750px', background: '#090C12', padding: '1.5rem' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={handleCloseVideo} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', zIndex: 10 }}
            >
              <X size={20} />
            </button>

            {/* Video Screen Layout */}
            <div style={{
              background: '#000',
              height: '350px',
              borderRadius: '12px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255,255,255,0.05)',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <Film size={80} style={{ opacity: 0.05, color: 'var(--color-primary)' }} />
              
              {/* Spinning visual bar when playing to show active video */}
              {isPlaying ? (
                <div style={{ position: 'absolute', width: '80px', height: '80px', border: '4px solid transparent', borderTopColor: 'var(--color-primary)', borderBottomColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 2s linear infinite' }}></div>
              ) : (
                <div style={{ position: 'absolute', fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                  Video Paused. Press Play.
                </div>
              )}
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

              {/* Player Bottom Control Deck */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                padding: '0.8rem 1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                {/* Scrub Progress Bar */}
                <div style={{
                  height: '4px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  position: 'relative'
                }} onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickedPercent = ((e.clientX - rect.left) / rect.width) * 100;
                  setProgress(clickedPercent);
                }}>
                  <div style={{
                    width: `${progress}%`,
                    height: '100%',
                    background: 'var(--color-primary)',
                    borderRadius: '2px',
                    boxShadow: '0 0 8px var(--color-primary)'
                  }}></div>
                </div>

                {/* Control Buttons Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}
                    >
                      {isPlaying ? <Pause size={18} fill="#FFF" /> : <Play size={18} fill="#FFF" />}
                    </button>
                    <button style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                      <Volume2 size={18} />
                    </button>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      {Math.floor(progress / 10)}:{(Math.floor(progress) % 10)}0 / {activeVideo.duration}
                    </span>
                  </div>
                  <button style={{ background: 'none', border: 'none', color: '#FFF', cursor: 'pointer' }}>
                    <Maximize size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Descriptions */}
            <div style={{ padding: '0.4rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '0.6rem' }}>{activeVideo.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dark)', marginBottom: '0.8rem' }}>
                {activeVideo.views} • Uploaded {activeVideo.date}
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                {activeVideo.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGallery;
