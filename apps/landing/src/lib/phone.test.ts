import { describe, it, expect } from "vitest";
import { normalizeEastAfricaPhone } from "./phone";

describe("normalizeEastAfricaPhone", () => {
  it("accepts Kenya local format", () => {
    const r = normalizeEastAfricaPhone("0740824474");
    expect(r.valid).toBe(true);
    expect(r.e164).toBe("+254740824474");
    expect(r.region).toBe("KE");
  });

  it("accepts Kenya international format", () => {
    const r = normalizeEastAfricaPhone("+254 740 824 474");
    expect(r.valid).toBe(true);
    expect(r.e164).toBe("+254740824474");
  });

  it("rejects invalid region", () => {
    const r = normalizeEastAfricaPhone("+1 555 123 4567");
    expect(r.valid).toBe(false);
  });

  it("allows empty phone", () => {
    const r = normalizeEastAfricaPhone("");
    expect(r.valid).toBe(true);
    expect(r.e164).toBeNull();
  });
});
