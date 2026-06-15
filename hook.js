#!/usr/bin/env node
/**
 * Hook claude-mem pour OpenClaude
 * Reçoit les événements de hook via stdin (JSON) et envoie une observation au worker claude-mem.
 *
 * À configurer dans ~/.claude/settings.json :
 *   "hooks": {
 *     "PostToolUse": [{ "matcher": "", "hooks": [{ "type": "command", "command": "node E:\\travail\\pluguin_claude-mem_openclaude\\hook.js" }] }],
 *     "Stop": [{ "hooks": [{ "type": "command", "command": "node E:\\travail\\pluguin_claude-mem_openclaude\\hook.js stop" }] }]
 *   }
 */

const http = require('http');
const os   = require('os');
const path = require('path');

const CLAUDE_MEM_API  = process.env.CLAUDE_MEM_API || 'http://localhost:37777';
const PLATFORM_SOURCE = 'openclaude';

function post(body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const url  = new URL('/api/sessions/observations', CLAUDE_MEM_API);
    const req  = http.request(
      { hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { res.resume(); resolve(res.statusCode); }
    );
    req.on('error', () => resolve(null));
    req.write(data);
    req.end();
  });
}

async function main() {
  // Lire le JSON envoyé par OpenClaude via stdin
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;

  // Logger le JSON brut pour débogage
  const fs = require('fs');
  const logPath = require('path').join(__dirname, 'hook-debug.log');
  fs.appendFileSync(logPath, `\n--- ${new Date().toISOString()} [${process.argv[2]}] ---\n${raw}\n`);

  let event = {};
  try { event = JSON.parse(raw); } catch { event = {}; }

  const hookType  = process.argv[2] || 'PostToolUse';
  const sessionId = event.session_id || event.sessionId || `openclaude-${Date.now()}`;
  const cwd       = event.cwd || process.env.CLAUDE_CWD || process.cwd();
  const project   = path.basename(cwd);

  // Construire les facts selon le type d'événement
  const facts = [];
  let title    = '';
  let subtitle = '';
  let narrative = '';
  let tool_name = 'chat';

  if (hookType === 'stop' || hookType === 'Stop') {
    // Événement Stop : fin de session
    const lastMsg = event.last_assistant_message || '';
    tool_name = 'chat';
    title     = lastMsg.slice(0, 80) || 'OpenClaude session terminée';
    subtitle  = lastMsg.slice(0, 120);
    narrative = lastMsg;

    // Lire le transcript JSONL pour avoir toute la conversation
    if (event.transcript_path) {
      try {
        const fs   = require('fs');
        const lines = fs.readFileSync(event.transcript_path, 'utf-8').trim().split('\n');
        for (const line of lines) {
          try {
            const msg = JSON.parse(line);
            if (msg.role === 'user' && msg.content) {
              const text = Array.isArray(msg.content)
                ? msg.content.filter(c => c.type === 'text').map(c => c.text).join(' ')
                : String(msg.content);
              if (text.trim()) facts.push(`User: ${text.slice(0, 300)}`);
            }
            if (msg.role === 'assistant' && msg.content) {
              const text = Array.isArray(msg.content)
                ? msg.content.filter(c => c.type === 'text').map(c => c.text).join(' ')
                : String(msg.content);
              if (text.trim()) facts.push(`Assistant: ${text.slice(0, 500)}`);
            }
          } catch {}
        }
        if (facts.length > 0) {
          // Utiliser le premier message utilisateur comme titre
          const firstUser = facts.find(f => f.startsWith('User:'));
          if (firstUser) title = firstUser.replace('User: ', '').slice(0, 80);
        }
      } catch {}
    }
  } else {
    // Événement PostToolUse : un outil vient d'être utilisé
    const toolName   = event.tool_name || 'unknown';
    const toolInput  = event.tool_input  || {};
    const toolResult = event.tool_response || event.tool_result || '';
    const resultStr  = typeof toolResult === 'object' ? JSON.stringify(toolResult).slice(0, 500) : String(toolResult).slice(0, 500);

    tool_name = toolName;
    title     = `[${toolName}] ${JSON.stringify(toolInput).slice(0, 80)}`;
    subtitle  = resultStr.slice(0, 120);
    narrative = `Tool ${toolName} executed.\nInput: ${JSON.stringify(toolInput, null, 2)}\nResult: ${resultStr}`;

    facts.push(`Tool: ${toolName}`);
    if (toolInput.file_path)  facts.push(`File: ${toolInput.file_path}`);
    if (toolInput.command)    facts.push(`Command: ${toolInput.command}`);
    if (toolInput.pattern)    facts.push(`Pattern: ${toolInput.pattern}`);
    facts.push(`Input: ${JSON.stringify(toolInput).slice(0, 300)}`);
    if (resultStr) facts.push(`Result: ${resultStr.slice(0, 300)}`);
  }

  const obs = {
    platformSource:   PLATFORM_SOURCE,
    contentSessionId: String(sessionId),
    project,
    cwd,
    hostname:         os.hostname(),
    type:             'chat.message',
    tool_name,
    title,
    subtitle,
    facts,
    narrative,
    concepts:      [],
    filesRead:     [],
    filesModified: [],
  };

  const status = await post(obs);
  process.stderr.write(`[claude-mem hook] ${status === 200 || status === 201 ? '✓' : '✗ HTTP ' + status} — ${title.slice(0, 50)}\n`);
}

main().catch((err) => {
  process.stderr.write(`[claude-mem hook] Erreur: ${err.message}\n`);
});
