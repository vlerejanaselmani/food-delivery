import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Store,
  ClipboardList,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { api } from "./api";
import { money } from "./Catalog";
import { OrderCard } from "./AccountPages";
export default function Admin({ onBack, onCatalogChange }) {
  const [tab, setTab] = useState("orders"),
    [restaurants, setRestaurants] = useState([]),
    [orders, setOrders] = useState([]),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [lastPage, setLastPage] = useState(1),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [edit, setEdit] = useState(null),
    [remove, setRemove] = useState(null),
    [busy, setBusy] = useState(false);
  async function load(p = page) {
    setLoading(true);
    setError("");
    try {
      const [r, o] = await Promise.all([
        api("admin/restaurants"),
        api(
          `admin/orders?page=${p}${filter ? `&status=${encodeURIComponent(filter)}` : ""}`,
        ),
      ]);
      setRestaurants(r.data);
      setOrders(o.data);
      setPage(p);
      setLastPage(o.meta.last_page);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load(1);
  }, [filter]);
  async function status(order, value) {
    setBusy(true);
    setError("");
    try {
      await api(`admin/orders/${order.id}`, {
        method: "PATCH",
        body: { status: value },
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function destroy() {
    setBusy(true);
    try {
      await api(`admin/${remove.type}/${remove.item.id}`, { method: "DELETE" });
      setRemove(null);
      await load();
      onCatalogChange();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-page">
      <button className="text-button back" onClick={onBack}>
        <ArrowLeft size={16} />
        Back to storefront
      </button>
      <div className="page-heading">
        <div>
          <p className="eyebrow">A LITTLE CARE BEHIND EVERY ORDER</p>
          <h1>
            The kitchen desk<span>.</span>
          </h1>
          <p className="muted">Manage your menus. Keep good food moving.</p>
        </div>
        <span className="admin-badge">Admin workspace</span>
      </div>
      <div className="admin-toolbar">
        <div className="cuisine-tabs">
          <button
            className={`cuisine-tab ${tab === "orders" ? "active" : ""}`}
            onClick={() => setTab("orders")}
          >
            <ClipboardList size={18} />
            Orders
          </button>
          <button
            className={`cuisine-tab ${tab === "menus" ? "active" : ""}`}
            onClick={() => setTab("menus")}
          >
            <Store size={18} />
            Restaurants & menus
          </button>
        </div>
        <button className="secondary" onClick={() => load()} disabled={loading}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {tab === "orders" ? (
        <>
          <div className="admin-filter">
            <h2>Order board</h2>
            <label>
              Status
              <select
                aria-label="Filter orders by status"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="">All orders</option>
                {["new", "processing", "on the way", "done"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>
          {loading ? (
            <div className="empty">Loading orders…</div>
          ) : orders.length ? (
            <div className="admin-orders">
              {orders.map((o) => (
                <OrderCard key={o.id} order={o}>
                  <div className="admin-order-details">
                    <p>
                      <strong>{o.customer_name}</strong>
                      {o.notes && <span> · {o.notes}</span>}
                    </p>
                    <label>
                      Update status
                      <select
                        aria-label={`Status for order ${o.reference.slice(0, 8)}`}
                        value={o.status}
                        disabled={busy}
                        onChange={(e) => status(o, e.target.value)}
                      >
                        {["new", "processing", "on the way", "done"].map(
                          (s) => (
                            <option key={s}>{s}</option>
                          ),
                        )}
                      </select>
                    </label>
                  </div>
                </OrderCard>
              ))}
            </div>
          ) : (
            <div className="empty">
              <ClipboardList />
              <h3>All quiet in the kitchen.</h3>
              <p>
                {filter
                  ? "No orders with this status."
                  : "New orders will appear here."}
              </p>
            </div>
          )}
          <div className="pagination">
            {page > 1 && (
              <button className="secondary" onClick={() => load(page - 1)}>
                Previous
              </button>
            )}
            {page < lastPage && (
              <button className="secondary" onClick={() => load(page + 1)}>
                Next
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="admin-filter">
            <h2>Your kitchens</h2>
            <button
              className="primary"
              onClick={() => setEdit({ type: "restaurants", item: {} })}
            >
              <Plus size={16} />
              Add restaurant
            </button>
          </div>
          {restaurants.map((r) => (
            <section className="admin-restaurant" key={r.id}>
              <div className="admin-restaurant-header">
                <img src={r.image_url} alt={r.name} />
                <div>
                  <h3>{r.name}</h3>
                  <p>
                    {r.cuisine} ·{" "}
                    {r.is_active ? "Open for orders" : "Hidden from storefront"}{" "}
                    · {r.foods.length} items
                  </p>
                </div>
                <div className="admin-actions">
                  <button
                    className="secondary"
                    aria-label={`Edit ${r.name}`}
                    onClick={() => setEdit({ type: "restaurants", item: r })}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    className="icon danger"
                    aria-label={`Delete ${r.name}`}
                    onClick={() => setRemove({ type: "restaurants", item: r })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Menu item</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Availability</th>
                      <th>
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.foods.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <div className="table-food">
                            <img src={f.image_url} alt="" />
                            <strong>{f.name}</strong>
                          </div>
                        </td>
                        <td>{f.category}</td>
                        <td>{money(f.price_cents)}</td>
                        <td>
                          <span
                            className={`status ${f.is_available ? "status-done" : ""}`}
                          >
                            {f.is_available ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              className="icon"
                              aria-label={`Edit ${f.name}`}
                              onClick={() =>
                                setEdit({ type: "foods", item: f })
                              }
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              className="icon danger"
                              aria-label={`Delete ${f.name}`}
                              onClick={() =>
                                setRemove({ type: "foods", item: f })
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="text-button add-menu-item"
                onClick={() =>
                  setEdit({ type: "foods", item: { restaurant_id: r.id } })
                }
              >
                <Plus size={16} />
                Add menu item
              </button>
            </section>
          ))}
        </>
      )}
      {edit && (
        <Editor
          edit={edit}
          restaurants={restaurants}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
            onCatalogChange();
          }}
        />
      )}
      {remove && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete {remove.item.name}?</h2>
            <p className="muted">
              {remove.type === "restaurants"
                ? "This removes the restaurant and its menu. "
                : "This removes the item from the menu. "}
              Existing order history will be preserved. You can hide it using
              Edit instead.
            </p>
            <div className="dialog-actions">
              <button className="secondary" onClick={() => setRemove(null)}>
                Keep it
              </button>
              <button className="primary" disabled={busy} onClick={destroy}>
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
function Editor({ edit, restaurants, onClose, onSaved }) {
  const { type, item } = edit;
  const restaurant = type === "restaurants";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.target);
    const body = Object.fromEntries(form);
    if (restaurant) {
      body.delivery_fee_cents = Math.round(Number(body.delivery_fee) * 100);
      delete body.delivery_fee;
      body.delivery_minutes = Number(body.delivery_minutes);
      body.is_active = form.has("is_active");
    } else {
      body.price_cents = Math.round(Number(body.price) * 100);
      delete body.price;
      body.restaurant_id = Number(body.restaurant_id);
      body.is_available = form.has("is_available");
    }
    try {
      if (photo && !restaurant) {
        const upload = new FormData();
        upload.append("image", photo);
        const result = await api("admin/food-images", {
          method: "POST",
          body: upload,
        });
        body.image_url = result.image_url;
      }
      await api(`admin/${type}${item.id ? `/${item.id}` : ""}`, {
        method: item.id ? "PATCH" : "POST",
        body,
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section
        className="modal editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <button
          className="icon close"
          onClick={onClose}
          aria-label="Close editor"
        >
          <X />
        </button>
        <p className="eyebrow">A GOOD MENU STARTS HERE</p>
        <h2 id="editor-title">
          {item.id ? "Edit" : "Add"} {restaurant ? "restaurant" : "menu item"}
        </h2>
        <form onSubmit={save}>
          <label>
            Name
            <input
              name="name"
              defaultValue={item.name || ""}
              required
              maxLength={100}
            />
          </label>
          {restaurant ? (
            <label>
              Cuisine
              <select name="cuisine" defaultValue={item.cuisine || "Italian"}>
                {["Italian", "Burgers", "Kebab", "Other"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label>
                Restaurant
                <select name="restaurant_id" defaultValue={item.restaurant_id}>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Category
                <input
                  name="category"
                  list="categories"
                  defaultValue={item.category || ""}
                  required
                  maxLength={60}
                />
                <datalist id="categories">
                  {[
                    "Pizza",
                    "Pasta",
                    "Burgers",
                    "Wraps",
                    "Plates",
                    "Sides",
                    "Desserts",
                    "Drinks",
                  ].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </label>
            </>
          )}
          <label>
            Description
            <textarea
              name="description"
              defaultValue={item.description || ""}
              required
              maxLength={1000}
              rows={3}
            />
          </label>
          <label>
            Image
            <select
              name="image_url"
              defaultValue={item.image_url || "/images/pizza.jpg"}
            >
              {[
                "pizza",
                "burger",
                "kebab",
                "pasta",
                "salad",
                "fries",
                "dessert",
                "chicken",
                "grill",
                "hummus",
              ].map((i) => (
                <option key={i} value={`/images/${i}.jpg`}>
                  {i[0].toUpperCase() + i.slice(1)}
                </option>
              ))}
              {item.image_url && !item.image_url.startsWith("/images/") && (
                <option value={item.image_url}>Current image</option>
              )}
            </select>
          </label>
          {!restaurant && (
            <div className="photo-upload">
              <label>
                Upload a photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (file && file.size > 5 * 1024 * 1024) {
                      setError("Choose a photo smaller than 5 MB.");
                      e.target.value = "";
                      setPhoto(null);
                      return;
                    }
                    setError("");
                    setPhoto(file);
                  }}
                />
              </label>
              <p className="muted">
                JPEG, PNG, or WebP · up to 5 MB. Uploading replaces the selected
                image when saved.
              </p>
              {(preview || item.image_url) && (
                <img
                  className="upload-preview"
                  src={preview || item.image_url}
                  alt="Food photo preview"
                />
              )}
            </div>
          )}
          {restaurant ? (
            <div className="form-row">
              <label>
                Delivery fee (€)
                <input
                  type="number"
                  name="delivery_fee"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={(item.delivery_fee_cents ?? 150) / 100}
                  required
                />
              </label>
              <label>
                Delivery time (minutes)
                <input
                  type="number"
                  name="delivery_minutes"
                  min="5"
                  max="180"
                  defaultValue={item.delivery_minutes ?? 30}
                  required
                />
              </label>
            </div>
          ) : (
            <label>
              Price (€)
              <input
                type="number"
                name="price"
                min="0.01"
                max="1000"
                step="0.01"
                defaultValue={(item.price_cents ?? 500) / 100}
                required
              />
            </label>
          )}
          <label className="checkbox-label">
            <input
              type="checkbox"
              name={restaurant ? "is_active" : "is_available"}
              defaultChecked={
                restaurant
                  ? item.is_active !== false
                  : item.is_available !== false
              }
            />
            {restaurant ? "Visible and accepting orders" : "Available to order"}
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary wide" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </section>
    </div>
  );
}
