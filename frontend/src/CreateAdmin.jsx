import { useState } from "react";
import { X } from "lucide-react";
import { api } from "./api";

export default function CreateAdmin({ onClose, onCreated }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      const { user } = await api("admin/admins", { method: "POST", body });
      onCreated(user);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop">
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-admin-title"
      >
        <button
          className="icon close"
          onClick={onClose}
          disabled={busy}
          aria-label="Close create admin"
        >
          <X />
        </button>
        <p className="eyebrow">GROW YOUR KITCHEN TEAM</p>
        <h2 id="create-admin-title">Create admin</h2>
        <p className="muted">
          This account can manage restaurants, menus, orders, and create other
          admins.
        </p>
        <form onSubmit={submit}>
          <label>
            Name
            <input
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              disabled={busy}
            />
          </label>
          <label>
            Email address
            <input
              name="email"
              type="email"
              required
              maxLength={255}
              autoComplete="off"
              disabled={busy}
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              required
              minLength={6}
              maxLength={128}
              autoComplete="new-password"
              disabled={busy}
            />
          </label>
          <p className="muted">
            Use at least 6 characters. Share the login details with your
            teammate.
          </p>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary full" disabled={busy}>
            {busy ? "Creating…" : "Create admin account"}
          </button>
        </form>
      </section>
    </div>
  );
}
