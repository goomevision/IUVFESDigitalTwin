import { describe, expect, it } from "vitest";

const { isAllowedOAuthReturnTo } = await import("./_core/oauth");

describe("oauth return target", () => {
  it("allows the canonical GitHub Pages origin", () => {
    expect(isAllowedOAuthReturnTo("https://goomevision.github.io")).toBe(true);
    expect(isAllowedOAuthReturnTo("https://goomevision.github.io/knowledge")).toBe(true);
  });

  it("rejects non-HTTPS and unallowlisted origins", () => {
    expect(isAllowedOAuthReturnTo("http://goomevision.github.io")).toBe(false);
    expect(isAllowedOAuthReturnTo("https://example.com")).toBe(false);
    expect(isAllowedOAuthReturnTo("javascript:alert(1)")).toBe(false);
  });

  it("rejects credential-bearing and fragment-bearing return URLs", () => {
    expect(isAllowedOAuthReturnTo("https://user:pass@goomevision.github.io")).toBe(false);
    expect(isAllowedOAuthReturnTo("https://goomevision.github.io/#token")).toBe(false);
  });
});
