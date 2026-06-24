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

      const titleAttr = $(el).attr('title') || '';
      
      let teamAName = 'Team A';
      let teamBName = 'Team B';
      let title = 'Match';
      let status = 'upcoming';
      let result = 'Match Scheduled';

      // Parse from title attribute
      const dashParts = titleAttr.split(' - ');
      if (dashParts.length > 1) {
        result = dashParts[1].trim();
      }

      const commaParts = dashParts[0].split(', ');
      const teamsText = commaParts[0]?.trim() || '';
      if (commaParts.length > 1) {
        title = commaParts.slice(1).join(', ').trim();
      } else {
        // Fallback to text inside anchor
        title = $(el).find('.text-xs').first().text().trim() || 'Match';
      }

      const vsParts = teamsText.split(' vs ');
      if (vsParts.length > 1) {
        teamAName = vsParts[0].trim();
        teamBName = vsParts[1].trim();
      } else {
        // Fallback if no " vs " in title
        const text = $(el).find('.text-white').first().text().trim() || $(el).text().trim();
        const textVs = text.split(' vs ');
        teamAName = textVs[0]?.trim() || 'Team A';
        teamBName = textVs[1]?.trim() || 'Team B';
      }

      // Determine Status
      const resultLower = result.toLowerCase();
      if (resultLower.includes('won') || resultLower.includes('won by') || resultLower.includes('complete') || resultLower.includes('abandon') || resultLower.includes('no result') || resultLower.includes('draw') || resultLower.includes('won by innings')) {
        status = 'completed';
      } else if (resultLower.includes('preview') || resultLower.includes('upcoming') || resultLower.includes('starts')) {
        status = 'upcoming';
      } else {
        status = 'live';
      }

      const teamAShort = teamAName.substring(0, 3).toUpperCase();
      const teamBShort = teamBName.substring(0, 3).toUpperCase();

      const seriesHeader = $(el).closest('div').parent().parent().find('a[href*="/cricket-series/"]').first().text().trim() ||
                           $(el).closest('div').parent().parent().find('a').first().text().trim() ||
                           'Cricket Series';

      const teams = {
        teamA: { name: teamAName, shortName: teamAShort, squad: [], logo: '' },
        teamB: { name: teamBName, shortName: teamBShort, squad: [], logo: '' }
      };

      const scores = {
        teamA: { runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, declared: false },
        teamB: { runs: 0, wickets: 0, overs: 0, balls: 0, extras: 0, declared: false }
      };

      matches.push({
        externalSource: 'cricbuzz',
        externalId: matchId,
        series: seriesHeader,
        title,
        format: parseFormatFromText(href, seriesHeader, title),
        venue: 'Venue TBA',
        teams,
        scores,
        status,
        result,
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
    const scorecardUrl = `https://www.cricbuzz.com/live-cricket-scorecard/${externalId}`;
    const commentaryUrl = `https://www.cricbuzz.com/live-cricket-scores/${externalId}`;
    
    // Fetch both in parallel
    const [scRes, commRes] = await Promise.all([
      axios.get(scorecardUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        timeout: 10000
      }).catch(() => null),
      axios.get(commentaryUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
        timeout: 10000
      }).catch(() => null)
    ]);

    if (!scRes) return null;

    const $sc = cheerio.load(scRes.data);
    const $comm = commRes ? cheerio.load(commRes.data) : null;

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
      lastOver: [],
      extras: { teamA: 0, teamB: 0 },
      fow: { teamA: [], teamB: [] }
    };

    // 1. Parse Toss from Scorecard Match Facts
    let tossText = '';
    $sc('div.facts-row-grid').each((i, el) => {
      const text = $sc(el).text().trim();
      if (text.startsWith('Toss')) {
        tossText = text.replace(/^Toss/, '').trim();
      }
    });
    details.toss.text = tossText || 'Toss TBA';

    // 2. Parse Squads
    let squadA = [];
    let squadB = [];
    let nameA = '';
    let nameB = '';
    $sc('div.facts-row-grid').each((i, el) => {
      const text = $sc(el).text().trim().replace(/\s+/g, ' ');
      const match = text.match(/^(.+?)\s*squad(?:\s*Players|Players)\s*(.+?)(?:\s*Bench\s*(.+))?$/i);
      if (match) {
        const teamName = match[1].trim();
        const playersList = match[2].split(',').map(p => p.replace(/\(c\)|\(wk\)|\(c\/wk\)|\(sub\)/gi, '').trim());
        const benchList = match[3] ? match[3].split(',').map(p => p.replace(/\(c\)|\(wk\)|\(c\/wk\)|\(sub\)/gi, '').trim()) : [];
        const fullSquad = [...playersList, ...benchList];
        if (!nameA) {
          nameA = teamName;
          squadA = fullSquad;
        } else {
          nameB = teamName;
          squadB = fullSquad;
        }
      }
    });

    details.teams = {
      teamA: { name: nameA || 'Team A', shortName: (nameA || 'TMA').substring(0, 3).toUpperCase(), squad: squadA },
      teamB: { name: nameB || 'Team B', shortName: (nameB || 'TMB').substring(0, 3).toUpperCase(), squad: squadB }
    };

    // 3. Parse Innings Scores & battingFirst
    const inningsHeaders = $sc('div[id^="team-"][id*="-innings-"]');
    inningsHeaders.each((idx, el) => {
      const shortName = $sc(el).find('div.font-bold').first().text().trim();
      const fullName = $sc(el).find('div.hidden.tb\\:block.font-bold').text().trim() || shortName;
      const scoreStr = $sc(el).find('span.font-bold').text().trim();
      const overStrSpan = $sc(el).find('span.font-bold').next().text().trim();
      const score = parseScoreString(`${scoreStr} ${overStrSpan}`);
      
      let teamKey = 'teamA';
      if (nameA && fullName && fullName.toLowerCase().includes(nameA.toLowerCase())) {
        teamKey = 'teamA';
      } else if (nameB && fullName && fullName.toLowerCase().includes(nameB.toLowerCase())) {
        teamKey = 'teamB';
      } else if (idx === 0) {
        teamKey = 'teamA';
      } else {
        teamKey = 'teamB';
      }

      details.scores[teamKey] = score;
      if (idx === 0) {
        details.teams[teamKey].shortName = shortName;
        details.battingFirst = teamKey;
      } else {
        details.teams[teamKey].shortName = shortName;
      }
    });

    // 4. Parse Batting & Bowling Scorecards, Extras, FOW
    $sc('div[id^="scard-team-"]').each((idx, el) => {
      const containerId = $sc(el).attr('id');
      const inningsNum = containerId.endsWith('-2') ? 2 : 1;
      const prevHeader = $sc(el).prev();
      const shortName = prevHeader.find('div.font-bold').first().text().trim();
      const fullName = prevHeader.find('div.hidden.tb\\:block.font-bold').text().trim() || shortName;

      let batTeamKey = 'teamA';
      if (nameA && fullName && fullName.toLowerCase().includes(nameA.toLowerCase())) {
        batTeamKey = 'teamA';
      } else if (nameB && fullName && fullName.toLowerCase().includes(nameB.toLowerCase())) {
        batTeamKey = 'teamB';
      } else if (inningsNum === 1) {
        batTeamKey = details.battingFirst;
      } else {
        batTeamKey = details.battingFirst === 'teamA' ? 'teamB' : 'teamA';
      }

      // Parse batsmen rows
      $sc(el).children().eq(0).find('.scorecard-bat-grid').each((i, row) => {
        if (i === 0) return;
        const playerLink = $sc(row).find('a').first();
        if (playerLink.length === 0) return;
        
        const originalName = playerLink.text().trim();
        const name = originalName.replace(/\s*\((?:c|wk|c\/wk|sub)\)$/i, '').trim();
        const status = $sc(row).find('div[class*="text-cbTxtSec"]').text().trim();
        const runs = parseInt($sc(row).children().eq(1).text().trim()) || 0;
        const balls = parseInt($sc(row).children().eq(2).text().trim()) || 0;
        const fours = parseInt($sc(row).children().eq(3).text().trim()) || 0;
        const sixes = parseInt($sc(row).children().eq(4).text().trim()) || 0;
        const isOut = status !== 'batting' && status !== 'not out';
        
        details.batsmen.push({
          name,
          runs,
          balls,
          fours,
          sixes,
          isOut,
          howOut: isOut ? status : '',
          isStriker: originalName.includes('*'),
          isNonStriker: false
        });
      });

      // Parse Extras
      $sc(el).find('div.flex.justify-between').each((i, row) => {
        const text = $sc(row).find('div').first().text().trim();
        if (text === 'Extras') {
          const totalStr = $sc(row).find('span.font-bold').text().trim();
          details.extras[batTeamKey] = parseInt(totalStr) || 0;
        }
      });

      // Parse Fall of Wickets (FOW)
      $sc(el).find('.scorecard-fow-grid').each((i, row) => {
        const playerLink = $sc(row).find('a').first();
        if (playerLink.length === 0) return; // skip header row
        const playerName = playerLink.text().trim().replace(/\s*\((?:c|wk|c\/wk|sub)\)$/i, '').trim();
        const score = $sc(row).children().eq(1).text().trim();
        const over = $sc(row).children().eq(2).text().trim();
        
        details.fow[batTeamKey].push(`${score} (${playerName}, ${over} ov)`);
      });

      // Parse bowler rows
      $sc(el).children().eq(1).find('.scorecard-bowl-grid').each((i, row) => {
        if (i === 0) return;
        const playerLink = $sc(row).find('a').first();
        if (playerLink.length === 0) return;
        
        const name = playerLink.text().trim().replace(/\s*\((?:c|wk|c\/wk|sub)\)$/i, '').trim();
        const overs = parseFloat($sc(row).children().eq(1).text().trim()) || 0;
        const maidens = parseInt($sc(row).children().eq(2).text().trim()) || 0;
        const runs = parseInt($sc(row).children().eq(3).text().trim()) || 0;
        const wickets = parseInt($sc(row).children().eq(4).text().trim()) || 0;
        const economy = parseFloat($sc(row).children().eq(5).text().trim()) || 0.0;
        
        details.bowlers.push({
          name,
          overs,
          maidens,
          runs,
          wickets,
          economy,
          isActive: false
        });
      });
    });

    // 5. Parse Commentary page for live commentary and active batsman stars
    if ($comm) {
      let activeStriker = '';
      let activeBowler = '';
      
      $comm('div, span, td').each((i, el) => {
        const text = $comm(el).text().trim();
        if (text.endsWith('*') || text.includes('*')) {
          const cleaned = text.replace('*', '').replace(/\s*\((?:c|wk|c\/wk|sub)\)$/i, '').trim();
          if (details.batsmen.some(b => b.name === cleaned)) activeStriker = cleaned;
          else if (details.bowlers.some(b => b.name === cleaned)) activeBowler = cleaned;
        }
      });

      details.batsmen.forEach(b => {
        if (b.name === activeStriker) b.isStriker = true;
      });

      const battingBatsmen = details.batsmen.filter(b => !b.isOut);
      if (battingBatsmen.length >= 2) {
        if (activeStriker) {
          const nonStrikerObj = battingBatsmen.find(b => b.name !== activeStriker);
          if (nonStrikerObj) {
            details.currentNonStriker = nonStrikerObj.name;
            nonStrikerObj.isNonStriker = true;
          }
        } else {
          activeStriker = battingBatsmen[0].name;
          battingBatsmen[0].isStriker = true;
          details.currentNonStriker = battingBatsmen[1].name;
          battingBatsmen[1].isNonStriker = true;
        }
      } else if (battingBatsmen.length === 1) {
        activeStriker = battingBatsmen[0].name;
        battingBatsmen[0].isStriker = true;
      }
      
      details.currentStriker = activeStriker;

      if (activeBowler) {
        details.currentBowler = activeBowler;
        details.bowlers.forEach(b => {
          if (b.name === activeBowler) b.isActive = true;
        });
      }

      // Parse commentary
      const commentary = [];
      $comm('div, p, span').each((i, el) => {
        const text = $comm(el).text().trim();
        const match = text.match(/^(\d+\.[1-6])\s*(\d?)\s*(.+)$/);
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

      if (commentary.length > 0) {
        const currentOverComm = commentary.filter(c => Math.floor(c.over) === Math.floor(commentary[0].over));
        details.lastOver = currentOverComm.map(c => c.runs === 4 ? '4' : (c.runs === 6 ? '6' : (c.eventType === 'wicket' ? 'W' : String(c.runs)))).reverse();
      }
    }

    // 6. Check Match Status (live vs completed)
    let isCompleted = false;
    let resultText = '';
    $sc('div, p, span').each((i, el) => {
      const text = $sc(el).text().trim();
      if (text.includes('won by') || text.includes('won the match') || text.includes('Match abandoned') || text.includes('No result') || text.includes('won by innings')) {
        if (text.length > 10 && text.length < 100 && !resultText) {
          resultText = text;
          isCompleted = true;
        }
      }
    });

    if (isCompleted) {
      details.status = 'completed';
      details.result = resultText;
    } else {
      details.status = 'live';
      details.result = tossText ? `${tossText}` : 'Match in progress';
    }

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
