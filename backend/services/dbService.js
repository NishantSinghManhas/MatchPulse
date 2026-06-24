import fs from 'fs';
import path from 'path';
import Match from '../models/Match.js';
import { getDbStatus } from '../config/db.js';

const JSON_FILE_PATH = path.resolve('matches_db.json');

// Read from JSON file
const readJSON = () => {
  try {
    if (!fs.existsSync(JSON_FILE_PATH)) {
      fs.writeFileSync(JSON_FILE_PATH, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(JSON_FILE_PATH, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading json DB', error);
    return [];
  }
};

// Write to JSON file
const writeJSON = (data) => {
  try {
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing json DB', error);
  }
};

export const dbService = {
  async getMatches() {
    if (getDbStatus()) {
      return await Match.find().sort({ updatedAt: -1 });
    } else {
      const data = readJSON();
      return [...data].sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    }
  },

  async getMatchById(id) {
    if (getDbStatus()) {
      try {
        return await Match.findById(id);
      } catch (err) {
        return null;
      }
    } else {
      const data = readJSON();
      const idStr = String(id);
      return data.find(m => String(m._id) === idStr) || null;
    }
  },

  async createMatch(matchData) {
    if (getDbStatus()) {
      const newMatch = new Match(matchData);
      return await newMatch.save();
    } else {
      const data = readJSON();
      const newMatch = JSON.parse(JSON.stringify(matchData));
      
      newMatch._id = 'mock_' + Math.random().toString(36).substring(2, 11);
      newMatch.createdAt = new Date().toISOString();
      newMatch.updatedAt = new Date().toISOString();
      
      // Seed default properties if they don't exist
      if (!newMatch.status) newMatch.status = 'upcoming';
      if (!newMatch.currentInnings) newMatch.currentInnings = 1;
      if (!newMatch.scores) {
        newMatch.scores = {
          teamA: { runs: 0, wickets: 0, overs: 0, balls: 0, declared: false },
          teamB: { runs: 0, wickets: 0, overs: 0, balls: 0, declared: false }
        };
      }
      if (!newMatch.batsmen) newMatch.batsmen = [];
      if (!newMatch.bowlers) newMatch.bowlers = [];
      if (!newMatch.commentary) newMatch.commentary = [];
      if (!newMatch.lastOver) newMatch.lastOver = [];
      
      data.push(newMatch);
      writeJSON(data);
      return newMatch;
    }
  },

  async updateMatch(id, updateData) {
    if (getDbStatus()) {
      try {
        return await Match.findByIdAndUpdate(id, updateData, { new: true });
      } catch (err) {
        console.error('Error updating mongoose doc', err);
        return null;
      }
    } else {
      const data = readJSON();
      const idStr = String(id);
      const matchIndex = data.findIndex(m => String(m._id) === idStr);
      if (matchIndex === -1) return null;

      const current = data[matchIndex];
      
      // Deep merge selected fields
      const merged = { ...current };
      
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          if (key === 'scores' && updateData.scores) {
            merged.scores = {
              teamA: { ...merged.scores.teamA, ...updateData.scores.teamA },
              teamB: { ...merged.scores.teamB, ...updateData.scores.teamB }
            };
          } else if (Array.isArray(updateData[key])) {
            // Arrays (commentary, batsmen, bowlers, lastOver) can be replaced
            merged[key] = JSON.parse(JSON.stringify(updateData[key]));
          } else if (typeof updateData[key] === 'object' && updateData[key] !== null) {
            merged[key] = { ...merged[key], ...updateData[key] };
          } else {
            merged[key] = updateData[key];
          }
        }
      });
      
      merged.updatedAt = new Date().toISOString();
      data[matchIndex] = merged;
      writeJSON(data);
      return merged;
    }
  },

  async deleteMatch(id) {
    if (getDbStatus()) {
      try {
        return await Match.findByIdAndDelete(id);
      } catch (err) {
        return null;
      }
    } else {
      const data = readJSON();
      const idStr = String(id);
      const filtered = data.filter(m => String(m._id) !== idStr);
      writeJSON(filtered);
      return { success: true };
    }
  }
};
