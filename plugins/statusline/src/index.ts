#!/usr/bin/env node
/**
 * Claude Code Statusline - Enhanced Version
 *
 * Features:
 * - Git status with branch, dirty indicator, changes
 * - Path display (full, truncated, basename)
 * - Token usage with progress bar
 * - Session cost and duration
 * - Cross-platform (Windows, macOS, Linux)
 * - Hook-based input (reads JSON from stdin)
 *
 * Usage:
 *   1. Copy this script to ~/.claude/statusline.js
 *   2. Add to ~/.claude/settings.json:
 *      {
 *        "statusLine": {
 *          "type": "command",
 *          "command": "node ~/.claude/statusline.js"
 *        }
 *      }
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getHomeDir, loadConfigSync, updateConfigForModel } from "./lib/config.js";
import { getContextDataSync } from "./lib/context.js";
import { getGitStatusSync, type GitStatus } from "./lib/git.js";
import { renderStatuslineRaw, type RawStatuslineData } from "./lib/render.js";
import type { HookInput } from "./lib/types.js";

// Re-export GitStatus type for backward compatibility
export type { GitStatus };

// Paths
const HOME_DIR = getHomeDir();
const CONFIG_DIR = join(HOME_DIR, ".claude");
const CONFIG_FILE = join(CONFIG_DIR, "settings.json");

// ─────────────────────────────────────────────────────────────
// INPUT HANDLING - Hook input or fallback
// ─────────────────────────────────────────────────────────────

/**
 * Read hook input from stdin
 */
function readStdin(): Promise<HookInput | null> {
  return new Promise((resolve) => {
    let data = "";

    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      try {
        const input = JSON.parse(data) as HookInput;
        resolve(input);
      } catch {
        resolve(null);
      }
    });

    // Timeout after 100ms if no data
    setTimeout(() => {
      if (!data) resolve(null);
    }, 100);
  });
}

/**
 * Get fallback input when hook input is not available
 */
function getFallbackInput(): Partial<HookInput> {
  const cwd = process.cwd();

  return {
    cwd,
    model: { id: "unknown", display_name: "Claude" },
    workspace: {
      current_dir: cwd,
      project_dir: cwd,
    },
    cost: {
      total_cost_usd: 0,
      total_duration_ms: 0,
      total_api_duration_ms: 0,
      total_lines_added: 0,
      total_lines_removed: 0,
    },
    version: "0.0.0",
    output_style: { name: "auto" },
  };
}

/**
 * Get transcript path from input or environment
 */
function getTranscriptPath(input: Partial<HookInput>): string | null {
  if (input.transcript_path) return input.transcript_path;

  // Try common transcript locations
  const possiblePaths = [
    join(HOME_DIR, ".claude", "transcript.jsonl"),
    join(HOME_DIR, ".claude", "transcripts", "current.jsonl"),
    join(HOME_DIR, ".config", "claude", "transcript.jsonl"),
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) return path;
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// USAGE LIMITS - Optional feature
// ─────────────────────────────────────────────────────────────

/**
 * Get usage limits (placeholder for future implementation)
 */
function getUsageLimits(): {
  five_hour: { utilization: number; resets_at: string | null } | null;
  seven_day: { utilization: number; resets_at: string | null } | null;
} {
  return {
    five_hour: null,
    seven_day: null,
  };
}

// ─────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────────────────────

async function main() {
  let input: Partial<HookInput> | null;

  try {
    input = await readStdin();
  } catch {
    input = null;
  }

  // Fall back to environment-based input
  if (!input || !input.workspace) {
    input = getFallbackInput();
  }

  let config = loadConfigSync();

  // Update context window size based on model
  if (input?.model) {
    config = updateConfigForModel(config, input.model);
  }

  const cwd = input?.workspace?.current_dir || process.cwd();

  // Get git status
  const gitStatus = getGitStatusSync(cwd);

  // Get context data
  const transcriptPath = getTranscriptPath(input);
  let contextTokens: number | null = null;
  let contextPercentage: number | null = null;

  if (transcriptPath) {
    const contextData = getContextDataSync({
      transcriptPath,
      maxContextTokens: config.context.maxContextTokens,
      autocompactBufferTokens: config.context.autocompactBufferTokens,
      useUsableContextOnly: config.context.useUsableContextOnly,
      overheadTokens: config.context.overheadTokens,
    });
    contextTokens = contextData.tokens;
    contextPercentage = contextData.percentage;
  }

  // Check for payload context window (from Claude Code hook)
  if (
    input?.context_window?.current_usage &&
    config.context.usePayloadContextWindow
  ) {
    const currentUsage = input.context_window.current_usage;
    contextTokens =
      (currentUsage.input_tokens || 0) +
      (currentUsage.cache_creation_input_tokens || 0) +
      (currentUsage.cache_read_input_tokens || 0);

    const maxTokens =
      input.context_window.context_window_size ||
      config.context.maxContextTokens;
    contextPercentage = Math.min(100, Math.round((contextTokens / maxTokens) * 100));
  }

  // Convert GitStatus to RawGitData format
  const gitData = gitStatus.branch === "no-git" ? null : {
    branch: gitStatus.branch,
    dirty: gitStatus.hasChanges,
    staged: {
      files: gitStatus.staged.files,
      added: gitStatus.staged.added,
      deleted: gitStatus.staged.deleted,
    },
    unstaged: {
      files: gitStatus.unstaged.files,
      added: gitStatus.unstaged.added,
      deleted: gitStatus.unstaged.deleted,
    },
  };

  // Build raw data
  const rawData: RawStatuslineData = {
    git: gitData,
    path: input?.workspace?.current_dir || cwd,
    modelName: input?.model?.display_name || "Claude",
    cost: input?.cost?.total_cost_usd || 0,
    durationMs: input?.cost?.total_duration_ms || 0,
    contextTokens,
    contextPercentage,
    usageLimits: getUsageLimits(),
  };

  // Render statusline
  const output = renderStatuslineRaw(rawData, config);

  console.log(output);

  // Add newline for two-line mode
  if (!config.oneLine) {
    console.log("");
  }
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
