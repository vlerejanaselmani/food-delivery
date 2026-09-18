import { useEffect, useState } from "react";
import { X } from "lucide-react";
import foodPhotos from "./foodPhotos.json";
import { api } from "./api";

export default function MenuEditor({ edit, restaurants, onClose, onSaved }) {
  const { type, item } = edit;
  const restaurant = type === "restaurants";
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [selectedImage, setSelectedImage] = useState(
    item.image_url || "/images/pizza.jpg",
  );
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
              value={selectedImage}
              onChange={(event) => setSelectedImage(event.target.value)}
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
              {!restaurant &&
                foodPhotos.map((photo) => (
                  <option key={photo.url} value={photo.url}>
                    {photo.name}
                  </option>
                ))}
              {item.image_url &&
                !foodPhotos.some((photo) => photo.url === item.image_url) && (
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
              {(preview || selectedImage) && (
                <img
                  className="upload-preview"
                  src={preview || selectedImage}
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
