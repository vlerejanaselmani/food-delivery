import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ProtectedRoute, RestaurantRoute, safeReturnTo } from "./Routing";
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
import Catalog from "./Catalog";
import AuthModal from "./AuthModal";
import CartPanel, { OrderSuccess } from "./CartPanel";
import { Orders, Favorites } from "./AccountPages";
import Admin from "./Admin";
export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authReady, setAuthReady] = useState(false);
  const cartOpen = location.pathname === "/cart";
  const auth = ["/login", "/register"].includes(location.pathname);
  function openLogin(returnTo = location.pathname + location.search) {
    navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const [cart, setCart] = useState({ items: [] }),
    [favorites, setFavorites] = useState({ foods: [], restaurants: [] }),
    [success, setSuccess] = useState(null),
    [switchItem, setSwitchItem] = useState(null),
    [cartBusy, setCartBusy] = useState(false);
  const [restaurants, setRestaurants] = useState([]),
    [cities, setCities] = useState([]),
    [user, setUser] = useState(null),
    [query, setQuery] = useState(""),
    [city, setCity] = useState("Prishtinë"),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  useEffect(() => {
    function expireSession() {
      setUser(null);
      setFavorites({ foods: [], restaurants: [] });
      if (user)
        setNotice(
          "Your session expired. Sign in again to access your account.",
        );
    }
    window.addEventListener("shija:session-expired", expireSession);
    return () =>
      window.removeEventListener("shija:session-expired", expireSession);
  }, [user]);
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
      openLogin();
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
    navigate("/");
    window.scrollTo(0, 0);
  }
  async function signOut() {
    try {
      await api("logout", { method: "POST" });
      setUser(null);
      navigate("/", { replace: true });
      setCart((await api("cart")).data);
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
      })
      .finally(() => setAuthReady(true));
  }, []);
  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(id);
  }, [notice]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const selectRestaurant = (restaurant) =>
    navigate(`/restaurants/${restaurant.id}`);
  const authDestination = safeReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
    user?.role === "admin" ? "/admin/orders" : "/",
  );
  const catalog = (
    <Catalog
      onAdd={add}
      restaurants={restaurants}
      query={query}
      setQuery={setQuery}
      onSelect={selectRestaurant}
      onFavorite={favorite}
      isFavorite={isFavorite}
    />
  );
  const admin = (tab) => (
    <Admin
      tab={tab}
      onTabChange={(next) =>
        navigate(next === "menus" ? "/admin/menus" : "/admin/orders")
      }
      onBack={explore}
      onCatalogChange={() =>
        api("restaurants")
          .then((r) => setRestaurants(r.data))
          .catch((e) => setNotice(e.message))
      }
    />
  );
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" to="/">
            <span className="brand-icon">
              <UtensilsCrossed size={22} />
            </span>
            shija<span className="brand-dot">.</span>
          </Link>
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
            <Link className="nav-link" to="/">
              Explore
            </Link>
            <Link className="nav-link" to="/favorites">
              <Heart size={18} />
              <span>Favorites</span>
            </Link>
            {user ? (
              <>
                <Link className="nav-link" to="/orders">
                  <UserRound size={17} />
                  My orders
                </Link>
                <button
                  className="icon"
                  aria-label="Sign out"
                  onClick={signOut}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <button className="login-button" onClick={() => openLogin()}>
                <UserRound size={17} />
                Sign in
              </button>
            )}
            {user?.role === "admin" && (
              <Link className="nav-link admin-nav" to="/admin">
                Admin
              </Link>
            )}
            <button
              aria-label={`Cart, ${cart.items.reduce((n, i) => n + i.quantity, 0)} items`}
              className="cart-button"
              onClick={() => navigate("/cart")}
            >
              <ShoppingBag size={18} />
              <span>Cart</span>
              <b>{cart.items.reduce((n, i) => n + i.quantity, 0)}</b>
            </button>
          </nav>
        </div>
      </header>
      <div className="mobile-nav">
        <Link to="/">Explore</Link>
        <Link to="/favorites">Favorites</Link>
        <Link to="/orders">My orders</Link>
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
      </div>
      <main className="container">
        {loading || !authReady ? (
          <div className="empty loading">Setting the table…</div>
        ) : error ? (
          <div className="empty">
            <h2>We couldn’t load the menu.</h2>
            <p>{error}</p>
            <button className="primary" onClick={load}>
              Try again
            </button>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={catalog} />
            <Route
              path="/restaurants/:restaurantId"
              element={
                <RestaurantRoute
                  restaurants={restaurants}
                  onBack={explore}
                  onAdd={add}
                  onFavorite={favorite}
                  isFavorite={isFavorite}
                />
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute user={user}>
                  <Orders onBack={explore} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/favorites"
              element={
                <ProtectedRoute user={user}>
                  <Favorites
                    favorites={favorites}
                    restaurants={restaurants}
                    onSelect={selectRestaurant}
                    onAdd={add}
                    onFavorite={favorite}
                    onBack={explore}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute user={user} adminOnly>
                  <Navigate to="/admin/orders" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute user={user} adminOnly>
                  {admin("orders")}
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/menus"
              element={
                <ProtectedRoute user={user} adminOnly>
                  {admin("menus")}
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={
                user ? <Navigate to={authDestination} replace /> : catalog
              }
            />
            <Route
              path="/register"
              element={
                user ? <Navigate to={authDestination} replace /> : catalog
              }
            />
            <Route path="/cart" element={catalog} />
            <Route
              path="*"
              element={
                <div className="empty">
                  <h2>Page not found</h2>
                  <Link className="primary" to="/">
                    Browse restaurants
                  </Link>
                </div>
              }
            />
          </Routes>
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
      {auth && !user && authReady && !loading && (
        <AuthModal
          cities={cities}
          register={location.pathname === "/register"}
          onModeChange={(register) =>
            navigate(`${register ? "/register" : "/login"}${location.search}`, {
              replace: true,
            })
          }
          onClose={explore}
          onSuccess={(u) => {
            setUser(u);
            setCity(u.city || city);
            const returnTo = new URLSearchParams(location.search).get(
              "returnTo",
            );
            navigate(
              safeReturnTo(
                returnTo,
                u.role === "admin" ? "/admin/orders" : "/",
              ),
              { replace: true },
            );
            setNotice(`Welcome, ${u.name}!`);
          }}
        />
      )}
      {cartOpen && authReady && !loading && (
        <CartPanel
          cart={cart}
          setCart={setCart}
          user={user}
          cities={cities}
          city={city}
          onClose={explore}
          onSignIn={() => {
            openLogin("/cart");
          }}
          onOrder={(o) => {
            setSuccess(o);
            navigate("/", { replace: true });
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
            navigate("/orders");
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
