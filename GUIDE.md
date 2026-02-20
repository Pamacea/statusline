# Claude Code Statusline - Complete Guide

**Last updated:** v0.6.1
**Reading time:** 5 minutes

---

## Table of Contents

1. [Installation](#installation)
2. [Display Breakdown](#display-breakdown)
3. [Configuration](#configuration)
4. [Git Status Explained](#git-status-explained)
5. [Token Tracking](#token-tracking)
6. [Session Duration & Cost](#session-duration--cost)
7. [Customization](#customization)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Usage](#advanced-usage)

---

## Installation

### Option 1: Marketplace Plugin (Recommended)

```bash
claude plugin install statusline
```

**Restart Claude Code completely** (not just reconnect).

### Option 2: Standalone Script

The standalone script reads session data directly and works without the plugin marketplace.

```bash
# 1. Copy the script
cp statusline-standalone.mjs ~/.claude/statusline.mjs

# 2. Add to ~/.claude/settings.json
{
  "statusLine": {
    "type": "command",
    "command": "node ~/.claude/statusline.mjs"
  }
}

# 3. Restart Claude Code
```

### Verification

Test that it's working:

```bash
# Test the script directly
node ~/.claude/statusline.mjs

# You should see colored output like:
# main* ▸ statusline ▸ [1] +63 -21 [5] ▸ 4.7 ▸ $0.15 ▸ [━━━] ▸ 65% (130K/200K) ▸ 2h11m
```

---

## Display Breakdown

```
main* ▸ statusline ▸ [1] +63 -21 [5] ▸ 4.7 ▸ $0.15 ▸ [━━━━━━━╸──────] ▸ 65% (130K/200K) ▸ 2h11m
│    │                   │                          │     │      │                    │
│    │                   │                          │     │      │                    └─ Session duration
│    │                   │                          │     │      └────────────────── Token usage (current/max)
│    │                   │                          │     └───────────────────── Progress bar with percentage
│    │                   │                          └────────────────────────── Session cost
│    │                   └─────────────────────────────────────────────── Model version
│    └───────────────────────────────────────────────────────────────── Git status (staged/unstaged)
└───────────────────────────────────────────────────────────────────── Branch and path
```

### Color Legend

| Element | Color | Meaning |
|---------|-------|---------|
| `main` | White/bold | Branch name |
| `*` | Magenta | Dirty working directory |
| `[1]` | Cyan | Staged files (1 file) |
| `+63` | Cyan | Staged insertions |
| `-21` | Cyan | Staged deletions |
| `+63` | Green | Unstaged insertions |
| `-21` | Red | Unstaged deletions |
| `[5]` | Yellow | Unstaged files (5 files) |
| `4.7` | Peach | Model version |
| `$0.15` | Green | Session cost |
| Progress bar | Green→Yellow→Orange→Red | Usage level |
| `65%` | White/bold | Token percentage |
| `2h11m` | Gray | Session duration |

---

## Configuration

### Config File Location

Create `~/.claude/statusline.config.json` for persistent configuration.

### Basic Configuration

```json
{
  "git": {
    "enabled": true,
    "showBranch": true,
    "showDirtyIndicator": true,
    "showChanges": true,
    "showStaged": true,
    "showUnstaged": true
  },
  "separator": "▸",
  "session": {
    "infoSeparator": "▸",
    "cost": { "enabled": true, "format": "decimal2" },
    "duration": { "enabled": true },
    "tokens": { "enabled": true, "showMax": true, "showDecimals": true },
    "percentage": {
      "enabled": true,
      "showValue": true,
      "progressBar": {
        "enabled": true,
        "length": 15,
        "style": "filled",
        "color": "progressive",
        "background": "none"
      }
    }
  }
}
```

### Git Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Show git information |
| `showBranch` | boolean | `true` | Show branch name |
| `showDirtyIndicator` | boolean | `true` | Show `*` for dirty state |
| `showChanges` | boolean | `true` | Show +N/-M line counts |
| `showStaged` | boolean | `true` | Show staged changes (cyan) |
| `showUnstaged` | boolean | `true` | Show unstaged changes (green/red) |

### Progress Bar Configuration

| Option | Values | Default | Description |
|--------|--------|---------|-------------|
| `style` | `"filled"`, `"rectangle"`, `"braille"` | `"filled"` | Bar character style |
| `color` | `"progressive"`, `"green"`, `"yellow"`, `"red"`, `"peach"` | `"progressive"` | Color mode |
| `background` | `"none"`, `"dark"`, `"gray"`, `"light"` | `"none"` | Background color |
| `length` | `5`, `10`, `15` | `15` | Bar width |

**Progress bar styles:**
- `filled`: `━━━━━━╸────` (default)
- `rectangle`: `▰▰▰▰▰▱▱▱▱`
- `braille`: `⣿⣿⣿⣀⣀⣀`

---

## Git Status Explained

### Staged vs Unstaged

The statusline distinguishes between **staged** (in git index) and **unstaged** changes:

```
[1] +63 -21  +20 -3 [5]
│    │     │   │    │  └─ Unstaged files (5)
│    │     │   │    └──── Unstaged deletions (3)
│    │     │   └────────── Unstaged insertions (20)
│    │     └────────────── Staged deletions (21)
│    └──────────────────── Staged insertions (63)
└───────────────────────── Staged files (1)
```

### Color Coding

- **Cyan** - Staged changes (ready to commit)
- **Green** - Unstaged additions
- **Red** - Unstaged deletions
- **Yellow** - File counts

### Dirty Indicator

The `*` appears after the branch name when there are any uncommitted changes:

```
main*    → Has uncommitted changes
main     → Clean working directory
```

---

## Token Tracking

### Real-Time vs Estimated

The statusline reads **actual token usage** from your current session file - no estimates!

**Data source:** `~/.claude/projects/<project-hash>/<session-id>.jsonl`

### Token Breakdown

```
65% (130K/200K)
│   │      └─ Maximum context window
│   └────────── Current token usage
└────────────── Usage percentage
```

### What's Counted

- Input tokens (prompt text)
- Cache read tokens (cached context)
- Output tokens (AI responses)

### Progress Bar Colors

| Usage | Color | Threshold |
|-------|-------|------------|
| 0-40% | Green | 🟢 Safe |
| 40-70% | Yellow | 🟡 Warning |
| 70-90% | Orange | 🟠 Caution |
| 90-100% | Red | 🔴 Limit approaching |

---

## Session Duration & Cost

### Duration Calculation

Session duration is calculated from the **first message timestamp** to the **last message timestamp** in your session.

**Format:** `2h11m` or `45m`

### Cost Calculation

Costs are calculated using standard API pricing:

| Model | Input | Output |
|-------|-------|--------|
| Sonnet 4.x | $3/M | $15/M |
| Opus 4.x | $15/M | $75/M |
| Haiku | $0.25/M | $1.25/M |

**Precision:** 4 decimals for amounts < $0.01, 2 decimals otherwise

```
$0.0013  → Small amounts (4 decimals)
$1.23    → Larger amounts (2 decimals)
```

---

## Customization

### One-Line Mode

Display everything on a single line:

```json
{
  "oneLine": true
}
```

### Path Display Modes

```json
{
  "pathDisplayMode": "truncated"  // Options: "full", "truncated", "basename"
}
```

**Examples:**
- `full`: `~/Projects/statusline/src/lib`
- `truncated`: `…src/lib` (default)
- `basename`: `lib`

### Custom Separator

Change the separator between sections:

```json
{
  "separator": "▸"  // Default: "▸", alternatives: "|", "•", "→"
}
```

---

## Troubleshooting

### Statusline Not Appearing

**1. Test the script directly:**

```bash
# Standalone script
node ~/.claude/statusline.mjs

# Marketplace plugin
node ~/.claude/plugins/cache/statusline/statusline/0.6.1/dist/index.js
```

**2. Check settings.json:**

```bash
# Unix/macOS
cat ~/.claude/settings.json | grep -A 3 statusLine

# Windows (PowerShell)
Get-Content $env:USERPROFILE\.claude\settings.json | Select-String -Pattern statusLine -Context 0,3
```

**3. Restart Claude Code completely** (not just reconnect)

### Git Information Not Showing

1. Ensure you're in a git repository: `git rev-parse --is-inside-work-tree`
2. Check git is installed: `git --version`
3. Verify git commands work: `git status`

### Unicode Icons Showing as Boxes

**Problem:** Your terminal doesn't support Unicode characters.

**Solutions:**
1. Use a modern terminal (Windows Terminal, iTerm2)
2. Install a Nerd Font (Fira Code, JetBrains Mono)
3. Or use `rectangle` style instead of `filled`

### Progress Bar Not Accurate

**Problem:** Tokens showing 0 or incorrect values.

**Solutions:**
1. Ensure you're in the correct project directory
2. Check that session files exist: `ls ~/.claude/projects/`
3. Try reloading the window: `Ctrl+R` (not full restart)

### Cost Showing $0.0000

**Problem:** Cost rounds to zero for small sessions.

**Solution:** This is normal for very short sessions. The precision automatically increases to 4 decimals.

---

## Advanced Usage

### Custom Hooks

The marketplace plugin supports custom hooks:

```typescript
// plugins/statusline/hooks/custom.js
export function beforeStatusline(data) {
  // Add custom data processing
  return data;
}
```

### Environment Variables

Set environment variables for custom behavior:

```bash
# Custom max tokens
export CLAUDE_STATUSLINE_MAX_TOKENS=200000

# Custom cost format
export CLAUDE_STATUSLINE_COST_FORMAT=decimal2
```

### Multiple Projects

The statusline automatically adapts to each project:
- Detects git branch per project
- Tracks tokens per session
- Shows relative paths from git root

### Performance Considerations

**Impact:** Minimal (< 10ms per update)

**Optimizations:**
- Caches git status for 1 second
- Reads only last line of session files
- Uses native git commands for speed

---

## FAQ

**Q: Does this work with all Claude models?**
A: Yes, Sonnet, Opus, and Haiku are all supported.

**Q: Can I hide the progress bar?**
A: Yes, set `session.percentage.progressBar.enabled = false`

**Q: Why does cost show $0.00?**
A: Either cost is disabled in config or session is very small (< $0.005)

**Q: How often does the statusline update?**
A: On every user prompt submission (via hooks)

**Q: Can I use this with other plugins?**
A: Yes, it's designed to work alongside other Claude Code plugins.

---

## Support

- **Issues:** [GitHub Issues](https://github.com/Pamacea/statusline/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Pamacea/statusline/discussions)
- **Documentation:** [README.md](README.md) | [CHANGELOG.md](CHANGELOG.md)

---

**Version:** v0.6.1
**Last updated:** 2025-02-19
**License:** MIT
