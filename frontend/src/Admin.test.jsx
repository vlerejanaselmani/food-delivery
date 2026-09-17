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
  vi.clearAllMocks();
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
