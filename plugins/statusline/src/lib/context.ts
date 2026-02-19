/**
 * Context token tracking from transcript
 */

import { existsSync } from "fs";
import { readFile } from "fs/promises";

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface TranscriptLine {
  message?: { usage?: TokenUsage };
  timestamp?: string;
  isSidechain?: boolean;
  isApiErrorMessage?: boolean;
}

export interface ContextResult {
  tokens: number;
  percentage: number;
  durationMs?: number;  // Session duration in milliseconds
}

export interface ContextDataParams {
  transcriptPath: string;
  maxContextTokens: number;
  autocompactBufferTokens: number;
  useUsableContextOnly?: boolean;
  overheadTokens?: number;
}

/**
 * Get session duration from transcript file
 */
export function getSessionDuration(transcriptPath: string): number {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return 0;
  }

  try {
    const content = require("fs").readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n");

    if (lines.length === 0) return 0;

    let firstTimestamp: Date | null = null;
    let lastTimestamp: Date | null = null;

    for (const line of lines) {
      try {
        const data = JSON.parse(line) as TranscriptLine;

        if (!data.timestamp) continue;

        const entryTime = new Date(data.timestamp);

        if (!firstTimestamp || entryTime < firstTimestamp) {
          firstTimestamp = entryTime;
        }

        if (!lastTimestamp || entryTime > lastTimestamp) {
          lastTimestamp = entryTime;
        }
      } catch {
        // Skip invalid lines
      }
    }

    if (firstTimestamp && lastTimestamp) {
      return lastTimestamp.getTime() - firstTimestamp.getTime();
    }
  } catch {
    // Ignore errors
  }

  return 0;
}

/**
 * Get context length from transcript file
 */
export async function getContextLength(transcriptPath: string): Promise<number> {
  try {
    const content = await readFile(transcriptPath, "utf-8");
    const lines = content.trim().split("\n");

    if (lines.length === 0) return 0;

    let mostRecentMainChainEntry: TranscriptLine | null = null;
    let mostRecentTimestamp: Date | null = null;

    for (const line of lines) {
      try {
        const data = JSON.parse(line) as TranscriptLine;

        if (!data.message?.usage) continue;
        if (data.isSidechain === true) continue;
        if (data.isApiErrorMessage === true) continue;
        if (!data.timestamp) continue;

        const entryTime = new Date(data.timestamp);
        if (!mostRecentTimestamp || entryTime > mostRecentTimestamp) {
          mostRecentTimestamp = entryTime;
          mostRecentMainChainEntry = data;
        }
      } catch {
        // Skip invalid JSON lines
      }
    }

    if (!mostRecentMainChainEntry?.message?.usage) {
      return 0;
    }

    const usage = mostRecentMainChainEntry.message.usage;
    return (
      (usage.input_tokens || 0) +
      (usage.cache_read_input_tokens ?? 0) +
      (usage.cache_creation_input_tokens ?? 0)
    );
  } catch {
    return 0;
  }
}

/**
 * Get context data (tokens and percentage)
 */
export async function getContextData({
  transcriptPath,
  maxContextTokens,
  autocompactBufferTokens,
  useUsableContextOnly = false,
  overheadTokens = 0,
}: ContextDataParams): Promise<ContextResult> {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { tokens: 0, percentage: 0 };
  }

  const contextLength = await getContextLength(transcriptPath);
  let totalTokens = contextLength + overheadTokens;

  // If useUsableContextOnly is true, add the autocompact buffer to displayed tokens
  if (useUsableContextOnly) {
    totalTokens += autocompactBufferTokens;
  }

  // Always calculate percentage based on max context window
  // (matching /context display behavior)
  const percentage = Math.min(100, (totalTokens / maxContextTokens) * 100);

  return {
    tokens: totalTokens,
    percentage: Math.round(percentage),
  };
}

/**
 * Synchronous version for compatibility
 */
export function getContextDataSync({
  transcriptPath,
  maxContextTokens,
  autocompactBufferTokens = 0,
  useUsableContextOnly = false,
  overheadTokens = 0,
}: ContextDataParams): ContextResult {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { tokens: 0, percentage: 0 };
  }

  try {
    const content = require("fs").readFileSync(transcriptPath, "utf-8");
    const lines = content.trim().split("\n");

    if (lines.length === 0) return { tokens: 0, percentage: 0 };

    let contextLength = 0;

    for (const line of lines) {
      try {
        const data = JSON.parse(line) as TranscriptLine;

        if (!data.message?.usage) continue;
        if (data.isSidechain === true) continue;
        if (data.isApiErrorMessage === true) continue;

        const usage = data.message.usage;
        contextLength =
          (usage.input_tokens || 0) +
          (usage.cache_read_input_tokens ?? 0) +
          (usage.cache_creation_input_tokens ?? 0);
      } catch {
        // Skip invalid lines
      }
    }

    let totalTokens = contextLength + overheadTokens;

    if (useUsableContextOnly) {
      totalTokens += autocompactBufferTokens;
    }

    const percentage = Math.min(100, (totalTokens / maxContextTokens) * 100);

    return {
      tokens: totalTokens,
      percentage: Math.round(percentage),
      durationMs: getSessionDuration(transcriptPath),
    };
  } catch {
    return { tokens: 0, percentage: 0, durationMs: 0 };
  }
}
