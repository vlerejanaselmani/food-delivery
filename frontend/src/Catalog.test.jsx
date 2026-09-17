import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { test, expect, vi, afterEach } from "vitest";
import Catalog, { RestaurantMenu } from "./Catalog";
afterEach(cleanup);
const restaurants = [
  {
    id: 1,
    name: "Casa di Pasta",
    cuisine: "Italian",
    delivery_fee_cents: 150,
    delivery_minutes: 30,
    foods: [
      {
        id: 1,
        name: "Margherita",
        category: "Pizza",
        price_cents: 650,
        description: "Fresh basil",
      },
    ],
  },
  {
    id: 2,
    name: "Burger Theory",
    cuisine: "Burgers",
    delivery_fee_cents: 100,
    delivery_minutes: 25,
    foods: [],
  },
];
test("cuisine filter shows only matching restaurants", () => {
  render(
    <Catalog
      restaurants={restaurants}
      onSelect={vi.fn()}
      onFavorite={vi.fn()}
      isFavorite={() => false}
      query=""
      setQuery={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Burgers", exact: true }));
  expect(screen.getByText("Burger Theory")).toBeInTheDocument();
  expect(screen.queryByText("Casa di Pasta")).not.toBeInTheDocument();
});
test("menu passes selected food and restaurant to cart", () => {
  const add = vi.fn();
  render(
    <RestaurantMenu
      restaurant={restaurants[0]}
      onBack={vi.fn()}
      onFavorite={vi.fn()}
      isFavorite={() => false}
      onAdd={add}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Add Margherita to cart" }),
  );
  expect(add).toHaveBeenCalledWith(restaurants[0].foods[0], restaurants[0]);
  expect(screen.getByText("€6.50")).toBeInTheDocument();
});

const categoryRestaurants = [
  {
    ...restaurants[0],
    foods: [
      ...restaurants[0].foods,
      { id: 3, name: "Tiramisu", category: "Desserts", price_cents: 350 },
    ],
  },
  {
    ...restaurants[1],
    foods: [
      { id: 4, name: "Brownie", category: "Desserts", price_cents: 300 },
      { id: 5, name: "Classic Burger", category: "Burgers", price_cents: 650 },
    ],
  },
];

function browseProps(query = "") {
  return {
    restaurants: categoryRestaurants,
    onSelect: vi.fn(),
    onFavorite: vi.fn(),
    isFavorite: () => false,
    query,
    setQuery: vi.fn(),
    onAdd: vi.fn(),
  };
}

test("food categories show matching dishes across restaurants and preserve cart ownership", () => {
  const props = browseProps();
  render(<Catalog {...props} />);
  fireEvent.change(screen.getByLabelText("Filter foods by category"), {
    target: { value: "Desserts" },
  });
  expect(screen.getByRole("heading", { name: "Tiramisu" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Brownie" })).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Margherita" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add Brownie to cart" }));
  expect(props.onAdd).toHaveBeenCalledWith(
    categoryRestaurants[1].foods[0],
    categoryRestaurants[1],
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Burger Theory", exact: true }),
  );
  expect(props.onSelect).toHaveBeenCalledWith(categoryRestaurants[1]);
  fireEvent.change(screen.getByLabelText("Filter foods by category"), {
    target: { value: "" },
  });
  expect(
    screen.getByRole("button", { name: "View Casa di Pasta menu" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Add Brownie to cart" }),
  ).not.toBeInTheDocument();
});

test("category filtering combines with cuisine and search and offers an empty-state reset", () => {
  const props = browseProps("Brownie");
  render(<Catalog {...props} />);
  fireEvent.change(screen.getByLabelText("Filter foods by category"), {
    target: { value: "Desserts" },
  });
  expect(screen.getByRole("heading", { name: "Brownie" })).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Tiramisu" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Italian", exact: true }));
  expect(screen.getByText("No bites found")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Show all restaurants" }));
  expect(screen.getByLabelText("Filter foods by category")).toHaveValue("");
  expect(props.setQuery).toHaveBeenCalledWith("");
});

test("restaurant category tabs hide other foods and All restores the menu", () => {
  render(
    <RestaurantMenu
      restaurant={categoryRestaurants[0]}
      onBack={vi.fn()}
      onAdd={vi.fn()}
      onFavorite={vi.fn()}
      isFavorite={() => false}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Desserts", exact: true }),
  );
  expect(
    screen.getByRole("button", { name: "Desserts", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("heading", { name: "Tiramisu" })).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Margherita" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All", exact: true }));
  expect(
    screen.getByRole("heading", { name: "Margherita" }),
  ).toBeInTheDocument();
});
