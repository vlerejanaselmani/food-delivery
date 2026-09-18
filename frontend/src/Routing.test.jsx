import React from "react";
import {
  render,
  within,
  screen,
  fireEvent,
  cleanup,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";
import { api } from "./api";
import { safeReturnTo } from "./Routing";
vi.mock("./api", () => ({ api: vi.fn() }));
const restaurant = {
  id: 1,
  name: "Casa di Pasta",
  cuisine: "Italian",
  description: "Fresh pasta",
  delivery_minutes: 30,
  delivery_fee_cents: 150,
  foods: [{ id: 1, name: "Margherita", category: "Pizza", price_cents: 650 }],
};
const customer = {
  id: 1,
  name: "Arta",
  email: "arta@example.com",
  role: "user",
  city: "Prishtinë",
};
function mockApi(user = null) {
  api.mockImplementation(async (path) => {
    if (path === "user") {
      if (!user)
        throw Object.assign(new Error("Unauthenticated"), { status: 401 });
      return { user };
    }
    if (path === "login") return { user: customer };
    if (path === "restaurants" || path === "admin/restaurants")
      return { data: [restaurant] };
    if (path === "cities") return { data: ["Prishtinë"] };
    if (path === "cart") return { data: { items: [] } };
    if (path === "favorites") return { foods: [], restaurants: [] };
    return { data: [], meta: { last_page: 1 } };
  });
}
function open(path) {
  window.history.replaceState({}, "", path);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}
beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  mockApi();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

test("direct restaurant URLs survive remount and browser back/forward", async () => {
  const view = open("/restaurants/1");
  expect(
    await screen.findByRole("heading", { name: "Casa di Pasta." }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All restaurants" }));
  await screen.findByRole("button", { name: "View Casa di Pasta menu" });
  expect(window.location.pathname).toBe("/");
  await act(async () => window.history.back());
  await waitFor(() => expect(window.location.pathname).toBe("/restaurants/1"));
  await screen.findByRole("heading", { name: "Casa di Pasta." });
  await act(async () => window.history.forward());
  await waitFor(() => expect(window.location.pathname).toBe("/"));
  fireEvent.click(
    await screen.findByRole("button", { name: "View Casa di Pasta menu" }),
  );
  expect(window.location.pathname).toBe("/restaurants/1");
  view.unmount();
  render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
  expect(
    await screen.findByRole("heading", { name: "Casa di Pasta." }),
  ).toBeInTheDocument();
});

test("guests are sent to login and return to their protected destination", async () => {
  open("/favorites");
  await screen.findByRole("heading", { name: "Welcome back." });
  expect(window.location.pathname).toBe("/login");
  expect(new URLSearchParams(window.location.search).get("returnTo")).toBe(
    "/favorites",
  );
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: customer.email },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "secret123" },
  });
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Sign in",
      exact: true,
    }),
  );
  await waitFor(() => expect(window.location.pathname).toBe("/favorites"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("customers cannot enter admin routes or trigger admin requests", async () => {
  mockApi(customer);
  open("/admin/menus");
  expect(
    await screen.findByRole("heading", { name: "Admin access required" }),
  ).toBeInTheDocument();
  expect(api.mock.calls.some(([path]) => path.startsWith("admin/"))).toBe(
    false,
  );
});

test("admin deep links select the right section and update the URL", async () => {
  mockApi({ ...customer, role: "admin" });
  open("/admin/menus");
  expect(
    await screen.findByRole("heading", { name: "Your kitchens" }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Orders", exact: true }));
  expect(window.location.pathname).toBe("/admin/orders");
  expect(
    await screen.findByRole("heading", { name: "Order board" }),
  ).toBeInTheDocument();
});

test.each(["/missing", "/restaurants/999"])(
  "unknown destination %s shows a not-found page",
  async (path) => {
    open(path);
    expect(
      await screen.findByRole("heading", { name: /not found/i }),
    ).toBeInTheDocument();
  },
);

test("registration and cart are directly addressable", async () => {
  open("/register");
  expect(
    await screen.findByRole("heading", { name: "Join the table." }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close sign in" }));
  fireEvent.click(screen.getByRole("button", { name: "Cart, 0 items" }));
  expect(window.location.pathname).toBe("/cart");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

test("sign-in destinations are restricted to app routes", () => {
  expect(safeReturnTo("/admin/menus")).toBe("/admin/menus");
  for (const path of [
    "https://example.com",
    "//example.com",
    "/login",
    "/api/v1/user",
    "/\\example.com",
    null,
  ]) {
    expect(safeReturnTo(path)).toBe("/");
  }
});

test("protected routes wait for session restoration before redirecting", async () => {
  const implementation = api.getMockImplementation();
  let restoreSession;
  api.mockImplementation((path) =>
    path === "user"
      ? new Promise((resolve) => {
          restoreSession = resolve;
        })
      : implementation(path),
  );
  open("/admin/menus");
  expect(screen.getByText("Setting the table…")).toBeInTheDocument();
  expect(window.location.pathname).toBe("/admin/menus");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await act(async () =>
    restoreSession({ user: { ...customer, role: "admin" } }),
  );
  expect(
    await screen.findByRole("heading", { name: "Your kitchens" }),
  ).toBeInTheDocument();
});

test("signed-in users skip login and signing out removes protected access", async () => {
  mockApi(customer);
  open("/login?returnTo=%2Ffavorites");
  await waitFor(() => expect(window.location.pathname).toBe("/favorites"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(window.location.pathname).toBe("/"));
  await screen.findByRole("button", { name: "Sign in", exact: true });
  fireEvent.click(screen.getAllByRole("link", { name: "Favorites" })[0]);
  expect(
    await screen.findByRole("heading", { name: "Welcome back." }),
  ).toBeInTheDocument();
  expect(window.location.pathname).toBe("/login");
});

test.each(["/orders", "/admin/orders"])(
  "expired sessions on %s clear signed-in controls and prompt login",
  async (path) => {
    mockApi({ ...customer, role: "admin" });
    open(path);
    await screen.findByRole("button", { name: "Sign out" });
    await act(async () =>
      window.dispatchEvent(new Event("shija:session-expired")),
    );
    await screen.findByRole("heading", { name: "Welcome back." });
    expect(window.location.pathname).toBe("/login");
    expect(new URLSearchParams(window.location.search).get("returnTo")).toBe(
      path,
    );
    expect(
      screen.queryByRole("button", { name: "Sign out" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Admin", exact: true }),
    ).not.toBeInTheDocument();
  },
);

test("expired sessions allow guest browsing and ask for login when opening favorites", async () => {
  mockApi(customer);
  open("/");
  await screen.findByRole("button", { name: "Sign out" });
  await act(async () =>
    window.dispatchEvent(new Event("shija:session-expired")),
  );
  expect(window.location.pathname).toBe("/");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("link", { name: "Favorites" })[0]);
  await screen.findByRole("heading", { name: "Welcome back." });
});
