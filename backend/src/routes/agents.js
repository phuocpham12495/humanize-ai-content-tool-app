const express = require('express');
const router = express.Router();
const {
  listAgents, getAgent, createAgent, updateAgent, deleteAgent,
  addAgentPost, updateAgentPost, deleteAgentPost, getAgentPosts,
  addPromptLog
} = require('../db/database');
const { generateWithAgentStyle } = require('../services/geminiService');

// ── Agents CRUD ───────────────────────────────────────────────────────────────

// GET /api/agents
router.get('/', (req, res) => {
  try {
    res.json({ success: true, agents: listAgents() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list agents', message: err.message });
  }
});

// POST /api/agents
router.post('/', (req, res) => {
  try {
    const { name, description, avatar_emoji, platform } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Invalid request', message: 'name is required' });
    }
    const agent = createAgent({ name: name.trim(), description, avatar_emoji, platform });
    res.status(201).json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create agent', message: err.message });
  }
});

// GET /api/agents/:id
router.get('/:id', (req, res) => {
  try {
    const agent = getAgent(Number(req.params.id));
    if (!agent) return res.status(404).json({ error: 'Not found', message: 'Agent not found' });
    res.json({ success: true, agent });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get agent', message: err.message });
  }
});

// PUT /api/agents/:id
router.put('/:id', (req, res) => {
  try {
    const agent = getAgent(Number(req.params.id));
    if (!agent) return res.status(404).json({ error: 'Not found', message: 'Agent not found' });
    const { name, description, avatar_emoji, platform } = req.body;
    const updated = updateAgent(Number(req.params.id), { name, description, avatar_emoji, platform });
    res.json({ success: true, agent: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update agent', message: err.message });
  }
});

// DELETE /api/agents/:id
router.delete('/:id', (req, res) => {
  try {
    const agent = getAgent(Number(req.params.id));
    if (!agent) return res.status(404).json({ error: 'Not found', message: 'Agent not found' });
    deleteAgent(Number(req.params.id));
    res.json({ success: true, message: 'Agent deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete agent', message: err.message });
  }
});

// ── Agent Posts CRUD ──────────────────────────────────────────────────────────

// POST /api/agents/:id/posts
router.post('/:id/posts', (req, res) => {
  try {
    const agentId = Number(req.params.id);
    const agent = getAgent(agentId);
    if (!agent) return res.status(404).json({ error: 'Not found', message: 'Agent not found' });

    const { title, content, platform } = req.body;
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Invalid request', message: 'content is required' });
    }
    const post = addAgentPost(agentId, { title, content: content.trim(), platform });
    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add post', message: err.message });
  }
});

// PUT /api/agents/:id/posts/:postId
router.put('/:id/posts/:postId', (req, res) => {
  try {
    const { title, content, platform } = req.body;
    const post = updateAgentPost(Number(req.params.postId), { title, content, platform });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post', message: err.message });
  }
});

// DELETE /api/agents/:id/posts/:postId
router.delete('/:id/posts/:postId', (req, res) => {
  try {
    deleteAgentPost(Number(req.params.postId));
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post', message: err.message });
  }
});

// ── Generate with Agent Style ─────────────────────────────────────────────────

// POST /api/agents/:id/generate
router.post('/:id/generate', async (req, res) => {
  try {
    const agentId = Number(req.params.id);
    const agent = getAgent(agentId);
    if (!agent) return res.status(404).json({ error: 'Not found', message: 'Agent not found' });

    const { text, settings } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Invalid request', message: 'text is required' });
    }
    if (!agent.posts || agent.posts.length === 0) {
      return res.status(400).json({
        error: 'No training data',
        message: `Agent "${agent.name}" has no sample posts. Add at least 1 post to train the agent.`
      });
    }

    const result = await generateWithAgentStyle(text.trim(), agent, settings || {});
    res.json({ success: true, agentId, agentName: agent.name, generatedText: result });
  } catch (err) {
    console.error('Agent generate error:', err);
    if (err.message?.includes('GEMINI_API_KEY')) {
      return res.status(500).json({ error: 'Configuration error', message: 'Gemini API key not set' });
    }
    res.status(500).json({ error: 'Generation failed', message: err.message });
  }
});

// POST /api/agents/:id/generate/stream  — SSE streaming version
router.post('/:id/generate/stream', async (req, res) => {
  const agentId = Number(req.params.id);
  const agent = getAgent(agentId);

  if (!agent) {
    return res.status(404).json({ error: 'Not found', message: 'Agent not found' });
  }
  const { text, settings } = req.body;
  if (!text?.trim()) {
    return res.status(400).json({ error: 'Invalid request', message: 'text is required' });
  }
  if (!agent.posts?.length) {
    return res.status(400).json({
      error: 'No training data',
      message: `Agent "${agent.name}" has no sample posts.`
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const { generateWithAgentStyleStream } = require('../services/geminiService');
    send('status', { message: `Applying ${agent.name}'s writing style...` });
    const { stream, _logMeta } = await generateWithAgentStyleStream(text.trim(), agent, settings || {});
    let fullText = '';
    for await (const chunk of stream) {
      const t = chunk.text();
      fullText += t;
      send('chunk', { text: t });
    }
    addPromptLog({ ..._logMeta, response: fullText.trim(), durationMs: Date.now() - _logMeta.startTime });
    send('done', { generatedText: fullText.trim() });
    res.end();
  } catch (err) {
    send('error', { message: err.message || 'Stream failed' });
    res.end();
  }
});

module.exports = router;
