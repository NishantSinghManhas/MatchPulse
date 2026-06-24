import React, { useState } from 'react';
import { Newspaper, Calendar, Clock, X, MessageSquare, Heart } from 'lucide-react';

const NewsHub = () => {
  const [selectedArticle, setSelectedArticle] = useState(null);

  const articles = [
    {
      id: 1,
      tag: 'Breaking News',
      title: "Bumrah's Masterclass Five-Wicket Haul Demolishes Australia at MCG",
      summary: "In a stunning display of reverse swing, Jasprit Bumrah bags 5 for 24, giving India a commanding position on Day 2 of the final match.",
      date: 'June 23, 2026',
      readTime: '4 min read',
      author: 'Harsha Bhogle',
      comments: 142,
      likes: 850,
      content: `MELBOURNE — Speedster Jasprit Bumrah delivered a bowling performance for the ages on Day 2 at the Melbourne Cricket Ground, dismantling Australia's top and middle orders with an exquisite display of pace, movement, and deadly yorkers. 

Bumrah returned spectacular figures of 5 for 24 from 14.2 overs, orchestrating a monumental collapse as the hosts crumbled from a comfortable 142/2 to 189 all out. 

### The Spell of Destruction
The collapse began post-lunch when Bumrah induced a thick edge from Travis Head, who was looking dangerous at 54. What followed was a masterclass in modern fast bowling:
1. **The Set-up**: Bumrah worked Steve Smith over with three consecutive out-swingers before crashing one back in to trap him LBW.
2. **The Yorker**: A trademark toe-crushing yorker knocked over Mitchell Marsh's middle stump.
3. **The Mopping Up**: He cleaned up the tail in quick succession, leaving the MCG crowd stunned.

"The ball was keeping low, and I just focused on hitting the deck hard and maintaining discipline," Bumrah said at the close of play. India finished the day in a dominant position, leading by 198 runs with 8 wickets in hand in the second innings.`
    },
    {
      id: 2,
      tag: 'IPL 2026',
      title: "IPL Mega Auction 2026: RTM Rules and Player Retentions Confirmed",
      summary: "Franchises lock horns as the BCCI announces new Right-To-Match (RTM) card limits and maximum retention slots for the upcoming auction cycle.",
      date: 'June 22, 2026',
      readTime: '6 min read',
      author: 'Ravi Shastri',
      comments: 310,
      likes: 1240,
      content: `MUMBAI — The Governing Council of the Indian Premier League (IPL) has officially released the retention policies and rules for the highly anticipated 2026 Mega Auction. The announcement has sparked intense discussions among franchise executives regarding budget distributions and strategies.

### Key Highlights of the New Policy:
* **Max Retentions**: Teams can retain a maximum of 5 players through direct retention, RTM cards, or a combination of both.
* **Salary Cap Increments**: The total purse for each franchise has been increased to ₹120 Crore (approximately $14.5 million).
* **Right To Match (RTM)**: The RTM card returns with a twist — the highest bidder gets one final chance to increase their bid before the holding franchise can match.

Several top teams, including Mumbai Indians and Chennai Super Kings, are reportedly aligning their plans to secure key core players, while teams like Royal Challengers Bengaluru are looking to rebuild their squad from scratch around key marquee signings.`
    },
    {
      id: 3,
      tag: 'Player Update',
      title: "Virat Kohli Discusses Workload: 'I am taking it one series at a time'",
      summary: "In an exclusive chat, the legendary batsman hints at retiring from selected formats to prolong his career: 'It's about quality over quantity.'",
      date: 'June 20, 2026',
      readTime: '5 min read',
      author: 'Michael Atherton',
      comments: 98,
      likes: 670,
      content: `LONDON — At 37, Virat Kohli remains one of the fittest athletes in world cricket. However, the heavy toll of non-stop international cricket has led the superstar batsman to consider a more curated schedule to extend his playing career.

Speaking ahead of training at Lord's, Kohli opened up about his physical condition and career longevity.

"At this stage of my career, I have to listen to my body. It is no longer possible to play all three formats year-round with the same intensity. I want to give 100% whenever I put on the shirt, so it's about quality over quantity," Kohli explained.

Insiders suggest Kohli may step away from bilateral T20Is completely, focusing his efforts on Test matches and major ICC ODI events, including the upcoming Champions Trophy.`
    },
    {
      id: 4,
      tag: 'Injury News',
      title: "Elbow Fracture Rules South African Opener Out of India Tour",
      summary: "A crushing blow for the Proteas as Reeza Hendricks is ruled out of the upcoming bilateral series after being hit in the nets.",
      date: 'June 19, 2026',
      readTime: '3 min read',
      author: 'Graeme Smith',
      comments: 45,
      likes: 310,
      content: `JOHANNESBURG — South Africa's preparation for their upcoming limited-overs series against India has suffered a severe setback. In-form opening batsman Reeza Hendricks has been ruled out of the entire 3-match T20I and 3-match ODI tour following a net session injury.

Hendricks was struck on his left forearm by a rising delivery from a local net bowler during training on Tuesday. Subsequent X-ray scans revealed a hairline fracture in his left elbow.

### Team Statement:
"Reeza Hendricks has suffered a minor non-displaced fracture in his left elbow. He will require 4-6 weeks of rehabilitation and will unfortunately miss the series against India. We wish him a speedy recovery," the Cricket South Africa medical team announced.

Ryan Rickelton is expected to be called up as the replacement opener to join Quinton de Kock at the top of the order.`
    }
  ];

  return (
    <div className="view-section animate-entrance">
      {/* News Header Card */}
      <div className="pulse-card" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Newspaper className="logo-icon" size={20} />
        <h2 style={{ fontSize: '1.4rem' }}>Cricket News Hub</h2>
      </div>

      {/* Grid of News Cards */}
      <div className="news-grid">
        {articles.map((art) => (
          <div key={art.id} className="news-card" onClick={() => setSelectedArticle(art)}>
            <div className="news-img-placeholder">
              <span className="news-badge">{art.tag}</span>
              <Newspaper size={48} style={{ opacity: 0.15 }} />
            </div>
            
            <div className="news-card-content">
              <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.75rem', color: 'var(--color-text-dark)', marginBottom: '0.5rem' }}>
                <span className="flex-row"><Calendar size={12} /> {art.date}</span>
                <span className="flex-row"><Clock size={12} /> {art.readTime}</span>
              </div>
              <h3 className="news-title">{art.title}</h3>
              <p className="news-summary">{art.summary}</p>
              
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '1rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                <span>By {art.author}</span>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <span>❤️ {art.likes}</span>
                  <span>💬 {art.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)}>
          <div className="modal-content" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedArticle(null)} 
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <span className="badge badge-upcoming" style={{ marginBottom: '0.6rem', display: 'inline-block' }}>
              {selectedArticle.tag}
            </span>

            <h2 style={{ fontSize: '1.45rem', marginBottom: '0.8rem', lineHeight: '1.3' }}>
              {selectedArticle.title}
            </h2>

            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-dark)', marginBottom: '1.2rem', paddingBottom: '0.8rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span>Author: <strong style={{ color: 'var(--color-text-muted)' }}>{selectedArticle.author}</strong></span>
              <span>{selectedArticle.date}</span>
              <span>{selectedArticle.readTime}</span>
            </div>

            {/* Render article text with paragraph formatting */}
            <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text-main)', whiteSpace: 'pre-line' }}>
              {selectedArticle.content}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', gap: '1rem' }}>
              <button className="btn flex-row" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <Heart size={14} /> Like ({selectedArticle.likes})
              </button>
              <button className="btn flex-row" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                <MessageSquare size={14} /> Comment ({selectedArticle.comments})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsHub;
