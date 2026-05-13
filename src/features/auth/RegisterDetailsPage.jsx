import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { getRandomAvatar } from "../../data/travelImages.js";

export default function RegisterDetails() {
  const pending = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("travelhub.pendingRegister"));
    } catch {
      return null;
    }
  }, []);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [details, setDetails] = useState(() => ({
    name: "",
    email: "",
    phone: "",
    street: "",
    suite: "",
    city: "",
    zipcode: "",
    company: "",
    travelStyle: "Seeking memorable routes and honest local stories.",
    avatarGender: "any",
    avatar: getRandomAvatar()
  }));

  if (!pending) return <Navigate to="/register" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      const created = await register({ ...details, username: pending.username, password: pending.password });
      sessionStorage.removeItem("travelhub.pendingRegister");
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-background p-5 md:p-10">
      <div className="mx-auto max-w-5xl rounded-[36px] bg-white p-8 shadow-floating">
        <form onSubmit={handleSubmit}>
          <h1 className="font-serif text-5xl">Complete your profile</h1>
          <p className="mt-3 text-on-surface-variant">These details become your Info drawer and JSON Server user record.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["name", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["street", "Street"],
              ["suite", "Suite"],
              ["city", "City"],
              ["zipcode", "Zip code"],
              ["company", "Company or travel role"]
            ].map(([key, label]) => (
              <label className="block" key={key}>
                <span className="mb-2 block text-sm font-bold">{label}</span>
                <input className="field" value={details[key]} onChange={(event) => setDetails({ ...details, [key]: event.target.value })} required />
              </label>
            ))}
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-bold">Travel style</span>
              <textarea className="field min-h-28" value={details.travelStyle} onChange={(event) => setDetails({ ...details, travelStyle: event.target.value })} required />
            </label>
            <div className="flex items-center gap-4 rounded-[28px] bg-surface-low p-4 md:col-span-2">
              <img src={details.avatar} alt="Generated profile" className="h-20 w-20 rounded-full border border-outline-variant object-cover" />
              <div className="flex-1">
                <p className="font-bold">Profile photo</p>
                <p className="mt-1 text-sm text-on-surface-variant">A random profile photo will be saved with the new user.</p>
                <select
                  className="field mt-3 max-w-44 !rounded-xl !py-2"
                  value={details.avatarGender}
                  onChange={(event) => {
                    const avatarGender = event.target.value;
                    setDetails({
                      ...details,
                      avatarGender,
                      avatar: getRandomAvatar({
                        excluded: [details.avatar],
                        preferredGender: avatarGender === "any" ? undefined : avatarGender
                      })
                    });
                  }}
                >
                  <option value="any">Any photo</option>
                  <option value="male">Male photo</option>
                  <option value="female">Female photo</option>
                </select>
              </div>
              <button
                className="btn-secondary"
                type="button"
                onClick={() =>
                  setDetails({
                    ...details,
                    avatar: getRandomAvatar({
                      excluded: [details.avatar],
                      preferredGender: details.avatarGender === "any" ? undefined : details.avatarGender
                    })
                  })
                }
              >
                Random photo
              </button>
            </div>
          </div>
          {error && <p className="mt-4 rounded-2xl bg-error-soft px-4 py-3 font-bold text-error">{error}</p>}
          <button className="btn-primary mt-6">Create account</button>
        </form>
      </div>
    </div>
  );
}
