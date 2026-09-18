import { useState } from "react";
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { api } from "./api";
import { money } from "./Catalog";
export default function CartPanel({
  cart,
  setCart,
  user,
  cities,
  city,
  onClose,
  onOrder,
  onSignIn,
}) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [checkout, setCheckout] = useState(false),
    [priceChanged, setPriceChanged] = useState(false);
  async function change(path, method, body) {
    setBusy(true);
    setError("");
    try {
      const r = await api(path, { method, body });
      setCart(r.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function order(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await api("orders", {
        method: "POST",
        body: {
          ...Object.fromEntries(new FormData(e.target)),
          checkout_key: cart.checkout_key,
          price_quote: cart.price_quote,
        },
      });
      setCart({
        items: [],
        subtotal_cents: 0,
        delivery_fee_cents: 0,
        total_cents: 0,
      });
      onOrder(r.data);
      // The order is already saved; refreshing the bag must not undo confirmation.
      api("cart")
        .then((next) => setCart(next.data))
        .catch(() => {});
    } catch (e) {
      if (e.code === "cart_price_changed" && e.data) {
        setCart(e.data);
        setPriceChanged(true);
      }
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop cart-backdrop">
      <section
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <header>
          <div>
            <p className="eyebrow">SOMETHING DELICIOUS AWAITS</p>
            <h2 id="cart-title">
              Your bag<span>.</span>
            </h2>
          </div>
          <button className="icon" onClick={onClose} aria-label="Close cart">
            <X />
          </button>
        </header>
        {!cart.items.length ? (
          <div className="empty">
            <ShoppingBag />
            <h3>A little empty, a lot of potential.</h3>
            <p>Find something delicious to fill your bag.</p>
            <button className="primary" onClick={onClose}>
              Explore the menu
            </button>
          </div>
        ) : (
          <>
            <div className="cart-restaurant">
              <strong>{cart.restaurant?.name}</strong>
              <span>One kitchen. One delicious delivery.</span>
            </div>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div className="cart-item" key={item.food_id}>
                  <img src={item.image_url} alt={item.name} />
                  <div>
                    <h3>{item.name}</h3>
                    <p>
                      {money(item.price_cents)}
                      {!item.is_available && (
                        <span className="error-text"> · Unavailable</span>
                      )}
                    </p>
                    <div className="quantity">
                      <button
                        aria-label={`Decrease ${item.name}`}
                        disabled={busy || item.quantity === 1}
                        onClick={() =>
                          change(`cart/items/${item.food_id}`, "PATCH", {
                            quantity: item.quantity - 1,
                          })
                        }
                      >
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label={`Increase ${item.name}`}
                        disabled={busy || item.quantity === 20}
                        onClick={() =>
                          change(`cart/items/${item.food_id}`, "PATCH", {
                            quantity: item.quantity + 1,
                          })
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-end">
                    <strong>{money(item.price_cents * item.quantity)}</strong>
                    <button
                      className="icon"
                      aria-label={`Remove ${item.name}`}
                      disabled={busy}
                      onClick={() =>
                        change(`cart/items/${item.food_id}`, "DELETE")
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="text-button clear-cart"
              disabled={busy}
              onClick={() => change("cart", "DELETE")}
            >
              Clear bag
            </button>
            <div className="totals">
              <p>
                <span>Subtotal</span>
                <span>{money(cart.subtotal_cents)}</span>
              </p>
              <p>
                <span>Delivery</span>
                <span>{money(cart.delivery_fee_cents)}</span>
              </p>
              <p className="grand-total">
                <strong>Total</strong>
                <strong>{money(cart.total_cents)}</strong>
              </p>
            </div>
            {cart.missing_items && (
              <p className="error">
                An item was removed from the menu. Please clear your bag and add
                your choices again.
              </p>
            )}
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            {checkout ? (
              <form onSubmit={order} className="checkout-form">
                <h3>Where’s the good food going?</h3>
                {!user && (
                  <p className="guest-note">
                    Checkout as a guest, or{" "}
                    <button
                      type="button"
                      className="text-button"
                      onClick={onSignIn}
                    >
                      sign in
                    </button>{" "}
                    to save this order to your history.
                  </p>
                )}
                <label>
                  Your name
                  <input
                    name="customer_name"
                    required
                    defaultValue={user?.name || ""}
                    maxLength={100}
                    autoComplete="name"
                  />
                </label>
                <div className="form-row">
                  <label>
                    Delivery city
                    <select name="city" defaultValue={user?.city || city}>
                      {cities.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Phone (XK)
                    <input
                      name="phone"
                      type="tel"
                      required
                      defaultValue={user?.phone || ""}
                      placeholder="+383 44 123 456"
                      autoComplete="tel"
                    />
                  </label>
                </div>
                <label>
                  Delivery notes <span className="muted">(optional)</span>
                  <textarea
                    name="notes"
                    maxLength={500}
                    rows={2}
                    placeholder="Anything we should know?"
                  />
                </label>
                <p className="demo-note">
                  Demo checkout · No online payment will be taken.
                </p>
                <button
                  className="primary wide"
                  disabled={
                    busy ||
                    cart.missing_items ||
                    cart.items.some((i) => !i.is_available)
                  }
                >
                  {busy
                    ? "Placing your order…"
                    : priceChanged
                      ? "Confirm updated total"
                      : "Place order"}
                  <ArrowRight size={17} />
                </button>
              </form>
            ) : (
              <>
                <button
                  className="primary wide"
                  disabled={
                    busy ||
                    cart.missing_items ||
                    cart.items.some((i) => !i.is_available)
                  }
                  onClick={() => setCheckout(true)}
                >
                  Continue to checkout
                  <ArrowRight size={17} />
                </button>
                <p className="demo-note">
                  No account needed. Just a good appetite.
                </p>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
export function OrderSuccess({ order, onClose, onHistory, user }) {
  return (
    <div className="modal-backdrop">
      <section
        className="modal success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-title"
      >
        <CheckCircle2 size={58} />
        <p className="eyebrow">GOOD CHOICE. GREAT FOOD.</p>
        <h2 id="success-title">You’re on the menu!</h2>
        <p>
          Your order is in with <strong>{order.restaurant_name}</strong>.
        </p>
        <div className="order-receipt">
          <span>Order #{order.reference.slice(0, 8).toUpperCase()}</span>
          <strong>{money(order.total_cents)}</strong>
          <span>
            {order.city} · {order.phone}
          </span>
          <span className="status status-new">New</span>
        </div>
        <p className="muted">
          {user
            ? "Follow its progress in your order history."
            : "Keep this reference for your order. Guest orders aren’t added to an account history."}
        </p>
        <button className="primary wide" onClick={user ? onHistory : onClose}>
          {user ? "View my orders" : "Keep exploring"}
        </button>
        {user && (
          <button className="text-button" onClick={onClose}>
            Back to the menu
          </button>
        )}
      </section>
    </div>
  );
}
