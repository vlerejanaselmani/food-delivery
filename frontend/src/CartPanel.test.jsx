import React from "react";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { test, expect, vi, afterEach } from "vitest";
import CartPanel from "./CartPanel";
import { api } from "./api";
vi.mock("./api", () => ({ api: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const cart = {
  items: [
    {
      food_id: 1,
      name: "Margherita",
      price_cents: 650,
      quantity: 2,
      is_available: true,
    },
  ],
  restaurant: { name: "Casa" },
  checkout_key: "key",
  subtotal_cents: 1300,
  delivery_fee_cents: 150,
  total_cents: 1450,
};
const props = {
  cart,
  setCart: vi.fn(),
  user: null,
  cities: ["Prishtinë"],
  city: "Prishtinë",
  onClose: vi.fn(),
  onOrder: vi.fn(),
  onSignIn: vi.fn(),
};
test("guest checkout collects delivery info without requiring an account", () => {
  render(<CartPanel {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Continue to checkout" }));
  expect(screen.getByLabelText("Your name")).toBeRequired();
  expect(screen.getByLabelText("Phone (XK)")).toBeRequired();
  expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
});
test("quantity updates use server cart response", async () => {
  api.mockResolvedValue({ data: { ...cart, total_cents: 2100 } });
  render(<CartPanel {...props} />);
  fireEvent.click(screen.getByRole("button", { name: "Increase Margherita" }));
  await waitFor(() =>
    expect(props.setCart).toHaveBeenCalledWith({ ...cart, total_cents: 2100 }),
  );
  expect(api).toHaveBeenCalledWith("cart/items/1", {
    method: "PATCH",
    body: { quantity: 3 },
  });
});

function checkout() {
  fireEvent.click(screen.getByRole("button", { name: "Continue to checkout" }));
  fireEvent.change(screen.getByLabelText("Your name"), {
    target: { value: "Arta" },
  });
  fireEvent.change(screen.getByLabelText("Phone (XK)"), {
    target: { value: "044123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Place order" }));
}

test("changed prices show the new total and wait for an explicit second confirmation", async () => {
  const updated = {
    ...cart,
    total_cents: 1650,
    subtotal_cents: 1500,
    price_quote: "updated-quote",
    items: [{ ...cart.items[0], price_cents: 750 }],
  };
  api.mockRejectedValueOnce(
    Object.assign(new Error("Prices changed. Confirm again."), {
      status: 409,
      code: "cart_price_changed",
      data: updated,
    }),
  );
  function Checkout() {
    const [current, setCurrent] = React.useState({
      ...cart,
      price_quote: "original-quote",
    });
    return <CartPanel {...props} cart={current} setCart={setCurrent} />;
  }
  render(<Checkout />);
  checkout();
  await screen.findByRole("button", { name: "Confirm updated total" });
  expect(screen.getByText("€16.50")).toBeInTheDocument();
  expect(screen.getByLabelText("Your name")).toHaveValue("Arta");
  expect(api).toHaveBeenCalledTimes(1);
  expect(props.onOrder).not.toHaveBeenCalled();
  expect(api.mock.calls[0][1].body.price_quote).toBe("original-quote");
  api
    .mockResolvedValueOnce({ data: { id: 1 } })
    .mockResolvedValueOnce({ data: { items: [] } });
  fireEvent.click(
    screen.getByRole("button", { name: "Confirm updated total" }),
  );
  await waitFor(() => expect(props.onOrder).toHaveBeenCalledWith({ id: 1 }));
  expect(api.mock.calls[1][1].body.price_quote).toBe("updated-quote");
});

test("a saved order confirms even when the following cart refresh fails", async () => {
  api
    .mockResolvedValueOnce({ data: { id: 42 } })
    .mockRejectedValueOnce(new Error("Cart refresh failed"));
  render(<CartPanel {...props} />);
  checkout();
  await waitFor(() => expect(props.onOrder).toHaveBeenCalledWith({ id: 42 }));
  expect(props.setCart).toHaveBeenCalledWith(
    expect.objectContaining({ items: [] }),
  );
  expect(api).toHaveBeenCalledWith("cart");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("an unsuccessful order keeps the cart and displays the error", async () => {
  api.mockRejectedValueOnce(new Error("Food is unavailable"));
  render(<CartPanel {...props} />);
  checkout();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Food is unavailable",
  );
  expect(props.onOrder).not.toHaveBeenCalled();
  expect(props.setCart).not.toHaveBeenCalled();
  expect(api).toHaveBeenCalledTimes(1);
});
