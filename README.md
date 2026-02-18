# Claude Code Statusline Plugin

Advanced native statusline for Claude Code with git branch, path, token context, and progress bar.

**Displays a persistent statusline at the top of your Claude Code sessions.**

## Preview

```
⚡ main  ~/src/features  [████████████░░░░░░░░░] 52% (104K/200K)
```

## Quick Start

### Option 1: Clone & Install (Recommended)

```bash
# Clone the repository
git clone https://github.com/Pamacea/claude-statusline.git
cd claude-statusline

# Run the installer (npm/bun)
npm run install:statusline
# OR
bun run install:statusline

# Restart Claude Code
```

### Option 2: Marketplace Installation

```bash
# Add the marketplace (in Claude Code)
/plugin marketplace add https://github.com/Pamacea/claude-statusline.git

# Install the plugin
/plugin install statusline@claude-statusline

# Then run the installer from the plugin directory
node ~/.claude/plugins/statusline/plugins/statusline/scripts/install-statusline.mjs
```

## What the Installer Does

The installer automatically:
1. Copies `statusline.mjs` to `~/.claude/statusline.mjs`
2. Adds the `statusLine` configuration to `~/.claude/settings.json`

### Manual Installation

If the installer doesn't work, you can install manually:

1. **Copy the script:**
   ```bash
   # Unix/macOS
   cp plugins/statusline/scripts/statusline.mjs ~/.claude/statusline.mjs
   chmod +x ~/.claude/statusline.mjs

   # Windows (PowerShell)
   Copy-Item plugins\statusline\scripts\statusline.mjs $env:USERPROFILE\.claude\statusline.mjs
   ```

2. **Update `~/.claude/settings.json`:**
   ```json
   {
     "statusLine": {
       "type": "command",
       "command": "node ~/.claude/statusline.mjs"
     }
   }
   ```

3. **Restart Claude Code**

## Features

| Feature | Description |
|---------|-------------|
| **Git Branch** | Current branch with dirty state indicator (`*`) |
| **Project Path** | Relative path from git root or current directory |
| **Token Usage** | Exact count with percentage and color-coded progress bar |
| **Progress Bar** | Dynamic colors: green → yellow → red based on usage |
| **Cross-Platform** | Works on Windows, macOS, and Linux |

## Display Format

```
⚡ main  ~/src/features  [████████████░░░░░░░░░] 52% (104K/200K)
│  │         │                    │              │       │
│  │         │                    │              │       └─ Max tokens
│  │         │                    │              └── Current tokens
│  │         │                    └──────────────── Percentage
│  │         └──────────────────────────────────── Progress bar (colored)
│  └────────────────────────────────────────────── Project path
└────────────────────────────────────────────────── Git branch + dirty indicator
```

## Model Support

| Model | Max Tokens |
|-------|------------|
| Haiku | 200,000 |
| Sonnet 4.x | 200,000 |
| Opus 4.x | 200,000 |
| Opus 4.5+ | 1,000,000 |

## Configuration

Edit the `CONFIG` object at the top of `~/.claude/statusline.mjs`:

```javascript
const CONFIG = {
  maxTokens: 200000,        // Default max tokens
  progressBarWidth: 20,     // Width of progress bar (characters)
  showIcons: true,          // Show ⚡ icon
  colors: {
    low: 'green',           // < 25% usage
    medium: 'yellow',       // 25-75% usage
    high: 'red'            // > 75% usage
  }
};
```

## Troubleshooting

### Statusline not appearing

1. **Test the script manually:**
   ```bash
   node ~/.claude/statusline.mjs
   ```
   You should see a colored statusline output.

2. **Check your settings:**
   ```bash
   cat ~/.claude/settings.json | grep -A 3 statusLine
   ```
   Should show:
   ```json
   "statusLine": {
     "type": "command",
     "command": "node ~/.claude/statusline.mjs"
   }
   ```

3. **Restart Claude Code completely** (not just reconnect)

### Git information not showing

- Ensure you're in a git repository
- Check that git is installed: `git --version`
- The statusline will show `no-git` when not in a repository

### Unicode icons showing as boxes

- Set `showIcons: false` in the script configuration
- Or use a modern terminal (Windows Terminal, iTerm2, etc.)

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Lint
bun run lint
```

## License

MIT License - see [LICENSE](LICENSE) for details.
