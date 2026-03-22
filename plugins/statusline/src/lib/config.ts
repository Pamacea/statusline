/**
 * Configuration management for Statusline plugin
 * Cross-platform: Windows, macOS, Linux
 */

import { existsSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { StatuslineConfig } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Default configuration
 */
export const defaultConfig: StatuslineConfig = {
  features: {
    usageLimits: true,
    spendTracking: true,
  },
  oneLine: false,
  showSonnetModel: false,
  pathDisplayMode: "truncated",
  git: {
    enabled: true,
    showBranch: true,
    showDirtyIndicator: true,
    showChanges: true,
    showStaged: false,
    showUnstaged: false,
  },
  separator: "|",
  session: {
    infoSeparator: "•",
    cost: { enabled: true, format: "decimal1" },
    duration: { enabled: true },
    tokens: { enabled: true, showMax: true, showDecimals: true },
    percentage: {
      enabled: true,
      showValue: true,
      progressBar: {
        enabled: true,
        length: 10,
        style: "filled",
        color: "progressive",
        background: "none",
      },
    },
  },
  context: {
    usePayloadContextWindow: true,
    maxContextTokens: 200000,
    autocompactBufferTokens: 0,
    useUsableContextOnly: false,
    overheadTokens: 2000,
  },
  limits: {
    enabled: true,
    showTimeLeft: true,
    showPacingDelta: true,
    cost: { enabled: true, format: "decimal1" },
    percentage: {
      enabled: true,
      showValue: false,
      progressBar: {
        enabled: true,
        length: 10,
        style: "rectangle",
        color: "progressive",
        background: "none",
      },
    },
  },
  weeklyUsage: {
    enabled: "90%",
    showTimeLeft: true,
    showPacingDelta: true,
    cost: { enabled: true, format: "decimal1" },
    percentage: {
      enabled: true,
      showValue: false,
      progressBar: {
        enabled: true,
        length: 10,
        style: "rectangle",
        color: "progressive",
        background: "none",
      },
    },
  },
  dailySpend: {
    cost: { enabled: true, format: "decimal1" },
  },
  vim: {
    enabled: true,
    showLabel: true,
    activeText: "Vim",
    inactiveText: "Normal",
    colorWhenActive: "green",
    colorWhenInactive: "gray",
  },
  cache: {
    enabled: true,
    showLabel: true,
    format: "percentage",
    prefix: "C:",
    progressBar: {
      enabled: true,
      length: 10,
      style: "filled",
      color: "progressive",
      background: "none",
    },
    colorThresholds: {
      low: 30,
      medium: 60,
      high: 90,
    },
  },
};

/**
 * Get home directory cross-platform
 */
export function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || "";
}

/**
 * Get config directory paths
 */
export function getConfigPaths(): { configDir: string; defaultsPath: string; configPath: string } {
  // In production, config is in ~/.claude/scripts/statusline/
  const homeDir = getHomeDir();
  const configDir = join(homeDir, ".claude", "scripts", "statusline");
  const defaultsPath = join(configDir, "defaults.json");
  const configPath = join(configDir, "statusline.config.json");

  return { configDir, defaultsPath, configPath };
}

/**
 * Load configuration from file or return defaults
 */
export async function loadConfig(): Promise<StatuslineConfig> {
  const { defaultsPath, configPath } = getConfigPaths();

  // Try to load user config first
  try {
    if (existsSync(configPath)) {
      const content = readFileSync(configPath, "utf-8");
      const userConfig = JSON.parse(content);
      return { ...defaultConfig, ...userConfig };
    }
  } catch {
    // Continue to defaults
  }

  // Try to load defaults
  try {
    if (existsSync(defaultsPath)) {
      const content = readFileSync(defaultsPath, "utf-8");
      const defaults = JSON.parse(content);
      return { ...defaultConfig, ...defaults };
    }
  } catch {
    // Use hardcoded defaults
  }

  return defaultConfig;
}

/**
 * Synchronous config load for compatibility
 */
export function loadConfigSync(): StatuslineConfig {
  const { defaultsPath, configPath } = getConfigPaths();

  // Try to load user config first
  try {
    if (existsSync(configPath)) {
      const content = readFileSync(configPath, "utf-8");
      const userConfig = JSON.parse(content);
      return { ...defaultConfig, ...userConfig };
    }
  } catch {
    // Continue to defaults
  }

  // Try to load defaults
  try {
    if (existsSync(defaultsPath)) {
      const content = readFileSync(defaultsPath, "utf-8");
      const defaults = JSON.parse(content);
      return { ...defaultConfig, ...defaults };
    }
  } catch {
    // Use hardcoded defaults
  }

  return defaultConfig;
}

/**
 * Model context window sizes (in tokens)
 * Maps model ID patterns to their context window size
 */
const MODEL_CONTEXT_SIZES: Record<string, number> = {
  // Claude Opus 4.6 — 1M context
  "claude-opus-4-6": 1000000,
  "claude-opus-4-6[1m]": 1000000,
  // Claude Opus 4.5 — 200k default, 1M with [1m]
  "claude-opus-4-5": 200000,
  "claude-opus-4-5[1m]": 1000000,
  // Claude Sonnet 4.6 — 200k default, 1M with [1m]
  "claude-sonnet-4-6": 200000,
  "claude-sonnet-4-6[1m]": 1000000,
  // Claude Sonnet 4.5 — 200k
  "claude-sonnet-4-5": 200000,
  // Claude Haiku 4.5 — 200k
  "claude-haiku-4-5": 200000,
  // GLM 5
  "glm-5": 200000,
  "glm-5-plus": 200000,
  // GLM 4 — 200k
  "glm-4": 200000,
  "glm-4-plus": 200000,
  "glm-4-long": 1000000,
  "glm-4.7": 200000,
};

/**
 * Model pricing (USD per million tokens)
 * { input: $/M input, output: $/M output }
 */
interface ModelPricing {
  input: number;
  output: number;
}

const MODEL_PRICING: Record<string, ModelPricing> = {
  // Claude Opus — $15/M input, $75/M output
  "claude-opus-4-6": { input: 15, output: 75 },
  "claude-opus-4-5": { input: 15, output: 75 },
  // Claude Sonnet — $3/M input, $15/M output
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-sonnet-4-5": { input: 3, output: 15 },
  // Claude Haiku — $0.80/M input, $4/M output
  "claude-haiku-4-5": { input: 0.8, output: 4 },
  // GLM 5
  "glm-5": { input: 0.5, output: 2 },
  "glm-5-plus": { input: 1, output: 4 },
  // GLM 4
  "glm-4": { input: 0.4, output: 1.6 },
  "glm-4-plus": { input: 0.5, output: 2 },
  "glm-4-long": { input: 0.4, output: 1.6 },
  "glm-4.7": { input: 0.5, output: 2 },
};

const DEFAULT_PRICING: ModelPricing = { input: 3, output: 15 };

/**
 * Resolve pricing from model identifier
 */
export function resolveModelPricing(modelId: string): ModelPricing {
  // Exact match
  if (MODEL_PRICING[modelId]) return MODEL_PRICING[modelId];

  // Strip [1m] suffix for pricing lookup
  const cleanId = modelId.replace(/\[1m\]/, "");
  if (MODEL_PRICING[cleanId]) return MODEL_PRICING[cleanId];

  // Prefix match
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (modelId.startsWith(key)) return pricing;
  }

  // Pattern-based fallback
  if (modelId.includes("opus")) return { input: 15, output: 75 };
  if (modelId.includes("haiku")) return { input: 0.8, output: 4 };
  if (modelId.includes("sonnet")) return { input: 3, output: 15 };
  if (modelId.includes("glm-5-plus")) return { input: 1, output: 4 };
  if (modelId.includes("glm-5")) return { input: 0.5, output: 2 };
  if (modelId.includes("glm")) return { input: 0.5, output: 2 };

  return DEFAULT_PRICING;
}

/**
 * Resolve context window size from model identifier
 * Handles exact matches, prefix matches, and [1m] suffix
 */
function resolveModelContextSize(modelId: string): number | null {
  // Exact match
  if (MODEL_CONTEXT_SIZES[modelId] !== undefined) {
    return MODEL_CONTEXT_SIZES[modelId];
  }

  // Check for [1m] suffix pattern (e.g. "opus[1m]", "sonnet[1m]")
  if (modelId.includes("[1m]")) {
    return 1000000;
  }

  // Prefix match (e.g. "claude-opus-4-6-20260301" matches "claude-opus-4-6")
  for (const [key, size] of Object.entries(MODEL_CONTEXT_SIZES)) {
    if (modelId.startsWith(key)) {
      return size;
    }
  }

  // Pattern-based matching for model families
  if (modelId.includes("opus-4-6") || modelId.includes("opus-4.6")) return 1000000;
  if (modelId.includes("opus-4-5") || modelId.includes("opus-4.5")) return 200000;
  if (modelId.includes("sonnet-4-6") || modelId.includes("sonnet-4.6")) return 200000;
  if (modelId.includes("sonnet-4-5") || modelId.includes("sonnet-4.5")) return 200000;
  if (modelId.includes("haiku")) return 200000;
  if (modelId.includes("glm-4-long")) return 1000000;
  if (modelId.includes("glm")) return 200000;

  return null;
}

/**
 * Update config based on detected model
 * Adjusts maxContextTokens according to the model's context window
 */
export function updateConfigForModel(
  config: StatuslineConfig,
  model: string | { id: string; display_name?: string },
): StatuslineConfig {
  const modelId = typeof model === "string" ? model : model.id;
  const contextSize = resolveModelContextSize(modelId);

  if (contextSize === null) {
    return config;
  }

  return {
    ...config,
    context: {
      ...config.context,
      maxContextTokens: contextSize,
    },
  };
}

export type { StatuslineConfig } from "./types.js";
