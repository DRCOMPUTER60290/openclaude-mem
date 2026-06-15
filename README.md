# openclaude-mem

> Capture your [OpenClaude](https://github.com/Gitlawb/openclaude) conversations and tool usage in the [claude-mem](https://github.com/thedotmack/claude-mem) viewer.

## The full stack — why use this?

You might wonder: *why use OpenClaude if you already have Claude Code?*

The answer is **free tokens**.

Here is the complete stack this plugin is designed for:

```
freellmapi  →  OpenClaude  →  openclaude-mem  →  claude-mem viewer
(free tokens)  (coding agent)  (this plugin)      (localhost:37777)
```

| Tool | Role |
|------|------|
| [freellmapi](https://github.com/tashfeenahmed/freellmapi) | Local API server that provides **free LLM tokens** by proxying open providers. It exposes an OpenAI-compatible endpoint so any tool can use it. |
| [OpenClaude](https://github.com/Gitlawb/openclaude) | A Claude Code alternative that supports **any LLM provider**, including freellmapi. Use it exactly like Claude Code but without paying for Anthropic tokens. |
| [openclaude-mem](https://github.com/DRCOMPUTER60290/openclaude-mem) | This plugin. Hooks into OpenClaude and forwards every conversation to the claude-mem worker so your sessions are visible in the viewer. |
| [claude-mem](https://github.com/thedotmack/claude-mem) | Memory and viewer system for Claude Code. With this plugin, it also captures OpenClaude sessions — both appear side by side in `http://localhost:37777/`. |

### Typical workflow

1. Start **freellmapi** locally — it provides free tokens via an OpenAI-compatible endpoint
2. Configure **OpenClaude** to use freellmapi as its provider
3. Start **Claude Code** — this automatically starts the claude-mem worker on `localhost:37777`
4. Use **OpenClaude** normally — every session is captured and visible in the viewer alongside your Claude Code sessions

This gives you a full AI coding setup at zero cost, with the same memory and observability as Claude Code.

## What it does

Every time OpenClaude uses a tool (Read, Edit, Bash…) or finishes a session, this plugin automatically sends an observation to the claude-mem worker. Your conversations then appear in the viewer at `http://localhost:37777/` under the `openclaude` platform source — exactly like Claude Code does.

```
OpenClaude (hooks)
    → hook.js
        → POST /api/sessions/observations
            → http://localhost:37777/
```

## Requirements

- [OpenClaude](https://github.com/Gitlawb/openclaude) installed (`npm i -g @gitlawb/openclaude`)
- [claude-mem](https://github.com/thedotmack/claude-mem) plugin installed and worker running on `localhost:37777`
- **Claude Code must be running** to start the claude-mem worker automatically (the worker listens on `localhost:37777` and is required to save observations)
- Node.js 18+

## Installation

### 1. Clone this repo

```bash
git clone https://github.com/DRCOMPUTER60290/openclaude-mem.git
cd openclaude-mem
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add hooks to `~/.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/path/to/openclaude-mem/hook.js\" PostToolUse"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"/path/to/openclaude-mem/hook.js\" Stop"
          }
        ]
      }
    ]
  }
}
```

Replace `/path/to/openclaude-mem` with the actual path where you cloned the repo.

**Windows example:**
```json
"command": "node \"C:\\Users\\you\\openclaude-mem\\hook.js\" PostToolUse"
```

### 4. Start OpenClaude normally

```bash
openclaude
```

That's it. Open `http://localhost:37777/` and select `openclaude` in the platform source filter to see your conversations.

## How it works

The hook receives events from OpenClaude via stdin as JSON and forwards them to the claude-mem worker API.

| Hook | Trigger | What is captured |
|------|---------|-----------------|
| `PostToolUse` | After every tool call | Tool name, input, result |
| `Stop` | End of session | Full conversation from transcript |

The `Stop` hook reads the JSONL transcript file (provided by OpenClaude via `transcript_path`) to reconstruct the full user ↔ assistant conversation.

## Configuration

| Environment variable | Default | Description |
|---------------------|---------|-------------|
| `CLAUDE_MEM_API` | `http://localhost:37777` | claude-mem worker URL |

## Files

```
openclaude-mem/
├── hook.js              # Main hook script (PostToolUse + Stop)
├── openclaude.proto     # gRPC proto definition (reference)
├── package.json
└── README.md
```

## License

MIT
