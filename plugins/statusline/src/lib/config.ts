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

export type { StatuslineConfig } from "./types.js";
