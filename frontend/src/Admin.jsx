import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Store,
  ClipboardList,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import Editor from "./MenuEditor";
import CreateAdmin from "./CreateAdmin";
import { api } from "./api";
import { money } from "./Catalog";
import { OrderCard } from "./AccountPages";
export default function Admin({
  onBack,
  onCatalogChange,
  tab: routeTab,
  onTabChange,
}) {
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [notice, setNotice] = useState("");
  const [localTab, setLocalTab] = useState("orders"),
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
  const tab = routeTab ?? localTab;
  const setTab = onTabChange ?? setLocalTab;
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
        <button
          className="primary"
          onClick={() => {
            setNotice("");
            setCreatingAdmin(true);
          }}
        >
          <Plus size={18} />
          Create admin
        </button>
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
      {creatingAdmin && (
        <CreateAdmin
          onClose={() => setCreatingAdmin(false)}
          onCreated={(admin) => {
            setCreatingAdmin(false);
            setNotice(
              `Admin account created for ${admin.email}. They can sign in now.`,
            );
          }}
        />
      )}
      {notice && <p role="status">{notice}</p>}
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
