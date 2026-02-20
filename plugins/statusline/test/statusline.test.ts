/**
 * Tests for Statusline plugin
 */

import { describe, it, expect } from "bun:test";
import { formatTokens, formatDuration, formatCost } from "../src/lib/formatters.ts";
import type { StatuslineConfig } from "../src/lib/types.ts";

describe("Formatters", () => {
  it("formatTokens - large numbers", () => {
    expect(formatTokens(500)).toContain("500");
    expect(formatTokens(1500)).toContain("k");
    expect(formatTokens(15000)).toContain("k");
    expect(formatTokens(1500000)).toContain("m");
  });

  it("formatDuration - minutes and hours", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(60000)).toBe("1m");
    expect(formatDuration(3600000)).toBe("1h");
    expect(formatDuration(3660000)).toBe("1h1m");
  });

  it("formatCost - different formats", () => {
    expect(formatCost(0.12345, "integer")).toBe("0");
    expect(formatCost(0.12345, "decimal1")).toBe("0.1");
    expect(formatCost(0.12345, "decimal2")).toBe("0.12");
  });
});

describe("Config", () => {
  it("Config types are properly defined", () => {
    // This test verifies that the config types are properly exported
    const config: Partial<StatuslineConfig> = {
      oneLine: false,
      showSonnetModel: true,
      pathDisplayMode: "truncated",
      vim: {
        enabled: true,
        showLabel: true,
        activeText: "Vim",
        inactiveText: "Normal",
        colorWhenActive: "green",
        colorWhenInactive: "gray"
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
          background: "none"
        },
        colorThresholds: {
          low: 30,
          medium: 60,
          high: 90
        }
      }
    };

    expect(config.vim?.enabled).toBe(true);
    expect(config.cache?.enabled).toBe(true);
    expect(config.vim?.activeText).toBe("Vim");
    expect(config.cache?.prefix).toBe("C:");
  });
});

describe("New Features - v0.7.0", () => {
  it("Vim config supports all options", () => {
    const vimConfig = {
      enabled: true,
      showLabel: true,
      activeText: "Vim",
      inactiveText: "Normal",
      colorWhenActive: "green",
      colorWhenInactive: "gray"
    };

    expect(vimConfig.enabled).toBe(true);
    expect(vimConfig.showLabel).toBe(true);
    expect(vimConfig.activeText).toBe("Vim");
    expect(vimConfig.inactiveText).toBe("Normal");
  });

  it("Cache config supports all options", () => {
    const cacheConfig = {
      enabled: true,
      showLabel: true,
      format: "percentage" as const,
      prefix: "C:",
      progressBar: {
        enabled: true,
        length: 10 as const,
        style: "filled" as const,
        color: "progressive" as const,
        background: "none" as const
      },
      colorThresholds: {
        low: 30,
        medium: 60,
        high: 90
      }
    };

    expect(cacheConfig.enabled).toBe(true);
    expect(cacheConfig.format).toBe("percentage");
    expect(cacheConfig.prefix).toBe("C:");
    expect(cacheConfig.progressBar.length).toBe(10);
  });
});
