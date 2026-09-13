import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parsePoolPage } from "@/src/lib/lcsd";

const victoria = {
  swpId: 5,
  name: "Victoria Park Swimming Pool",
  enabled: true,
} as const;

const morrison = {
  swpId: 4,
  name: "Morrison Hill Swimming Pool",
  enabled: true,
} as const;

function fixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, "fixtures", name), "utf8");
}

describe("LCSD parser", () => {
  it("parses dated temporary closure notices", () => {
    const notices = parsePoolPage(fixture("victoria.html"), victoria);

    expect(notices).toHaveLength(2);
    expect(notices[0]).toMatchObject({
      poolName: "Victoria Park Swimming Pool",
      facilities: "Main Pool , Multi-purpose Pool",
      reason: "School Swimming Gala",
    });
    expect(notices[0].endAt).not.toBeNull();
  });

  it("preserves partial facilities and open-ended notices", () => {
    const notices = parsePoolPage(fixture("morrison.html"), morrison);

    expect(notices).toHaveLength(1);
    expect(notices[0].facilities).toBe("Training Pool, Toddlers' Pool");
    expect(notices[0].endAt).toBeNull();
  });
});
