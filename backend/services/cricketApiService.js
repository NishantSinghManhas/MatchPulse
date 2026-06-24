import axios from 'axios';
import * as cheerio from 'cheerio';

// Helper to parse scores from strings like "155-4 (20)" or "155/4 (20.3)"
const parseScoreString = (scoreStr) => {
  const result = { runs: 0, wickets: 0, overs: 0, balls: 0, declared: false };
  if (!scoreStr) return result;
  
  // Matches "Runs-Wickets (Overs.Balls)" or "Runs/Wickets (Overs.Balls)"
  const match = scoreStr.match(/^(\d+)(?:[\-/](\d+))?\s*(?:\(([\d.]+)\))?/);
  if (match) {
    result.runs = parseInt(match[1]) || 0;
    result.wickets = match[2] ? parseInt(match[2]) : 0;
    const oversStr = match[3] || '0';
    const oversFloat = parseFloat(oversStr);
    result.overs = Math.floor(oversFloat);
    result.balls = Math.round((oversFloat - result.overs) * 10);
  }
  return result;
};

// Helper to parse format from href, seriesName, or titleName
const parseFormatFromText = (href, seriesName, titleName) => {
  const combined = `${href || ''} ${seriesName || ''} ${titleName || ''}`.toLowerCase();
  if (combined.includes('t20i')) return 'T20I';
  if (combined.includes('t20')) return 'T20';
  if (combined.includes('odi')) return 'ODI';
  if (combined.includes('test')) return 'TEST';
  return 'T20'; // default
};

// Keyless Cricbuzz HTML Scraper
const scrapeCricbuzzMatches = async () => {
  try {
    const url = 'https://www.cricbuzz.com/cricket-match/live-scores';
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(html);
    const matches = [];

    $('a[href*="/live-cricket-scores/"]').each((idx, el) => {
      const href = $(el).attr('href');
      const idMatch = href.match(/\/live-cricket-scores\/(\d+)/);
      if (!idMatch) return;
      const matchId = idMatch[1];

      if (matches.some(m => m.externalId === matchId)) return;

      const seriesHeader = $(el).closest('div').parent().parent().find('a[href*="/cricket-series/"]').first().text().trim() ||
                           $(el).closest('div').parent().parent().find('a').first().text().trim() ||
                           'Cricket Series';

      const infoText = $(el).find('span.text-xs.text-cbTxtSec').first().text().trim();
      const infoParts = infoText.split('•');
      const title = infoParts[0]?.trim() || 'Match';
      const venue = infoParts[1]?.trim() || 'Venue TBA';

      const teamRows = $(el).find('.flex.items-center.gap-4.justify-between');
      if (teamRows.length < 2) return;

      const teams = {};
      const scores = {};

      // Team A
      const teamARow = teamRows.eq(0);
      const teamAName = teamARow.find('span.hidden.wb\\:block').text().trim() || teamARow.find('span').first().text().trim();
      const teamAShort = teamARow.find('span.block.wb\\:hidden').text().trim() || teamAName.substring(0, 3).toUpperCase();
      const teamAScoreStr = teamARow.find('span.font-medium').text().trim();
      teams.teamA = { name: teamAName, shortName: teamAShort, squad: [], logo: '' };
      scores.teamA = parseScoreString(teamAScoreStr);

      // Team B
      const teamBRow = teamRows.eq(1);
      const teamBName = teamBRow.find('span.hidden.wb\\:block').text().trim() || teamBRow.find('span').first().text().trim();
      const teamBShort = teamBRow.find('span.block.wb\\:hidden').text().trim() || teamBName.substring(0, 3).toUpperCase();
      const teamBScoreStr = teamBRow.find('span.font-medium').text().trim();
      teams.teamB = { name: teamBName, shortName: teamBShort, squad: [], logo: '' };
      scores.teamB = parseScoreString(teamBScoreStr);

      const statusSpan = $(el).find('span[class*="text-cb"]').last();
      const resultText = statusSpan.text().trim() || 'Match Scheduled';
      
      let status = 'upcoming';
      const className = statusSpan.attr('class') || '';
      if (className.includes('text-cbComplete')) {
        status = 'completed';
      } else if (className.includes('text-cbLive') || teamAScoreStr || teamBScoreStr) {
        status = 'live';
      }

      if (status === 'live' && className.includes('text-cbComplete')) {
        status = 'completed';
      }

      matches.push({
        externalSource: 'cricbuzz',
        externalId: matchId,
        series: seriesHeader,
        title,
        format: parseFormatFromText(href, seriesHeader, title),
        venue,
        teams,
        scores,
        status,
        result: resultText,
        date: new Date().toLocaleDateString()
      });
    });

    return matches;
  } catch (error) {
    console.error('Error scraping Cricbuzz matches list:', error.message);
    return [];
  }
};

// Scrape detailed commentary and scorecards for a single match
const scrapeCricbuzzMatchDetails = async (externalId) => {
  try {
    const url = `https://www.cricbuzz.com/live-cricket-scores/${externalId}`;
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    const $ = cheerio.load(html);
    const details = {
      toss: { winner: '', decision: '', text: '' },
      teams: {},
      scores: {},
      batsmen: [],
      bowlers: [],
      currentStriker: '',
      currentNonStriker: '',
      currentBowler: '',
      commentary: [],
      lastOver: []
    };

    // 1. Parse Toss Info
    let tossText = '';
    $('div, p, span').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('won the toss') || text.includes('opted to') || text.includes('opt to')) {
        if (text.length > 20 && text.length < 150 && !tossText) {
          tossText = text;
        }
      }
    });
    details.toss.text = tossText;

    // 2. Parse Playing XIs/Squads
    const playingXIs = {};
    $('div, p').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('(Playing XI):')) {
        const parts = text.split('(Playing XI):');
        const teamName = parts[0].trim();
        const players = parts[1].split(',').map(p => p.replace(/\(c\)|\(w\)/g, '').trim());
        playingXIs[teamName] = players;
      }
    });

    // 3. Parse Commentary Log (using Next.js class-agnostic pattern)
    const commentary = [];
    $('div, p, span').each((i, el) => {
      const text = $(el).text().trim();
      const match = text.match(/^(\d+\.[1-6])(\d?)(.+)$/);
      if (match && text.length < 300) {
        const overVal = parseFloat(match[1]);
        const runsScored = match[2] ? parseInt(match[2]) : 0;
        const commText = match[3].trim();

        if (commText.length > 4 && !/^\d+$/.test(commText)) {
          if (!commentary.some(c => c.over === overVal && c.text === commText)) {
            commentary.push({
              over: overVal,
              ball: Math.round((overVal - Math.floor(overVal)) * 10),
              runs: runsScored,
              eventType: commText.includes('OUT') || commText.includes('strikes') || commText.includes('wicket') ? 'wicket' : 
                         (runsScored === 4 || runsScored === 6 || commText.includes('FOUR') || commText.includes('SIX') ? 'boundary' : 'run'),
              text: commText
            });
          }
        }
      }
    });
    details.commentary = commentary;

    // 4. Parse Score Banner & Determine current batting team
    const pageText = $('body').text();
    const scoreMatch = pageText.match(/([A-Z]{2,5})\s*(\d+)-(\d+)\s*\((\d+)\.?(\d+)?\)/);
    
    let battingTeamAbbr = '';
    if (scoreMatch) {
      battingTeamAbbr = scoreMatch[1];
      const runs = parseInt(scoreMatch[2]) || 0;
      const wickets = parseInt(scoreMatch[3]) || 0;
      const overs = parseInt(scoreMatch[4]) || 0;
      const balls = parseInt(scoreMatch[5]) || 0;

      details.activeScore = { runs, wickets, overs, balls, battingTeamAbbr };
    }

    // 5. Build Squad lists and distinguish Batsmen vs Bowlers
    const teamNames = Object.keys(playingXIs);
    if (teamNames.length >= 2) {
      let teamAKey = 'teamA';
      let teamBKey = 'teamB';
      
      details.teams = {
        teamA: { name: teamNames[0], shortName: teamNames[0].substring(0, 3).toUpperCase(), squad: playingXIs[teamNames[0]] },
        teamB: { name: teamNames[1], shortName: teamNames[1].substring(0, 3).toUpperCase(), squad: playingXIs[teamNames[1]] }
      };

      // Determine which team is batting
      let battingTeamKey = 'teamA';
      if (battingTeamAbbr) {
        if (details.teams.teamB.shortName.includes(battingTeamAbbr) || battingTeamAbbr.includes(details.teams.teamB.shortName)) {
          battingTeamKey = 'teamB';
        }
      }
      
      const bowlingTeamKey = battingTeamKey === 'teamA' ? 'teamB' : 'teamA';
      details.battingFirst = battingTeamKey;

      // Extract statistics for all active players
      const battingSquad = details.teams[battingTeamKey].squad;
      const bowlingSquad = details.teams[bowlingTeamKey].squad;

      battingSquad.forEach(player => {
        const playerEl = $('div, span, td').filter(function() {
          const text = $(this).text().trim();
          return text === player || text === player + ' *' || text === player + '*';
        }).first();

        if (playerEl.length > 0) {
          const parent = playerEl.parent();
          const cells = parent.find('div, span, td').map((i, el) => $(el).text().trim()).get().filter(c => c !== '');
          const numbers = cells.filter(c => /^\d+(\.\d+)?$/.test(c));

          if (numbers.length >= 4) {
            const runs = parseInt(numbers[0]) || 0;
            const balls = parseInt(numbers[1]) || 0;
            const fours = parseInt(numbers[2]) || 0;
            const sixes = parseInt(numbers[3]) || 0;
            const isStriker = playerEl.text().includes('*');

            details.batsmen.push({
              name: player,
              runs,
              balls,
              fours,
              sixes,
              isOut: false,
              isStriker,
              isNonStriker: !isStriker
            });

            if (isStriker) details.currentStriker = player;
            else details.currentNonStriker = player;
          }
        }
      });

      // Handle bowling stats
      bowlingSquad.forEach(player => {
        const playerEl = $('div, span, td').filter(function() {
          const text = $(this).text().trim();
          return text === player || text === player + ' *' || text === player + '*';
        }).first();

        if (playerEl.length > 0) {
          const parent = playerEl.parent();
          const cells = parent.find('div, span, td').map((i, el) => $(el).text().trim()).get().filter(c => c !== '');
          const numbers = cells.filter(c => /^\d+(\.\d+)?$/.test(c));

          if (numbers.length >= 4) {
            const overs = parseFloat(numbers[0]) || 0;
            const maidens = parseInt(numbers[1]) || 0;
            const runs = parseInt(numbers[2]) || 0;
            const wickets = parseInt(numbers[3]) || 0;
            const economy = parseFloat(numbers[4]) || 0.0;
            const isActive = playerEl.text().includes('*');

            details.bowlers.push({
              name: player,
              overs,
              maidens,
              runs,
              wickets,
              economy,
              isActive
            });

            if (isActive) details.currentBowler = player;
          }
        }
      });
    }

    // 6. Last Over tracker (read from commentary)
    const currentOverComm = commentary.filter(c => c.over === Math.floor(commentary[0]?.over || 0));
    details.lastOver = currentOverComm.map(c => c.runs === 4 ? '4' : (c.runs === 6 ? '6' : (c.eventType === 'wicket' ? 'W' : String(c.runs)))).reverse();

    return details;
  } catch (error) {
    console.error(`Error scraping Cricbuzz match details for ${externalId}:`, error.message);
    return null;
  }
};

// CricAPI Integration Service (Premium API key option)
const fetchCricAPIMatches = async (apiKey) => {
  try {
    const url = `https://api.cricketdata.org/v1/currentMatches?apikey=${apiKey}`;
    const { data: response } = await axios.get(url, { timeout: 10000 });
    
    if (response.status !== 'success' || !response.data) {
      console.warn('CricAPI response unsuccessful:', response);
      return [];
    }

    return response.data.map(match => {
      // Parse scores
      const scoreA = parseScoreString(match.team1?.score);
      const scoreB = parseScoreString(match.team2?.score);

      const statusMap = {
        'live': 'live',
        'completed': 'completed',
        'upcoming': 'upcoming'
      };

      const status = statusMap[match.status?.toLowerCase()] || 
                     (match.team1?.score || match.team2?.score ? 'live' : 'upcoming');

      return {
        externalSource: 'cricapi',
        externalId: match.id,
        series: match.name?.split(' vs ')[0] || 'International Series',
        title: match.matchType?.toUpperCase() || 'Match',
        format: match.matchType?.toUpperCase() || 'T20',
        venue: match.venue || 'Venue TBA',
        teams: {
          teamA: { name: match.team1?.name || 'Team A', shortName: match.team1?.name?.substring(0, 3).toUpperCase(), squad: [] },
          teamB: { name: match.team2?.name || 'Team B', shortName: match.team2?.name?.substring(0, 3).toUpperCase(), squad: [] }
        },
        scores: {
          teamA: scoreA,
          teamB: scoreB
        },
        status,
        result: match.status || 'Match Scheduled',
        date: match.date || new Date().toLocaleDateString()
      };
    });
  } catch (error) {
    console.error('Error fetching CricAPI matches:', error.message);
    return [];
  }
};

export const cricketApiService = {
  async getLiveMatches() {
    const apiKey = process.env.CRICKET_API_KEY;
    if (apiKey) {
      console.log('Fetching live scores via CricAPI...');
      return await fetchCricAPIMatches(apiKey);
    } else {
      console.log('Fetching live scores via Cricbuzz scraper...');
      return await scrapeCricbuzzMatches();
    }
  },

  async getMatchDetails(externalId) {
    // CricAPI does not have ball-by-ball commentary in free tier, so we use scraper for details!
    return await scrapeCricbuzzMatchDetails(externalId);
  }
};
