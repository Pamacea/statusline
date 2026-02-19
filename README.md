# Claude Code Statusline Plugin

**Real-time statusline for Claude Code** - Track tokens, costs, git status, and session duration with beautiful visual feedback.

**Problem**: You don't know how many tokens you've used or how much your session costs.
**Solution**: A persistent, colored statusline that updates in real-time at the top of your sessions.

```
main* ▸ claude-statusline ▸ [1] +63 -21 [5] ▸ 4.7 ▸ $0.15 ▸ [━━━━━━━╸──────] ▸ 65% (130K/200K) ▸ 2h11m
```

## Quick Start

```bash
# Install from Claude Code marketplace
claude plugin install claude-statusline

# Or use standalone script (no marketplace needed)
cp statusline-standalone.mjs ~/.claude/statusline.mjs
# Add to ~/.claude/settings.json:
# { "statusLine": { "type": "command", "command": "node ~/.claude/statusline.mjs" } }
```

**Restart Claude Code.** That's it!

---

## Features

- **📊 Real-time Token Tracking** - See exact usage from current session (not estimates)
- **💰 Cost Calculation** - Track session costs automatically ($0.0015 precision)
- **🕐 Session Duration** - Know how long you've been working (2h11m format)
- **🌿 Enhanced Git Status** - Staged (cyan) vs unstaged (green/red) with file counts
- **📈 Progress Bar** - Dynamic colors: green → yellow → orange → red
- **🎨 Model Version** - Clean display: "4.7" instead of "glm-4.7"
- **🖥️ Cross-Platform** - Windows, macOS, Linux with full Unicode support

## Display Breakdown

```
main* ▸ claude-statusline ▸ [1] +63 -21 [5] ▸ 4.7 ▸ $0.15 ▸ [━━━] ▸ 65% ▸ 2h11m
│    │                   │                          │     │      │     │
│    │                   │                          │     │      │     └─ Session duration
│    │                   │                          │     │      └─────── Token percentage
│    │                   │                          │     └────────────── Progress bar
│    │                   │                          └─────────────────── Token count
│    │                   └────────────────────────────────────────── Session cost
│    └───────────────────────────────────────────────────────────── Model version
└──────────────────────────────────── Git branch + staged/unstaged files
```

## What's New in v0.6.1

- ✨ **Real-time tracking** - Reads actual session data (no more estimates!)
- 🎯 **Better git display** - Staged in cyan, unstaged in colors, file counts `[X]`
- 💎 **Model extraction** - Shows "4.7" instead of "glm-4.7"
- ⏱️ **Session duration** - Tracks time from first to last message
- 🎨 **Improved progress bar** - Uses `━╸─` characters with dynamic colors

## Documentation

- **[GUIDE.md](GUIDE.md)** - Full setup guide, configuration, and troubleshooting (5 min read)
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

## Installation Options

### Option 1: Marketplace Plugin (Recommended)

```bash
claude plugin install claude-statusline
```

### Option 2: Standalone Script

```bash
# Copy the standalone script
cp statusline-standalone.mjs ~/.claude/statusline.mjs

# Add to ~/.claude/settings.json:
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.mjs"
  }
}
```

## Configuration

Create `~/.claude/statusline.config.json` (optional):

```json
{
  "git": {
    "showStaged": true,
    "showUnstaged": true
  },
  "separator": "▸",
  "session": {
    "percentage": {
      "progressBar": {
        "length": 15,
        "style": "filled",
        "color": "progressive"
      }
    }
  }
}
```

## License

MIT © Yanis - [GitHub](https://github.com/Pamacea/claude-statusline)
