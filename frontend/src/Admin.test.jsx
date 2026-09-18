import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { test, expect, vi, afterEach } from "vitest";
import Admin from "./Admin";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});
const restaurant = {
  id: 1,
  name: "Casa",
  cuisine: "Italian",
  description: "Fresh food",
  image_url: "/images/pizza.jpg",
  is_active: true,
  delivery_fee_cents: 150,
  delivery_minutes: 30,
  foods: [
    {
      id: 1,
      restaurant_id: 1,
      name: "Margherita",
      category: "Pizza",
      description: "Fresh basil",
      price_cents: 650,
      image_url: "/images/pizza.jpg",
      is_available: true,
    },
  ],
};
test("admin food editing converts euro prices to integer cents", async () => {
  api.mockImplementation(async (path) =>
    path === "admin/restaurants"
      ? { data: [restaurant] }
      : path.startsWith("admin/orders")
        ? { data: [], meta: { last_page: 1 } }
        : { data: {} },
  );
  render(<Admin onBack={vi.fn()} onCatalogChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Restaurants & menus" }));
  await screen.findByRole("button", { name: "Edit Margherita" });
  fireEvent.click(screen.getByRole("button", { name: "Edit Margherita" }));
  fireEvent.change(screen.getByLabelText("Price (€)"), {
    target: { value: "7.95" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "admin/foods/1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.objectContaining({
          price_cents: 795,
          is_available: true,
          restaurant_id: 1,
        }),
      }),
    ),
  );
});

test("uploads the selected photo before saving the food image URL", async () => {
  vi.stubGlobal("URL", {
    createObjectURL: () => "blob:meal-preview",
    revokeObjectURL: vi.fn(),
  });
  api.mockImplementation(async (path) =>
    path === "admin/restaurants"
      ? { data: [restaurant] }
      : path.startsWith("admin/orders")
        ? { data: [], meta: { last_page: 1 } }
        : path === "admin/food-images"
          ? { image_url: "/storage/food-images/uploaded.png" }
          : { data: {} },
  );
  render(<Admin onBack={vi.fn()} onCatalogChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Restaurants & menus" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Edit Margherita" }),
  );
  const file = new File(["photo"], "meal.png", { type: "image/png" });
  fireEvent.change(screen.getByLabelText("Upload a photo"), {
    target: { files: [file] },
  });
  expect(await screen.findByAltText("Food photo preview")).toHaveAttribute(
    "src",
    "blob:meal-preview",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "admin/foods/1",
      expect.objectContaining({
        body: expect.objectContaining({
          image_url: "/storage/food-images/uploaded.png",
        }),
      }),
    ),
  );
  const upload = api.mock.calls.find(
    ([path]) => path === "admin/food-images",
  )[1];
  expect(upload.body.get("image")).toBe(file);
  vi.unstubAllGlobals();
});

test("creates an admin from the panel and displays confirmation", async () => {
  api.mockImplementation(async (path) =>
    path === "admin/admins"
      ? { user: { email: "team@example.com" } }
      : { data: [], meta: { last_page: 1 } },
  );
  render(<Admin onBack={vi.fn()} onCatalogChange={vi.fn()} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Create admin", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Team Admin" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "team@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "team-secret" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create admin account" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Admin account created for team@example.com",
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(api).toHaveBeenCalledWith("admin/admins", {
    method: "POST",
    body: {
      name: "Team Admin",
      email: "team@example.com",
      password: "team-secret",
    },
  });
});

test("keeps the create admin form open when the server rejects the email", async () => {
  api.mockImplementation(async (path) => {
    if (path === "admin/admins")
      throw new Error("The email has already been taken.");
    return { data: [], meta: { last_page: 1 } };
  });
  render(<Admin onBack={vi.fn()} onCatalogChange={vi.fn()} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Create admin", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Name"), {
    target: { value: "Team Admin" },
  });
  fireEvent.change(screen.getByLabelText("Email address"), {
    target: { value: "team@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "team-secret" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create admin account" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The email has already been taken.",
  );
  expect(
    screen.getByRole("button", { name: "Create admin account" }),
  ).toBeEnabled();
  expect(screen.getByLabelText("Name")).toHaveValue("Team Admin");
  fireEvent.click(screen.getByRole("button", { name: "Close create admin" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("editing a dish retains its specific photo and previews another selection", async () => {
  const updated = {
    ...restaurant,
    foods: [{ ...restaurant.foods[0], image_url: "/images/margherita.jpg" }],
  };
  api.mockImplementation(async (path) =>
    path === "admin/restaurants"
      ? { data: [updated] }
      : { data: [], meta: { last_page: 1 } },
  );
  render(<Admin onBack={vi.fn()} onCatalogChange={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "Restaurants & menus" }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Edit Margherita" }),
  );
  expect(screen.getByLabelText("Image")).toHaveValue("/images/margherita.jpg");
  fireEvent.change(screen.getByLabelText("Image"), {
    target: { value: "/images/diavola.jpg" },
  });
  expect(screen.getByAltText("Food photo preview")).toHaveAttribute(
    "src",
    "/images/diavola.jpg",
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "admin/foods/1",
      expect.objectContaining({
        body: expect.objectContaining({ image_url: "/images/diavola.jpg" }),
      }),
    ),
  );
});
