// Uses Node.js built-in sqlite module (available since Node 22.5, stable in Node 24)
// No native compilation required — no Visual Studio C++ tools needed
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'humanize.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for better performance
db.exec('PRAGMA journal_mode = WAL;');

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

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar_emoji TEXT DEFAULT '🤖',
    platform TEXT DEFAULT 'general',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agent_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    title TEXT DEFAULT '',
    content TEXT NOT NULL,
    platform TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed default configs
const defaultConfigs = [
  {
    name: 'Make it Human',
    parameters: {
      writingStyle: 'casual',
      emotionalDepth: 70,
      personalitySlider: 65,
      imperfections: true,
      humanNoise: true,
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
      personalitySlider: 85,
      imperfections: false,
      humanNoise: false,
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
      personalitySlider: 80,
      imperfections: true,
      humanNoise: false,
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
      personalitySlider: 75,
      imperfections: true,
      humanNoise: true,
      antiAIDetector: true,
      persona: 'beginner',
      culturalTone: 'neutral',
      oneClickMode: 'relatable',
      description: 'Make content feel deeply personal and relatable with real-life experiences and emotions.'
    }
  }
];

const insertConfig = db.prepare(
  'INSERT OR IGNORE INTO configs (name, parameters_json) VALUES (?, ?)'
);

for (const config of defaultConfigs) {
  insertConfig.run(config.name, JSON.stringify(config.parameters));
}

// Helper functions
function getConfigs() {
  const rows = db.prepare('SELECT * FROM configs ORDER BY id ASC').all();
  return rows.map(row => ({
    ...row,
    parameters: JSON.parse(row.parameters_json)
  }));
}

function getConfigByName(name) {
  const row = db.prepare('SELECT * FROM configs WHERE name = ?').get(name);
  if (!row) return null;
  return { ...row, parameters: JSON.parse(row.parameters_json) };
}

function saveHistory(sessionId, originalText, humanizedText, settings, scores) {
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
}

function getHistory(sessionId) {
  const rows = db.prepare(
    'SELECT * FROM session_history WHERE session_id = ? ORDER BY timestamp DESC'
  ).all(sessionId);
  return rows.map(row => ({
    ...row,
    settings: row.settings_json ? JSON.parse(row.settings_json) : null,
    scores: row.scores_json ? JSON.parse(row.scores_json) : null
  }));
}

// ── Agent CRUD ───────────────────────────────────────────────────────────────

function listAgents() {
  const agents = db.prepare('SELECT * FROM agents ORDER BY created_at DESC').all();
  return agents.map(a => ({
    ...a,
    post_count: db.prepare('SELECT COUNT(*) as c FROM agent_posts WHERE agent_id = ?').get(a.id).c
  }));
}

function getAgent(id) {
  const agent = db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
  if (!agent) return null;
  const posts = db.prepare('SELECT * FROM agent_posts WHERE agent_id = ? ORDER BY created_at DESC').all(id);
  return { ...agent, posts };
}

function createAgent({ name, description = '', avatar_emoji = '🤖', platform = 'general' }) {
  const stmt = db.prepare(
    'INSERT INTO agents (name, description, avatar_emoji, platform) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(name, description, avatar_emoji, platform);
  return getAgent(result.lastInsertRowid);
}

function updateAgent(id, { name, description, avatar_emoji, platform }) {
  const fields = [];
  const values = [];
  if (name !== undefined)         { fields.push('name = ?');         values.push(name); }
  if (description !== undefined)  { fields.push('description = ?');  values.push(description); }
  if (avatar_emoji !== undefined) { fields.push('avatar_emoji = ?'); values.push(avatar_emoji); }
  if (platform !== undefined)     { fields.push('platform = ?');     values.push(platform); }
  if (fields.length === 0) return getAgent(id);
  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  db.prepare(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getAgent(id);
}

function deleteAgent(id) {
  db.prepare('DELETE FROM agent_posts WHERE agent_id = ?').run(id);
  db.prepare('DELETE FROM agents WHERE id = ?').run(id);
}

// ── Agent Posts ───────────────────────────────────────────────────────────────

function addAgentPost(agentId, { title = '', content, platform = '' }) {
  const stmt = db.prepare(
    'INSERT INTO agent_posts (agent_id, title, content, platform) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(agentId, title, content, platform);
  return db.prepare('SELECT * FROM agent_posts WHERE id = ?').get(result.lastInsertRowid);
}

function updateAgentPost(postId, { title, content, platform }) {
  const fields = [];
  const values = [];
  if (title !== undefined)    { fields.push('title = ?');    values.push(title); }
  if (content !== undefined)  { fields.push('content = ?');  values.push(content); }
  if (platform !== undefined) { fields.push('platform = ?'); values.push(platform); }
  if (fields.length === 0) return db.prepare('SELECT * FROM agent_posts WHERE id = ?').get(postId);
  values.push(postId);
  db.prepare(`UPDATE agent_posts SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return db.prepare('SELECT * FROM agent_posts WHERE id = ?').get(postId);
}

function deleteAgentPost(postId) {
  db.prepare('DELETE FROM agent_posts WHERE id = ?').run(postId);
}

function getAgentPosts(agentId) {
  return db.prepare('SELECT * FROM agent_posts WHERE agent_id = ? ORDER BY created_at DESC').all(agentId);
}

module.exports = {
  db,
  getConfigs, getConfigByName, saveHistory, getHistory,
  listAgents, getAgent, createAgent, updateAgent, deleteAgent,
  addAgentPost, updateAgentPost, deleteAgentPost, getAgentPosts
};
