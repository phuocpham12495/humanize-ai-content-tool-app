const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/humanize.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    parameters_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS session_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    original_text TEXT NOT NULL,
    humanized_text TEXT,
    settings_json TEXT,
    scores_json TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default configs
const defaultConfigs = [
  {
    name: 'Make it Human',
    parameters: {
      writingStyle: 'casual',
      emotionalDepth: 70,
      imperfections: true,
      antiAIDetector: true,
      persona: 'beginner',
      culturalTone: 'neutral',
      oneClickMode: 'human',
      description: 'Transform AI text into natural, human-sounding content with authentic voice and slight imperfections.'
    }
  },
  {
    name: 'Make it Viral',
    parameters: {
      writingStyle: 'storytelling',
      platform: 'tiktok',
      emotionalDepth: 90,
      imperfections: false,
      antiAIDetector: true,
      persona: 'influencer',
      culturalTone: 'us',
      oneClickMode: 'viral',
      description: 'Optimize content for maximum shares and engagement with viral hooks and emotional triggers.'
    }
  },
  {
    name: 'Make it Controversial',
    parameters: {
      writingStyle: 'opinionated',
      platform: 'twitter',
      emotionalDepth: 85,
      imperfections: true,
      antiAIDetector: false,
      persona: 'skeptic',
      culturalTone: 'us',
      oneClickMode: 'controversial',
      description: 'Create thought-provoking content that sparks debate and drives engagement through controversy.'
    }
  },
  {
    name: 'Make it Relatable',
    parameters: {
      writingStyle: 'messy_human',
      platform: 'facebook',
      emotionalDepth: 80,
      imperfections: true,
      antiAIDetector: true,
      persona: 'beginner',
      culturalTone: 'neutral',
      oneClickMode: 'relatable',
      description: 'Make content feel deeply personal and relatable with real-life experiences and emotions.'
    }
  }
];

const insertConfig = db.prepare(`
  INSERT OR IGNORE INTO configs (name, parameters_json) VALUES (?, ?)
`);

const seedConfigs = db.transaction(() => {
  for (const config of defaultConfigs) {
    insertConfig.run(config.name, JSON.stringify(config.parameters));
  }
});

seedConfigs();

// Helper functions
const dbHelpers = {
  getConfigs: () => {
    const rows = db.prepare('SELECT * FROM configs ORDER BY id ASC').all();
    return rows.map(row => ({
      ...row,
      parameters: JSON.parse(row.parameters_json)
    }));
  },

  getConfigByName: (name) => {
    const row = db.prepare('SELECT * FROM configs WHERE name = ?').get(name);
    if (!row) return null;
    return { ...row, parameters: JSON.parse(row.parameters_json) };
  },

  saveHistory: (sessionId, originalText, humanizedText, settings, scores) => {
    const stmt = db.prepare(`
      INSERT INTO session_history (session_id, original_text, humanized_text, settings_json, scores_json)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      sessionId,
      originalText,
      humanizedText || null,
      settings ? JSON.stringify(settings) : null,
      scores ? JSON.stringify(scores) : null
    );
    return result.lastInsertRowid;
  },

  getHistory: (sessionId) => {
    const rows = db.prepare('SELECT * FROM session_history WHERE session_id = ? ORDER BY timestamp DESC').all(sessionId);
    return rows.map(row => ({
      ...row,
      settings: row.settings_json ? JSON.parse(row.settings_json) : null,
      scores: row.scores_json ? JSON.parse(row.scores_json) : null
    }));
  }
};

module.exports = { db, ...dbHelpers };
