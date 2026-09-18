import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { RestaurantMenu } from "./Catalog";

export function safeReturnTo(path, fallback = "/") {
  return typeof path === "string" &&
    /^\/(?:restaurants\/\d+|favorites|orders|cart|admin(?:\/(?:orders|menus))?)?(?:\?[^#]*)?$/.test(
      path,
    )
    ? path
    : fallback;
}

export function ProtectedRoute({ user, adminOnly = false, children }) {
  const location = useLocation();
  if (!user) {
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }
  if (adminOnly && user.role !== "admin") {
    return (
      <div className="empty">
        <h2>Admin access required</h2>
        <p>This area is available to administrators.</p>
        <Link className="primary" to="/">
          Browse restaurants
        </Link>
      </div>
    );
  }
  return children;
}

export function RestaurantRoute({ restaurants, ...props }) {
  const { restaurantId } = useParams();
  const restaurant = restaurants.find(
    (item) => String(item.id) === restaurantId,
  );
  if (!restaurant) {
    return (
      <div className="empty">
        <h2>Restaurant not found</h2>
        <Link className="primary" to="/">
          Browse restaurants
        </Link>
      </div>
    );
  }
  return (
    <RestaurantMenu key={restaurant.id} restaurant={restaurant} {...props} />
  );
}
