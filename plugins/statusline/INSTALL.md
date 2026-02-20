# Installation Guide

## Prerequisites

- **Bun** v1.0.0 or higher
- **Claude Code** CLI
- **Git** (for git-related features)

## Installation

### Option 1: Local Installation (Recommended for Development)

1. Clone the repository:
```bash
git clone https://github.com/yanis/statusline.git
cd statusline
```

2. Install dependencies and build:
```bash
bun install
bun run build
```

3. Add to your project's `.claude/settings.json`:
```json
{
  "plugins": {
    "statusline": {
      "enabled": true,
      "path": "/path/to/statusline"
    }
  }
}
```

### Option 2: Global Installation

1. Clone and build:
```bash
git clone https://github.com/yanis/statusline.git
cd statusline
bun install
bun run build
```

2. Create a symlink in Claude's plugin directory:
```bash
# Linux/macOS
ln -s /path/to/statusline ~/.claude/plugins/statusline

# Windows (as Administrator)
mklink /D "C:\Users\YourName\.claude\plugins\statusline" "C:\path\to\statusline"
```

## Configuration

Add to your `.claude/settings.json`:

```json
{
  "plugins": {
    "statusline": {
      "enabled": true,
      "maxTokens": 200000,
      "progressBarWidth": 20,
      "showIcons": true,
      "colors": {
        "low": "red",
        "medium": "yellow",
        "high": "green"
      }
    }
  }
}
```

## Model-Specific Configuration

For **Opus 4.5+** with 1M token context:

```json
{
  "plugins": {
    "statusline": {
      "maxTokens": 1000000
    }
  }
}
```

## Verification

Start a new Claude Code session and you should see the statusline:

```
## Statusline

  main  ~/src  [████████░░░░] 52% (104K/200K)
```

## Troubleshooting

### Statusline not appearing
- Check that hooks are executable: `bun run build`
- Verify `.claude-plugin/plugin.json` exists
- Check Claude Code logs for errors

### Git information not showing
- Ensure you're in a git repository
- Check that git is installed: `git --version`

### Unicode icons showing as boxes
- Set `showIcons: false` in configuration
- Use a modern terminal (Windows Terminal, iTerm2, etc.)

## Development

```bash
# Install dependencies
bun install

# Run tests
bun test

# Build
bun run build

# Watch mode for development
bun run dev

# Lint
bun run lint
bun run lint:fix
```
