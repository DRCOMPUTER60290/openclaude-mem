# openclaude-mem

> Capture your [OpenClaude](https://github.com/Gitlawb/openclaude) conversations and tool usage in the [claude-mem](https://github.com/thedotmack/claude-mem) viewer.

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
