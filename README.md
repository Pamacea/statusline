# Claude Code Statusline Plugin

**Real-time statusline for Claude Code** - Track tokens, costs, git status, and session duration with beautiful visual feedback.

**Problem**: You don't know how many tokens you've used or how much your session costs.
**Solution**: A persistent, colored statusline that updates in real-time at the top of your sessions.

```
main* ▸ claude-statusline ▸ [1] +63 -21 [5] ▸ 4.7 ▸ $0.15 ▸ [━━━━━━━╸──────] ▸ 65% (130K/200K) ▸ 2h11m ▸ Vim ▸ C: 65.5%
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
- **🔄 Vim Mode Indicator** - Shows "Vim" (green) when active, "Normal" (gray) when inactive
- **💾 Cache Percentage** - Display cached tokens with progress bar (C: 65.5%)
- **🖥️ Cross-Platform** - Windows, macOS, Linux with full Unicode support

## Display Breakdown

```
main* ▸ claude-statusline ▸ [1] +63 -21 [5] ▸ 4.7 ▸ $0.15 ▸ [━━━] ▸ 65% ▸ 2h11m ▸ Vim ▸ C: 65.5%
│    │                   │                          │     │      │     │       │      │
│    │                   │                          │     │      │     │       │      └─ Cache percentage
│    │                   │                          │     │      │     │       └────────── Vim mode
│    │                   │                          │     │      │     └────────────────── Session duration
│    │                   │                          │     │      └────────────────────── Token percentage
│    │                   │                          │     └───────────────────────────── Progress bar
│    │                   │                          └─────────────────────────────────── Token count
│    │                   └────────────────────────────────────────────────────────── Session cost
│    └────────────────────────────────────────────────────────────────────────────── Model version
└────────────────────────────────────── Git branch + staged/unstaged files
```

## What's New in v0.7.0

- ✨ **Vim mode indicator** - Shows "Vim" (green) when active, "Normal" (gray) when inactive
- 💾 **Cache percentage tracking** - Display cached tokens with progress bar (C: 65.5%)
- 🎨 **Better color control** - Configure colors for active/inactive states
- 📊 **Enhanced formatting** - Support for both bar and percentage display modes
- ⚙️ **Full configurability** - Toggle indicators, customize labels, adjust progress bars

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
  },
  "vim": {
    "enabled": true,
    "showLabel": true,
    "activeText": "Vim",
    "inactiveText": "Normal",
    "colorWhenActive": "green",
    "colorWhenInactive": "gray"
  },
  "cache": {
    "enabled": true,
    "showLabel": true,
    "format": "percentage",
    "prefix": "C:",
    "progressBar": {
      "enabled": true,
      "length": 10,
      "style": "filled",
      "color": "progressive",
      "background": "none"
    },
    "colorThresholds": {
      "low": 30,
      "medium": 60,
      "high": 90
    }
  }
}
```

### Configuration Options

#### Vim Mode Indicator
- **enabled**: Enable/disable vim mode indicator (default: `true`)
- **showLabel**: Always show label, or only when active (default: `true`)
- **activeText**: Text when vim mode is active (default: `"Vim"`)
- **inactiveText**: Text when vim mode is inactive (default: `"Normal"`)
- **colorWhenActive**: Color when active - `green`, `red`, `yellow`, `gray`, etc. (default: `"green"`)
- **colorWhenInactive**: Color when inactive (default: `"gray"`)

#### Cache Percentage
- **enabled**: Enable/disable cache display (default: `true`)
- **showLabel**: Show prefix label (default: `true`)
- **format**: Display format - `"percentage"`, `"bar"`, or `"percentage"` (default: `"percentage"`)
- **prefix**: Label prefix (default: `"C:"`)
- **progressBar**: Progress bar configuration (length, style, color, background)
- **colorThresholds**: Thresholds for color scaling (low: 30%, medium: 60%, high: 90%)

## License

MIT © Yanis - [GitHub](https://github.com/Pamacea/claude-statusline)
