import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getRandomAvatar } from "../data/travelImages.js";
import { api } from "../lib/api.js";

const STORAGE_KEY = "travelhub.activeUserId";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (!storedId) {
      setLoading(false);
      return;
    }

    api
      .get(`/users/${storedId}`, { cache: false })
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const users = await api.get(`/users?username=${encodeURIComponent(username.trim())}`, { cache: false });
    const matched = users.find((candidate) => candidate.website === password.trim());
    if (!matched) {
      throw new Error("Username or password is incorrect.");
    }
    localStorage.setItem(STORAGE_KEY, String(matched.id));
    setUser(matched);
    return matched;
  }

  async function register(details) {
    const existing = await api.get(`/users?username=${encodeURIComponent(details.username.trim())}`, { cache: false });
    if (existing.length > 0) {
      throw new Error("This username already exists.");
    }
    const users = await api.get("/users", { cache: false });
    const usedAvatars = users.map((candidate) => candidate.avatar);
    const preferredGender = details.avatarGender === "male" || details.avatarGender === "female" ? details.avatarGender : undefined;
    const created = await api.post("/users", {
      name: details.name.trim(),
      username: details.username.trim(),
      email: details.email.trim(),
      phone: details.phone.trim(),
      website: details.password.trim(),
      address: {
        street: details.street.trim(),
        suite: details.suite.trim(),
        city: details.city.trim(),
        zipcode: details.zipcode.trim()
      },
      company: {
        name: details.company.trim(),
        catchPhrase: details.travelStyle.trim(),
        bs: "traveler"
      },
      avatar: details.avatar && !usedAvatars.includes(details.avatar) ? details.avatar : getRandomAvatar({ excluded: usedAvatars, preferredGender })
    });
    localStorage.setItem(STORAGE_KEY, String(created.id));
    setUser(created);
    return created;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    api.clearCache();
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
