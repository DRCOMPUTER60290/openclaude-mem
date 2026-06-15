# openclaude-mem

Capture [OpenClaude](https://github.com/Gitlawb/openclaude) conversations and tool usage in the [claude-mem](https://github.com/thedotmack/claude-mem) viewer at `http://localhost:37777/`.

## When to Use This Skill

Use this skill when the user:

- Uses **OpenClaude** as their AI coding agent and wants to see their conversations in the claude-mem viewer
- Asks "how do I see my OpenClaude conversations in claude-mem?"
- Wants OpenClaude to appear alongside Claude Code in `http://localhost:37777/`
- Needs to capture tool usage (Read, Edit, Bash…) from OpenClaude sessions

## What This Skill Does

This skill configures OpenClaude hooks (`PostToolUse`, `Stop`) to automatically forward every conversation and tool call to the claude-mem worker API. Your sessions then appear in the viewer under the `openclaude` platform source filter.

```
OpenClaude (hooks)
    → hook.js
        → POST /api/sessions/observations
            → http://localhost:37777/
```

## Requirements

- [OpenClaude](https://github.com/Gitlawb/openclaude) installed (`npm i -g @gitlawb/openclaude`)
- [claude-mem](https://github.com/thedotmack/claude-mem) plugin installed and worker running
- **Claude Code must be running** to start the claude-mem worker automatically (required to save observations to `localhost:37777`)
- Node.js 18+

## Installation

```bash
npx skills add DRCOMPUTER60290/openclaude-mem
```

Then add the hooks to your `~/.claude/settings.json`:

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

## Usage

Once installed and configured, simply use OpenClaude normally:

```bash
openclaude
```

Open `http://localhost:37777/` and select `openclaude` in the platform source filter to see your conversations in real time.

## How It Works

| Hook | Trigger | What is captured |
|------|---------|-----------------|
| `PostToolUse` | After every tool call | Tool name, input, result |
| `Stop` | End of session | Full conversation from transcript |

## Learn More

- Repository: https://github.com/DRCOMPUTER60290/openclaude-mem
- claude-mem viewer: http://localhost:37777/
- OpenClaude: https://github.com/Gitlawb/openclaude
