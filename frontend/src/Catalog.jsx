import { useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Clock3,
  Bike,
  Heart,
  Search,
  SlidersHorizontal,
  Flame,
  Plus,
  ArrowLeft,
  Utensils,
  Pizza,
  Sandwich,
} from "lucide-react";
export const money = (cents) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export function FavoriteButton({ active, onClick, label }) {
  return (
    <button
      className={`icon favorite ${active ? "is-favorite" : ""}`}
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Heart size={19} fill={active ? "currentColor" : "none"} />
    </button>
  );
}
export default function Catalog({
  restaurants,
  onSelect,
  onFavorite,
  isFavorite,
  query,
  setQuery,
  onAdd,
}) {
  const [category, setCategory] = useState("");
  const categories = [
    ...new Set(restaurants.flatMap((r) => r.foods.map((f) => f.category))),
  ].sort();
  const [cuisine, setCuisine] = useState("All"),
    [sort, setSort] = useState("recommended");
  const filtered = restaurants
    .filter(
      (r) =>
        (cuisine === "All" || r.cuisine === cuisine) &&
        `${r.name} ${r.cuisine} ${r.foods.map((f) => f.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "fastest"
        ? a.delivery_minutes - b.delivery_minutes
        : sort === "delivery"
          ? a.delivery_fee_cents - b.delivery_fee_cents
          : a.id - b.id,
    );
  const matchingFoods = filtered.flatMap((restaurant) =>
    restaurant.foods
      .filter(
        (food) =>
          food.category === category &&
          `${restaurant.name} ${restaurant.cuisine} ${food.name}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      )
      .map((food) => ({ food, restaurant })),
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-label">
            <span /> FRESH FLAVORS. LOCAL FAVORITES.
          </div>
          <h1>
            A little joy,
            <br /> <span>delivered.</span>
            <svg viewBox="0 0 320 17" aria-hidden="true">
              <path d="M5 12 Q140 -2 310 9" />
            </svg>
          </h1>
          <p>
            Big cravings, meet your match.
            <br />
            The food you love, from kitchens close to home.
          </p>
          <a className="primary" href="#restaurants">
            Find your next bite <ArrowRight size={20} />
          </a>
          <div className="hero-perks">
            <span>
              <Bike size={18} /> Fresh to your door
            </span>
            <span>
              <Heart size={17} /> Made with love
            </span>
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-orbit" />
          <img
            src="/images/burger.jpg"
            alt="Juicy cheeseburger with fresh lettuce and tomato"
          />
          <div className="floating-note note-top">
            <span>🔥</span>
            <div>
              Craving something good?<small>You're in the right place.</small>
            </div>
          </div>
          <div className="floating-note note-bottom">
            <span className="delivery-icon">
              <Bike />
            </span>
            <div>
              Good food. On its way.<small>Made fresh, delivered happy.</small>
            </div>
          </div>
          <span className="spark spark-one">✳</span>
          <span className="spark spark-two">✦</span>
        </div>
      </section>
      <section className="discovery" id="restaurants">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT ARE YOU CRAVING?</p>
            <h2>
              Follow your appetite<span>.</span>
            </h2>
          </div>
          <p className="muted">Local kitchens. Big flavor.</p>
        </div>
        <div className="browse-tools">
          <div className="cuisine-tabs">
            {[
              ["All", Utensils, "Everything"],
              ["Italian", Pizza, "Italian"],
              ["Burgers", Sandwich, "Burgers"],
              ["Kebab", Flame, "Kebab"],
            ].map(([key, Icon, label]) => (
              <button
                className={`cuisine-tab ${cuisine === key ? "active" : ""}`}
                key={key}
                onClick={() => setCuisine(key)}
              >
                <Icon size={21} />
                {label}
              </button>
            ))}
          </div>
          <label className="search-box">
            <Search size={19} />
            <input
              placeholder="Search a dish or restaurant"
              aria-label="Search food or restaurants"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <label className="food-category-filter">
          Food category
          <select
            aria-label="Filter foods by category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <div className="results-heading">
          <h3>
            {category
              ? `${category} dishes`
              : query
                ? `Results for “${query}”`
                : "Restaurants you’ll love"}{" "}
            <span>{category ? matchingFoods.length : filtered.length}</span>
          </h3>
          <label className="sort-label">
            <SlidersHorizontal size={15} />
            <select
              aria-label="Sort restaurants"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="fastest">Fastest delivery</option>
              <option value="delivery">Lowest delivery fee</option>
            </select>
          </label>
        </div>
        {category ? (
          <div className="food-grid">
            {matchingFoods.map(({ food, restaurant }) => (
              <FoodCard
                key={food.id}
                food={food}
                restaurant={restaurant}
                onAdd={onAdd}
                onSelect={onSelect}
                onFavorite={onFavorite}
                isFavorite={isFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="restaurant-grid">
            {filtered.map((r) => (
              <article className="restaurant-card" key={r.id}>
                <div className="restaurant-photo">
                  <button
                    className="photo-button"
                    onClick={() => onSelect(r)}
                    aria-label={`View ${r.name} menu`}
                  >
                    <img
                      src={r.image_url}
                      alt={`${r.cuisine} food from ${r.name}`}
                    />
                  </button>
                  <span className="photo-tag">
                    {r.cuisine === "Italian"
                      ? "A taste of Italy"
                      : r.cuisine === "Burgers"
                        ? "Big bite energy"
                        : "Fresh off the grill"}
                  </span>
                  <FavoriteButton
                    label={`Favorite ${r.name}`}
                    active={isFavorite("restaurants", r.id)}
                    onClick={() => onFavorite("restaurants", r.id)}
                  />
                </div>
                <div className="restaurant-info">
                  <div className="restaurant-title">
                    <button onClick={() => onSelect(r)}>
                      <h3>{r.name}</h3>
                    </button>
                    <ArrowUpRight size={21} />
                  </div>
                  <p>
                    {r.cuisine} <span>·</span> {r.foods.length} delicious
                    possibilities
                  </p>
                  <div className="restaurant-meta">
                    <span>
                      <Clock3 size={15} />
                      {r.delivery_minutes}–{r.delivery_minutes + 10} min
                    </span>
                    <span>
                      <Bike size={16} />
                      {money(r.delivery_fee_cents)} delivery
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {!(category ? matchingFoods.length : filtered.length) && (
          <div className="empty">
            <Search />
            <h3>No bites found</h3>
            <p>Try another dish, category, or cuisine.</p>
            <button
              className="secondary"
              onClick={() => {
                setQuery("");
                setCuisine("All");
                setCategory("");
              }}
            >
              Show all restaurants
            </button>
          </div>
        )}
      </section>
      <section className="bottom-banner">
        <div className="banner-icon">
          <Utensils size={32} />
        </div>
        <div>
          <p className="eyebrow">YOUR SOFA IS THE BEST TABLE IN TOWN</p>
          <h2>Stay cozy. We’ll bring the flavor.</h2>
        </div>
        <a
          href="#restaurants"
          className="round-link"
          aria-label="Browse restaurants"
        >
          <ArrowUpRight />
        </a>
      </section>
    </>
  );
}
export function RestaurantMenu({
  restaurant,
  onBack,
  onAdd,
  onFavorite,
  isFavorite,
}) {
  const [category, setCategory] = useState("All");
  const categories = [
    "All",
    ...new Set(restaurant.foods.map((f) => f.category)),
  ];
  return (
    <section className="menu-page">
      <button className="text-button back" onClick={onBack}>
        <ArrowLeft size={17} />
        All restaurants
      </button>
      <div className="menu-hero">
        <div>
          <p className="eyebrow">
            {restaurant.cuisine.toUpperCase()} · MADE FRESH FOR YOU
          </p>
          <h1>
            {restaurant.name}
            <span>.</span>
          </h1>
          <p>{restaurant.description}</p>
          <div className="restaurant-meta">
            <span>
              <Clock3 size={17} />
              {restaurant.delivery_minutes}–{restaurant.delivery_minutes + 10}{" "}
              min
            </span>
            <span>
              <Bike size={18} />
              {money(restaurant.delivery_fee_cents)} delivery
            </span>
          </div>
          <button
            className="secondary"
            onClick={() => onFavorite("restaurants", restaurant.id)}
          >
            <Heart
              size={17}
              fill={
                isFavorite("restaurants", restaurant.id)
                  ? "currentColor"
                  : "none"
              }
            />
            {isFavorite("restaurants", restaurant.id)
              ? "Saved to favorites"
              : "Save restaurant"}
          </button>
        </div>
        <img src={restaurant.image_url} alt={restaurant.cuisine} />
      </div>
      <div className="category-tabs" role="group" aria-label="Food categories">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            className={category === c ? "active" : ""}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="food-grid">
        {restaurant.foods
          .filter((f) => category === "All" || f.category === category)
          .map((f) => (
            <FoodCard
              key={f.id}
              food={f}
              restaurant={restaurant}
              onAdd={onAdd}
              onFavorite={onFavorite}
              isFavorite={isFavorite}
            />
          ))}
      </div>
    </section>
  );
}

function FoodCard({
  food: f,
  restaurant,
  onAdd,
  onFavorite,
  isFavorite,
  onSelect,
}) {
  return (
    <article className="food-card">
      <div className="food-photo">
        <img src={f.image_url} alt={f.name} />
        <FavoriteButton
          active={isFavorite("foods", f.id)}
          label={`Favorite ${f.name}`}
          onClick={() => onFavorite("foods", f.id)}
        />
      </div>
      <div className="food-copy">
        <span className="eyebrow">{f.category}</span>
        <h3>{f.name}</h3>
        {onSelect && (
          <button className="text-button" onClick={() => onSelect(restaurant)}>
            {restaurant.name}
          </button>
        )}
        <p>{f.description}</p>
        <div className="food-bottom">
          <strong>{money(f.price_cents)}</strong>
          <button
            className="add-button"
            onClick={() => onAdd(f, restaurant)}
            aria-label={`Add ${f.name} to cart`}
          >
            <Plus size={17} />
            Add
          </button>
        </div>
      </div>
    </article>
  );
}
