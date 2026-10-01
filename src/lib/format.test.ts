import { describe, expect, it } from "vitest";
import { formatDateTime, formatVnd, initials } from "./format";

describe("formatters", () => {
  it("formats whole-number Vietnamese dong amounts", () => {
    expect(formatVnd(1500000)).toMatch(/1[.\s]500[.\s]000\s₫/);
  });

  it("uses the Ho Chi Minh City timezone", () => {
    expect(formatDateTime("2026-10-01T00:00:00Z")).toContain("07:00");
  });

  it("creates compact initials", () => {
    expect(initials("Taylor Swift")).toBe("TS");
  });
});
