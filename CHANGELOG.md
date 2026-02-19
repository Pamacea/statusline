# Changelog

All notable changes to the Claude Code Statusline plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.2] - 2025-02-19

### Added

- Session duration tracking - displays time from first to last message
- Model version extraction - shows "4.7" instead of full model name
- Enhanced progress bar with `━╸─` characters
- Standalone script with real-time session tracking

### Changed

- **BREAKING**: Reorganized display order
  - Model now appears after git changes (before progress bar)
  - Cost appears after model (before progress bar)
  - Session duration appears at the end
- Removed "S:" prefix from model display
- Improved git changes display with better separation
- Enhanced token tracking with real-time data from session files

### Fixed

- Token tracking now reads actual session data instead of estimates
- Git file count display shows correct staged/unstaged files
- Progress bar colors now properly scale with percentage

---

## [0.6.1] - 2025-02-19

### Added

- Standalone script (`statusline-standalone.mjs`) for direct installation
- Real-time token tracking from session files
- Model version extraction and display
- Cost calculation with 4-decimal precision for small amounts
- Session duration tracking
- Cross-platform support (Windows, macOS, Linux)

---

## [0.6.0] - 2025-02-19

### Added

- Enhanced git display with staged/unstaged changes separation
  - Staged changes in cyan
  - Unstaged changes in green/red/yellow
- Modified files count display `[X]`
- Model version extraction (shows "4.5" instead of "Claude Sonnet 4.5")
- Improved progress bar with dynamic colors
- Better visual separators using `▸`
- Compact duration format (1h30m instead of 1h 30m)

### Changed

- Activated `showStaged` and `showUnstaged` by default
- Increased default progress bar length from 10 to 15
- Updated default separator to `▸`

### Fixed

- Token tracking accuracy improvements
- Progress bar character rendering
- Color consistency across different terminal types

---

## [0.5.0] - 2025-02-19

### Added

- Initial release
- Git branch and status display
- Token usage tracking
- Progress bar with multiple styles
- Cost tracking per session
- Session duration display
- Cross-platform support
- Plugin marketplace integration
