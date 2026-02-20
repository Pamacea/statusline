/**
 * Type definitions for the enhanced Statusline plugin
 */

/**
 * Hook input from Claude Code (via stdin)
 */
export interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  model: {
    id: string;
    display_name: string;
  };
  workspace: {
    current_dir: string;
    project_dir: string;
  };
  version: string;
  output_style: {
    name: string;
  };
  cost: {
    total_cost_usd: number;
    total_duration_ms: number;
    total_api_duration_ms: number;
    total_lines_added: number;
    total_lines_removed: number;
  };
  context_window?: {
    total_input_tokens: number;
    total_output_tokens: number;
    context_window_size: number;
    current_usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  exceeds_200k_tokens?: boolean;
}

/**
 * Git status information
 */
export interface GitStatus {
  branch: string;
  hasChanges: boolean;
  staged: {
    added: number;
    deleted: number;
    files: number;
  };
  unstaged: {
    added: number;
    deleted: number;
    files: number;
  };
}

/**
 * Usage limit information
 */
export interface UsageLimit {
  utilization: number;
  resets_at: string | null;
}

/**
 * Raw statusline data (before formatting)
 */
export interface RawStatuslineData {
  git: GitStatus | null;
  path: string;
  modelName: string;
  cost: number;
  durationMs: number;
  contextTokens: number | null;
  contextPercentage: number | null;
  cachePercentage?: number | null;
  usageLimits?: {
    five_hour: UsageLimit | null;
    seven_day: UsageLimit | null;
  };
  periodCost?: number;
  todayCost?: number;
  vimModeActive?: boolean;
}

/**
 * Formatted statusline data (for backward compatibility)
 */
export interface StatuslineData {
  branch: string;
  dirPath: string;
  modelName: string;
  sessionCost: string;
  sessionDuration: string;
  contextTokens: number | null;
  contextPercentage: number | null;
  usageLimits?: {
    five_hour: UsageLimit | null;
    seven_day: UsageLimit | null;
  };
  periodCost?: number;
  todayCost?: number;
}

/**
 * Cost format options
 */
export type CostFormat = "integer" | "decimal1" | "decimal2";

/**
 * Progress bar style options
 */
export type ProgressBarStyle = "filled" | "rectangle" | "braille";

/**
 * Progress bar color options
 */
export type ProgressBarColor =
  | "progressive"
  | "green"
  | "yellow"
  | "red"
  | "peach"
  | "black"
  | "white";

/**
 * Progress bar background options
 */
export type ProgressBarBackground =
  | "none"
  | "dark"
  | "gray"
  | "light"
  | "blue"
  | "purple"
  | "cyan"
  | "peach";

/**
 * Separator options
 */
export type Separator =
  | "|"
  | "•"
  | "·"
  | "⋅"
  | "●"
  | "◆"
  | "▪"
  | "▸"
  | "›"
  | "→";

/**
 * Path display mode
 */
export type PathDisplayMode = "full" | "truncated" | "basename";

/**
 * Cost configuration
 */
export interface CostConfig {
  enabled: boolean;
  format: CostFormat;
}

/**
 * Progress bar configuration
 */
export interface ProgressBarConfig {
  enabled: boolean;
  length: 5 | 10 | 15;
  style: ProgressBarStyle;
  color: ProgressBarColor;
  background: ProgressBarBackground;
}

/**
 * Percentage configuration
 */
export interface PercentageConfig {
  enabled: boolean;
  showValue: boolean;
  progressBar: ProgressBarConfig;
}

/**
 * Git configuration
 */
export interface GitConfig {
  enabled: boolean;
  showBranch: boolean;
  showDirtyIndicator: boolean;
  showChanges: boolean;
  showStaged: boolean;
  showUnstaged: boolean;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  infoSeparator: Separator | null;
  cost: CostConfig;
  duration: { enabled: boolean };
  tokens: {
    enabled: boolean;
    showMax: boolean;
    showDecimals: boolean;
  };
  percentage: PercentageConfig;
}

/**
 * Context configuration
 */
export interface ContextConfig {
  usePayloadContextWindow: boolean;
  maxContextTokens: number;
  autocompactBufferTokens: number;
  useUsableContextOnly: boolean;
  overheadTokens: number;
}

/**
 * Limits configuration
 */
export interface LimitsConfig {
  enabled: boolean;
  showTimeLeft: boolean;
  showPacingDelta: boolean;
  cost: CostConfig;
  percentage: PercentageConfig;
}

/**
 * Weekly usage configuration
 */
export interface WeeklyUsageConfig {
  enabled: boolean | "90%";
  showTimeLeft: boolean;
  showPacingDelta: boolean;
  cost: CostConfig;
  percentage: PercentageConfig;
}

/**
 * Daily spend configuration
 */
export interface DailySpendConfig {
  cost: CostConfig;
}

/**
 * Vim mode configuration
 */
export interface VimConfig {
  enabled: boolean;
  showLabel: boolean;
  activeText: string;
  inactiveText: string;
  colorWhenActive: string;
  colorWhenInactive: string;
}

/**
 * Vim mode state type
 */
export type VimModeState = 'active' | 'inactive' | null;

/**
 * Cache progress bar configuration
 */
export interface CacheProgressBarConfig {
  enabled: boolean;
  length: 5 | 10 | 15;
  style: ProgressBarStyle;
  color: ProgressBarColor;
  background: ProgressBarBackground;
}

/**
 * Cache color thresholds
 */
export interface CacheColorThresholds {
  low: number;
  medium: number;
  high: number;
}

/**
 * Cache percentage format options
 */
export type CacheFormat = "percentage" | "bar";

/**
 * Cache configuration
 */
export interface CacheConfig {
  enabled: boolean;
  showLabel: boolean;
  format: CacheFormat;
  prefix: string;
  progressBar: CacheProgressBarConfig;
  colorThresholds: CacheColorThresholds;
}

/**
 * Main configuration interface
 */
export interface StatuslineConfig {
  features?: {
    usageLimits?: boolean;
    spendTracking?: boolean;
  };
  oneLine: boolean;
  showSonnetModel: boolean;
  pathDisplayMode: PathDisplayMode;
  git: GitConfig;
  separator: Separator;
  session: SessionConfig;
  context: ContextConfig;
  limits: LimitsConfig;
  weeklyUsage: WeeklyUsageConfig;
  dailySpend: DailySpendConfig;
  vim?: VimConfig;
  cache?: CacheConfig;
}

/**
 * Color function type
 */
export type ColorFunction = (text: string | number) => string;

/**
 * Colors object
 */
export interface Colors {
  green: ColorFunction;
  red: ColorFunction;
  purple: ColorFunction;
  yellow: ColorFunction;
  orange: ColorFunction;
  peach: ColorFunction;
  bgPeach: ColorFunction;
  black: ColorFunction;
  white: ColorFunction;
  gray: ColorFunction;
  dimWhite: ColorFunction;
  lightGray: ColorFunction;
  cyan: ColorFunction;
  blue: ColorFunction;
  bgBlack: ColorFunction;
  bgBlackBright: ColorFunction;
  bgWhite: ColorFunction;
  bgBlue: ColorFunction;
  bgMagenta: ColorFunction;
  bgCyan: ColorFunction;
  dim: ColorFunction;
  bold: ColorFunction;
  hidden: ColorFunction;
  italic: ColorFunction;
  underline: ColorFunction;
  strikethrough: ColorFunction;
  reset: ColorFunction;
  inverse: ColorFunction;
  [key: string]: ColorFunction; // Allow string indexing for dynamic color access
}
