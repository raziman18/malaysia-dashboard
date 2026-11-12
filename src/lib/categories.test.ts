import { describe, expect, it } from "vitest";
import { categoryFromHash } from "./categories";

describe("categoryFromHash", () => {
  it("reads a known category from the address", () => {
    expect(categoryFromHash("#economy")).toBe("economy");
    expect(categoryFromHash("#sources")).toBe("sources");
  });

  it("shows everything for an empty or unknown address", () => {
    expect(categoryFromHash("")).toBe("all");
    expect(categoryFromHash("#")).toBe("all");
    expect(categoryFromHash("#weather")).toBe("all");
  });
});
