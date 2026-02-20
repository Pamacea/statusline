# Contributing to Statusline Plugin

Thank you for your interest in contributing! This document provides guidelines for contributing to the Statusline plugin.

## Development Setup

1. Fork and clone the repository:
```bash
git clone https://github.com/your-username/statusline.git
cd statusline
```

2. Install dependencies:
```bash
bun install
```

3. Build the project:
```bash
bun run build
```

## Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

## Code Style

This project uses:
- **TypeScript** for type safety
- **ESLint** for linting
- **Prettier** for code formatting

```bash
# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Format code
bun run format
```

## Project Structure

```
statusline/
├── .claude-plugin/          # Plugin metadata
│   └── plugin.json          # Plugin configuration
├── hooks/                   # Hook implementations
│   ├── hooks.json           # Hooks manifest
│   ├── session-start.ts     # SessionStart hook
│   ├── user-prompt-submit.ts # UserPromptSubmit hook
│   └── utils/               # Utility modules
│       ├── command.ts       # Cross-platform command execution
│       ├── display.ts       # Display formatting
│       ├── git.ts           # Git operations
│       ├── progress.ts      # Progress bar rendering
│       └── token.ts         # Token counting
├── src/                     # Source code
│   ├── config.ts            # Configuration management
│   └── types.ts             # TypeScript types
├── test/                    # Tests
│   └── statusline.test.ts   # Unit tests
├── scripts/                 # Utility scripts
│   └── test-plugin.ts       # Manual test script
├── package.json
├── tsconfig.json
└── README.md
```

## Making Changes

1. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and write tests:
```bash
# Edit files
bun run test  # Ensure tests pass
```

3. Build to verify:
```bash
bun run build
```

4. Commit your changes:
```bash
git commit -m "feat: add your feature"
```

5. Push and create a PR:
```bash
git push origin feature/your-feature-name
```

## Commit Convention

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

## Testing Guidelines

- Write tests for new features
- Ensure all tests pass before submitting PR
- Test on multiple platforms (Windows, macOS, Linux) if possible
- Test with different terminal emulators

## Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add your name to contributors list
4. Submit a descriptive PR with:
   - Summary of changes
   - Related issues
   - Screenshots for UI changes

## Questions?

Feel free to open an issue for discussion!
