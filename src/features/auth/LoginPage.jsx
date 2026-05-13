import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { travelImages } from "../../data/travelImages.js";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || "/home"} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const loggedIn = await login(form.username, form.password);
      navigate(location.state?.from?.pathname || "/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-40px)] max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-floating md:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden md:block">
          <img src={travelImages[7]} alt="Amalfi Coast" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-white">
            <h1 className="font-serif text-6xl font-semibold">TravelHub</h1>
            <p className="mt-4 max-w-lg text-lg leading-8">A social travel journal for posts, albums, comments, and trip tasks.</p>
          </div>
        </section>
        <section className="flex items-center justify-center p-8">
          <form className="w-full max-w-md" onSubmit={handleSubmit}>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Welcome back</p>
            <h2 className="mt-3 font-serif text-5xl font-medium">Log in</h2>
            <p className="mt-3 text-on-surface-variant">Use a seeded JSONPlaceholder username and the matching website as password.</p>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Username</span>
                <input className="field" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold">Password</span>
                <input className="field" type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
              </label>
            </div>

            {error && <p className="mt-4 rounded-2xl bg-error-soft px-4 py-3 font-bold text-error">{error}</p>}

            <button className="btn-primary mt-6 w-full" disabled={submitting}>
              {submitting ? "Checking..." : "Login"}
            </button>
            <p className="mt-5 text-center text-sm text-on-surface-variant">
              New traveler?{" "}
              <Link className="font-bold text-primary" to="/register">
                Register
              </Link>
            </p>
            <div className="mt-6 rounded-2xl bg-surface-low p-4 text-sm text-on-surface-variant">
              Demo: username <b>Bret</b>, password <b>hildegard.org</b>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
