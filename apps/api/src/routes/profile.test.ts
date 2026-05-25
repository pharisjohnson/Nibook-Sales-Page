import { describe, it, expect, vi, beforeEach } from "vitest";

const singleResult = vi.fn();
const limitResult = vi.fn();
const selectChain = vi.fn(() => ({ single: singleResult }));
const eqChain = vi.fn(() => ({ eq: eqChain, neq: neqChain, limit: limitResult }));
const neqChain = vi.fn(() => ({ limit: limitResult }));

const mockDb = {
  database: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: eqChain,
        neq: neqChain,
        limit: limitResult,
        order: vi.fn(() => ({ limit: limitResult })),
        single: singleResult,
      })),
      upsert: vi.fn(() => ({ select: selectChain })),
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: selectChain })) })),
      insert: vi.fn(() => ({ select: selectChain })),
    })),
  },
};

vi.mock("../lib/insforge.js", () => ({
  getInsforgeAdmin: vi.fn(() => mockDb),
  createUserClient: vi.fn(() => mockDb),
}));

import profileRouter from "./profile.js";

function buildRequest(method: string, url: string, body?: unknown, params?: Record<string, string>) {
  const [path] = url.split("?");
  return {
    method,
    path,
    body,
    params: params ?? {},
    headers: { authorization: "Bearer test-jwt-token" },
    query: {},
  } as any;
}

function buildResponse() {
  const res: any = {
    _status: 200,
    _json: null,
    status(code: number) { this._status = code; return this; },
    json(obj: unknown) { this._json = obj; return this; },
  };
  return res;
}

function getPatchHandler() {
  const route = profileRouter.stack.find(
    (r: any) => r.route?.path === "/profile/:id" && r.route?.methods?.patch,
  );
  return route.route.stack[0].handle;
}

describe("PATCH /profile/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should upsert profile with allowed fields", async () => {
    limitResult.mockResolvedValue({ data: [], error: null });
    singleResult.mockResolvedValue({ data: { id: "user-1", business_name: "Test Biz" }, error: null });

    const req = buildRequest("PATCH", "/profile/user-1", {
      business_name: "Test Biz",
      phone: "+254700000000",
      location: "Nairobi",
      category: "Barbershop",
      slug: "test-biz",
    }, { id: "user-1" });
    const res = buildResponse();

    await getPatchHandler()(req, res);

    expect(res._status).toBe(200);
    expect(res._json).toEqual({ data: { id: "user-1", business_name: "Test Biz" } });
  });

  it("should reject fields not in allowed list", async () => {
    limitResult.mockResolvedValue({ data: [], error: null });

    const capturedData: any[] = [];
    const upsertMock = vi.fn((data: any) => {
      capturedData.push(data);
      return { select: selectChain };
    });
    mockDb.database.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: eqChain,
        neq: neqChain,
        limit: limitResult,
        order: vi.fn(() => ({ limit: limitResult })),
        single: singleResult,
      })),
      upsert: upsertMock,
      update: vi.fn(() => ({ eq: vi.fn(() => ({ select: selectChain })) })),
      insert: vi.fn(() => ({ select: selectChain })),
    }));
    singleResult.mockResolvedValue({ data: { id: "user-1" }, error: null });

    const req = buildRequest("PATCH", "/profile/user-1", {
      business_name: "Test Biz",
      is_admin: true,
      secret_key: "should-not-pass",
    }, { id: "user-1" });
    const res = buildResponse();

    await getPatchHandler()(req, res);

    expect(capturedData[0].is_admin).toBeUndefined();
    expect(capturedData[0].secret_key).toBeUndefined();
    expect(capturedData[0].business_name).toBe("Test Biz");
    expect(res._status).toBe(200);
  });

  it("should return 500 on database error", async () => {
    limitResult.mockResolvedValue({ data: [], error: null });
    singleResult.mockResolvedValue({ data: null, error: { message: "Database failure" } });

    const req = buildRequest("PATCH", "/profile/user-1", {
      business_name: "Test Biz",
    }, { id: "user-1" });
    const res = buildResponse();

    await getPatchHandler()(req, res);

    expect(res._status).toBe(500);
    expect(res._json).toEqual({ error: "Database failure" });
  });

  it("should auto-suffix slug if taken", async () => {
    limitResult
      .mockResolvedValueOnce({ data: [{ id: "other-user" }], error: null })
      .mockResolvedValueOnce({ data: [], error: null });
    singleResult.mockResolvedValue({ data: { id: "user-1", slug: "test-biz-1" }, error: null });

    const req = buildRequest("PATCH", "/profile/user-1", {
      business_name: "Test Biz",
      slug: "test-biz",
    }, { id: "user-1" });
    const res = buildResponse();

    await getPatchHandler()(req, res);

    expect(res._status).toBe(200);
  });
});
