import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", verifyPassword: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (form.password !== form.verifyPassword) {
      setError("Passwords do not match.");
      return;
    }
    const existing = await api.get(`/users?username=${encodeURIComponent(form.username.trim())}`, { cache: false });
    if (existing.length > 0) {
      setError("This username already exists.");
      return;
    }
    sessionStorage.setItem("travelhub.pendingRegister", JSON.stringify(form));
    navigate("/register/details");
  }

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] max-w-3xl items-center justify-center rounded-[36px] bg-white p-8 shadow-floating">
        <form className="w-full max-w-lg" onSubmit={handleSubmit}>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Join TravelHub</p>
          <h1 className="mt-3 font-serif text-5xl">Register</h1>
          <p className="mt-3 text-on-surface-variant">First choose credentials. The next screen completes your user profile.</p>
          <div className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Username</span>
              <input className="field" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Password</span>
              <input className="field" type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Verify Password</span>
              <input className="field" type="password" autoComplete="new-password" value={form.verifyPassword} onChange={(event) => setForm({ ...form, verifyPassword: event.target.value })} required />
            </label>
          </div>
          {error && <p className="mt-4 rounded-2xl bg-error-soft px-4 py-3 font-bold text-error">{error}</p>}
          <button className="btn-primary mt-6 w-full">Continue</button>
          <p className="mt-5 text-center text-sm text-on-surface-variant">
            Already registered?{" "}
            <Link className="font-bold text-primary" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
