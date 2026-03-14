#!/usr/bin/env -S bun run
/**
 * PostToolUse Hook for Statusline plugin
 *
 * This hook runs AFTER each tool use (Read, Write, Edit, Bash, etc.)
 * It updates the statusline with real-time token usage and context.
 */

import { loadConfig, updateConfigForModel } from "../src/config.ts";
import { getGitInfo, getFileStats } from "./utils/git.ts";
import { calculateTokenUsage } from "./utils/token.ts";
import {
  buildStatusline,
  createHookOutput,
  formatCompactStatusline,
} from "./utils/display.ts";
import { readStdin, writeStdout, getCwd } from "./utils/io.ts";

/**
 * Main hook function
 */
async function main(): Promise<void> {
  try {
    // Read input from stdin (JSON from Claude Code)
    const input = await readInput();
    const eventName = input.eventName || "PostToolUse";

    // Load configuration
    let config = loadConfig();

    // Update config based on model if provided
    if (input.model) {
      config = updateConfigForModel(config, input.model);
    }

    // Get working directory
    const cwd = input.working_directory || getCwd();

    // Gather statusline information (parallel for speed)
    const [gitInfo, fileStats] = await Promise.all([
      getGitInfo(cwd).catch(() => ({
        branch: "",
        root: cwd,
        currentPath: cwd,
        relativePath: ".",
        dirty: false,
        staged: false,
        commitsAhead: 0,
        commitsBehind: 0,
      })),
      getFileStats(cwd).catch(() => ({
        insertions: 0,
        deletions: 0,
        modifications: 0,
      })),
    ]);

    // Calculate token usage
    const tokenUsage = calculateTokenUsage(
      input.conversation_summary,
      config.maxTokens,
    );

    // Build statusline display
    const display = buildStatusline(gitInfo, fileStats, tokenUsage, config);

    // Create hook output
    const output = createHookOutput(display, tokenUsage, eventName);

    // Write output to stdout
    await writeOutput(output);

    // Log to stderr for debugging
    const compact = formatCompactStatusline(gitInfo, tokenUsage, config);
    console.error(`[Statusline:PostToolUse] ${compact}`);
  } catch (error) {
    // Log error but don't fail the hook
    console.error(`[Statusline:PostToolUse] Error: ${error}`);

    // Return empty output to allow operation to continue
    await writeOutput({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
      },
    });
  }
}

/**
 * Read JSON input from stdin
 */
async function readInput(): Promise<
  | {
      eventName?: string;
      conversation_summary?: string;
      working_directory?: string;
      model?: string;
    }
  | Record<string, unknown>
> {
  const text = await readStdin();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

/**
 * Write JSON output to stdout
 */
async function writeOutput(data: unknown): Promise<void> {
  const text = JSON.stringify(data, null, 0);
  await writeStdout(text);
}

// Run the hook
if (import.meta.main) {
  await main();
}
