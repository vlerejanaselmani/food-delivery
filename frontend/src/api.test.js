import { test, expect, vi, afterEach } from "vitest";
import { api } from "./api";
afterEach(() => vi.unstubAllGlobals());
test("surfaces field validation errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ errors: { email: ["Email is already taken."] } }),
    }),
  );
  await expect(api("user")).rejects.toThrow("Email is already taken.");
});
test("accepts successful delete responses without a JSON body", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 204 })
      .mockResolvedValueOnce({ ok: true, status: 204 }),
  );
  await expect(api("admin/foods/1", { method: "DELETE" })).resolves.toEqual({});
});
