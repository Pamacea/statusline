/**
 * Progress bar rendering utilities for Statusline plugin
 */

import type { ProgressBarSegment } from "../../src/lib/types.ts";
import { PROGRESS_CHARS, ANSI_COLORS } from "../../src/lib/types.ts";

/**
 * Create progress bar segment
 */
export function createProgressBar(
  percentage: number,
  width: number,
  useUnicode = true,
): ProgressBarSegment {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clampedPercentage / 100) * width);
  const empty = width - filled;

  let color = "high";
  if (clampedPercentage >= 75) color = "low";
  else if (clampedPercentage >= 25) color = "medium";

  return { filled, empty, color };
}

/**
 * Render progress bar as string
 */
export function renderProgressBar(
  segment: ProgressBarSegment,
  useUnicode = true,
  useColors = true,
): string {
  const chars = useUnicode ? PROGRESS_CHARS.unicode : PROGRESS_CHARS.ascii;
  const bar = chars.filled.repeat(segment.filled) + chars.empty.repeat(segment.empty);

  if (!useColors) {
    return `[${bar}]`;
  }

  const colorCode = getColorCode(segment.color);
  return `${colorCode}[${bar}]${ANSI_COLORS.reset}`;
}

/**
 * Get ANSI color code for progress bar state
 */
function getColorCode(state: string): string {
  switch (state) {
    case "low":
      return ANSI_COLORS.bright_red;
    case "medium":
      return ANSI_COLORS.bright_yellow;
    case "high":
      return ANSI_COLORS.bright_green;
    default:
      return ANSI_COLORS.reset;
  }
}

/**
 * Render compact progress bar (no brackets)
 */
export function renderCompactProgressBar(
  segment: ProgressBarSegment,
  useUnicode = true,
): string {
  const chars = useUnicode ? PROGRESS_CHARS.unicode : PROGRESS_CHARS.ascii;
  return chars.filled.repeat(segment.filled) + chars.empty.repeat(segment.empty);
}

/**
 * Render progress bar with custom fill character
 */
export function renderCustomProgressBar(
  filled: number,
  empty: number,
  filledChar: string,
  emptyChar: string,
): string {
  return `[${filledChar.repeat(filled)}${emptyChar.repeat(empty)}]`;
}

/**
 * Parse progress bar percentage
 */
export function parseProgressPercentage(current: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((current / max) * 100);
}

/**
 * Create multi-style progress bar (gradient effect)
 */
export function renderGradientProgressBar(
  percentage: number,
  width: number,
  useUnicode = true,
): string {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const filled = Math.round((clampedPercentage / 100) * width);
  const empty = width - filled;

  const chars = useUnicode ? PROGRESS_CHARS.unicode : PROGRESS_CHARS.ascii;

  // Create gradient effect with different shades
  const greenPart = Math.floor(filled * 0.5);
  const yellowPart = Math.floor(filled * 0.3);
  const redPart = filled - greenPart - yellowPart;

  let bar = "";
  bar += `${ANSI_COLORS.bright_green}${chars.filled.repeat(greenPart)}`;
  bar += `${ANSI_COLORS.bright_yellow}${chars.filled.repeat(yellowPart)}`;
  bar += `${ANSI_COLORS.bright_red}${chars.filled.repeat(Math.max(0, redPart))}`;
  bar += `${ANSI_COLORS.bright_white}${chars.empty.repeat(empty)}`;
  bar += ANSI_COLORS.reset;

  return `[${bar}]`;
}

/**
 * Create spinner-style progress indicator
 */
export function renderSpinner(progress: number, useUnicode = true): string {
  const spinners = useUnicode
    ? ["◐", "◓", "◑", "◒"]
    : ["|", "/", "-", "\\"];

  const index = Math.floor((progress / 100) * spinners.length) % spinners.length;
  return spinners[index];
}

/**
 * Format percentage with color
 */
export function formatPercentage(
  percentage: number,
  useColors = true,
): string {
  const color = percentage >= 75
    ? ANSI_COLORS.bright_red
    : percentage >= 25
    ? ANSI_COLORS.bright_yellow
    : ANSI_COLORS.bright_green;

  const colored = useColors ? `${color}${percentage}%${ANSI_COLORS.reset}` : `${percentage}%`;
  return colored;
}
