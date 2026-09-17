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

test("sends photo uploads as multipart data without a JSON content type", async () => {
  const body = new FormData();
  body.append("image", new File(["photo"], "meal.png", { type: "image/png" }));
  const fetch = vi
    .fn()
    .mockResolvedValueOnce({ ok: true, status: 204 })
    .mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ image_url: "/storage/food-images/meal.png" }),
    });
  vi.stubGlobal("fetch", fetch);
  await api("admin/food-images", { method: "POST", body });
  const options = fetch.mock.calls[1][1];
  expect(options.body).toBe(body);
  expect(options.headers["Content-Type"]).toBeUndefined();
});
