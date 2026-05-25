import { describe, it, expect, beforeEach } from "vitest";
import {
  getSignupBusinessName,
  setPendingBusinessName,
  clearPendingBusinessName,
  getPendingBusinessName,
  slugFromBusinessName,
} from "./signup-business";

describe("signup-business", () => {
  beforeEach(() => {
    clearPendingBusinessName();
  });

  it("reads business name from user.name", () => {
    expect(getSignupBusinessName({ name: "Amina's Beauty Studio" })).toBe("Amina's Beauty Studio");
  });

  it("reads business name from user_metadata.name", () => {
    expect(
      getSignupBusinessName({ user_metadata: { name: "Prime Salon" } }),
    ).toBe("Prime Salon");
  });

  it("falls back to pending session storage", () => {
    setPendingBusinessName("Stored Studio");
    expect(getSignupBusinessName(null)).toBe("Stored Studio");
  });

  it("builds slugs from business names", () => {
    expect(slugFromBusinessName("Amina's Beauty Studio")).toBe("amina-s-beauty-studio");
  });

  it("clears pending business name", () => {
    setPendingBusinessName("Test");
    clearPendingBusinessName();
    expect(getPendingBusinessName()).toBe("");
  });
});
