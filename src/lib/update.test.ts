import { describe, expect, it } from "vitest";
import { compareVersions } from "./update";

describe("compareVersions", () => {
  it("compares numerically, not lexically", () => {
    expect(compareVersions("2.10.0", "2.9.9")).toBe(1);
    expect(compareVersions("v2.0.0", "2.0.0")).toBe(0);
    expect(compareVersions("1.9.0", "2.0.0")).toBe(-1);
  });
  it("orders pre-releases before the release", () => {
    expect(compareVersions("2.0.0-beta.1", "2.0.0")).toBe(-1);
    expect(compareVersions("2.0.0", "2.0.0-rc.1")).toBe(1);
  });
});
