import { useEffect, useState } from "react";
import {
  MapPin,
  ChevronDown,
  ShoppingBag,
  Heart,
  UserRound,
  LogOut,
  UtensilsCrossed,
} from "lucide-react";
import { api } from "./api";
import Catalog, { RestaurantMenu } from "./Catalog";
import AuthModal from "./AuthModal";
import CartPanel, { OrderSuccess } from "./CartPanel";
import { Orders, Favorites } from "./AccountPages";
import Admin from "./Admin";
export default function App() {
  const [page, setPage] = useState("explore"),
    [cart, setCart] = useState({ items: [] }),
    [cartOpen, setCartOpen] = useState(false),
    [favorites, setFavorites] = useState({ foods: [], restaurants: [] }),
    [success, setSuccess] = useState(null),
    [switchItem, setSwitchItem] = useState(null),
    [cartBusy, setCartBusy] = useState(false);
  const [restaurants, setRestaurants] = useState([]),
    [cities, setCities] = useState([]),
    [user, setUser] = useState(null),
    [auth, setAuth] = useState(false),
    [selected, setSelected] = useState(null),
    [query, setQuery] = useState(""),
    [city, setCity] = useState("Prishtinë"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  async function loadFavorites() {
    try {
      setFavorites(await api("favorites"));
    } catch (e) {
      setNotice(e.message);
    }
  }
  useEffect(() => {
    if (user) loadFavorites();
    else setFavorites({ foods: [], restaurants: [] });
  }, [user]);
  async function favorite(type, id) {
    if (!user) {
      setAuth(true);
      return;
    }
    try {
      await api(`favorites/${type}/${id}`, {
        method: isFavorite(type, id) ? "DELETE" : "PUT",
      });
      await loadFavorites();
    } catch (e) {
      setNotice(e.message);
    }
  }
  function isFavorite(type, id) {
    return favorites[type].some((x) => x.id === id);
  }
  async function add(food, restaurant) {
    if (!restaurant || cartBusy) return;
    setCartBusy(true);
    try {
      const r = await api("cart/items", {
        method: "POST",
        body: { food_id: food.id, quantity: 1 },
      });
      setCart(r.data);
      setNotice(`${food.name} added to your bag`);
    } catch (e) {
      if (e.status === 409) setSwitchItem({ food, restaurant });
      else setNotice(e.message);
    } finally {
      setCartBusy(false);
    }
  }
  async function replaceCart() {
    try {
      await api("cart", { method: "DELETE" });
      const r = await api("cart/items", {
        method: "POST",
        body: { food_id: switchItem.food.id, quantity: 1 },
      });
      setCart(r.data);
      setSwitchItem(null);
      setNotice("Your new bag is ready.");
    } catch (e) {
      setNotice(e.message);
    }
  }
  function explore() {
    setPage("explore");
    setSelected(null);
    window.scrollTo(0, 0);
  }
  async function signOut() {
    try {
      await api("logout", { method: "POST" });
      setUser(null);
      setCart((await api("cart")).data);
      explore();
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function load() {
    setLoading(true);
    setError("");
    try {
      const [r, c, b] = await Promise.all([
        api("restaurants"),
        api("cities"),
        api("cart"),
      ]);
      setRestaurants(r.data);
      setCities(c.data);
      setCart(b.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    api("user")
      .then((r) => setUser(r.user))
      .catch((e) => {
        if (e.status !== 401) setError(e.message);
      });
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(id);
  }, [notice]);
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <button className="brand" onClick={explore}>
            <span className="brand-icon">
              <UtensilsCrossed size={22} />
            </span>
            shija<span className="brand-dot">.</span>
          </button>
          <div className="header-divider" />
          <label className="location">
            <MapPin size={21} />
            <span>
              <small>DELIVERING TO</small>
              <select
                aria-label="Delivery city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              >
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </span>
            <ChevronDown size={14} />
          </label>
          <nav>
            <button className="nav-link" onClick={explore}>
              Explore
            </button>
            <button
              className="nav-link"
              onClick={() =>
                user ? (setPage("favorites"), setSelected(null)) : setAuth(true)
              }
            >
              <Heart size={18} />
              <span>Favorites</span>
            </button>
            {user ? (
              <>
                <button
                  className="nav-link"
                  onClick={() => {
                    setPage("orders");
                    setSelected(null);
                  }}
                >
                  <UserRound size={17} />
                  My orders
                </button>
                <button
                  className="icon"
                  aria-label="Sign out"
                  onClick={signOut}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button className="login-button" onClick={() => setAuth(true)}>
                <UserRound size={17} />
                Sign in
              </button>
            )}
            {user?.role === "admin" && (
              <button
                className="nav-link admin-nav"
                onClick={() => {
                  setPage("admin");
                  setSelected(null);
                }}
              >
                Admin
              </button>
            )}
            <button
              aria-label={`Cart, ${cart.items.reduce((n, i) => n + i.quantity, 0)} items`}
              className="cart-button"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              <b>{cart.items.reduce((n, i) => n + i.quantity, 0)}</b>
            </button>
          </nav>
        </div>
      </header>
      <div className="mobile-nav">
        <button onClick={explore}>Explore</button>
        <button onClick={() => (user ? setPage("favorites") : setAuth(true))}>
          Favorites
        </button>
        <button onClick={() => (user ? setPage("orders") : setAuth(true))}>
          My orders
        </button>
        {user?.role === "admin" && (
          <button onClick={() => setPage("admin")}>Admin</button>
        )}
      </div>
      <main className="container">
        {loading ? (
          <div className="empty loading">Setting the table…</div>
        ) : error ? (
          <div className="empty">
            <h2>We couldn’t load the menu.</h2>
            <p>{error}</p>
            <button className="primary" onClick={load}>
              Try again
            </button>
          </div>
        ) : page === "admin" && user?.role === "admin" ? (
          <Admin
            onBack={explore}
            onCatalogChange={() =>
              api("restaurants")
                .then((r) => {
                  setRestaurants(r.data);
                  setSelected(null);
                })
                .catch((e) => setNotice(e.message))
            }
          />
        ) : page === "orders" && user ? (
          <Orders onBack={explore} />
        ) : page === "favorites" && user ? (
          <Favorites
            favorites={favorites}
            restaurants={restaurants}
            onSelect={(r) => {
              setSelected(r);
              setPage("explore");
            }}
            onAdd={add}
            onFavorite={favorite}
            onBack={explore}
          />
        ) : selected ? (
          <RestaurantMenu
            restaurant={selected}
            onBack={() => setSelected(null)}
            onAdd={add}
            onFavorite={favorite}
            isFavorite={isFavorite}
          />
        ) : (
          <Catalog
            restaurants={restaurants}
            query={query}
            setQuery={setQuery}
            onSelect={(r) => {
              setSelected(r);
              window.scrollTo(0, 0);
            }}
            onFavorite={favorite}
            isFavorite={isFavorite}
          />
        )}
      </main>
      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <span className="brand">
              shija<span className="brand-dot">.</span>
            </span>
            <p>A little joy, delivered.</p>
          </div>
          <p>
            Made for hungry people in Kosovo. <span>♥</span>
          </p>
          <span>Fresh food. Local love.</span>
        </div>
      </footer>
      {auth && (
        <AuthModal
          cities={cities}
          onClose={() => setAuth(false)}
          onSuccess={(u) => {
            setUser(u);
            setCity(u.city || city);
            setAuth(false);
            if (u.role === "admin") {
              setPage("admin");
              setSelected(null);
            }
            setNotice(`Welcome, ${u.name}!`);
          }}
        />
      )}
      {cartOpen && (
        <CartPanel
          cart={cart}
          setCart={setCart}
          user={user}
          cities={cities}
          city={city}
          onClose={() => setCartOpen(false)}
          onSignIn={() => {
            setCartOpen(false);
            setAuth(true);
          }}
          onOrder={(o) => {
            setSuccess(o);
            setCartOpen(false);
          }}
        />
      )}
      {success && (
        <OrderSuccess
          order={success}
          user={user}
          onClose={() => setSuccess(null)}
          onHistory={() => {
            setSuccess(null);
            setPage("orders");
            setSelected(null);
          }}
        />
      )}
      {switchItem && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="switch-title"
          >
            <h2 id="switch-title">A new kitchen?</h2>
            <p className="muted">
              Your bag has food from {cart.restaurant?.name}. Start a new bag
              with {switchItem.restaurant.name}?
            </p>
            <div className="dialog-actions">
              <button className="secondary" onClick={() => setSwitchItem(null)}>
                Keep my bag
              </button>
              <button className="primary" onClick={replaceCart}>
                Start new bag
              </button>
            </div>
          </section>
        </div>
      )}
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
