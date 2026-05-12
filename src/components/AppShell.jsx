import { useState } from "react";
import { NavLink, Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { avatarImages } from "../data/travelImages.js";
import InfoDrawer from "./InfoDrawer.jsx";
import Icon from "./Icon.jsx";

function activeClass({ isActive }) {
  return `px-3 py-2 text-sm font-semibold transition ${
    isActive ? "text-primary border-b-2 border-primary" : "text-[#56627a] hover:text-primary"
  }`;
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const [infoOpen, setInfoOpen] = useState(false);
  const { userId } = useParams();
  const location = useLocation();
  const avatar = user.avatar || avatarImages[(Number(user.id) - 1) % avatarImages.length];

  if (userId && Number(userId) !== Number(user.id)) {
    return <Navigate to={location.pathname.replace(`/users/${userId}`, `/users/${user.id}`) + location.search} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 py-5 pointer-events-none">
        <nav className="glass-nav pointer-events-auto flex w-full max-w-[1200px] items-center justify-between gap-4 rounded-full px-7 py-4 shadow-floating">
          <NavLink to="/home" className="font-serif text-4xl font-bold tracking-tight text-[#101727]">
            TravelHub
          </NavLink>
          <div className="hidden items-center gap-6 md:flex">
            <NavLink to="/home" className={activeClass}>
              Home
            </NavLink>
            <NavLink to={`/users/${user.id}/todos`} className={activeClass}>
              Todos
            </NavLink>
            <NavLink to={`/users/${user.id}/posts`} className={activeClass}>
              My Posts
            </NavLink>
            <NavLink to={`/users/${user.id}/albums`} className={activeClass}>
              My Albums
            </NavLink>
          </div>
          <div className="flex items-center gap-4">
            <button className="h-11 w-11 overflow-hidden rounded-full border border-outline-variant bg-surface-low" onClick={() => setInfoOpen(true)} title="Open profile">
              <img src={avatar} alt={user.name} className="h-full w-full object-cover" />
            </button>
            <button className="hidden rounded-full bg-surface-low px-4 py-2 text-sm font-bold text-on-surface-variant transition hover:bg-surface-high hover:text-primary md:inline-flex" onClick={logout}>
              Log out
            </button>
          </div>
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-outline-variant/40 bg-white/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-2 text-xs font-bold">
          <NavLink to={`/users/${user.id}/todos`} className="flex flex-col items-center gap-1 text-on-surface-variant">
            <Icon name="checklist" />
            Todos
          </NavLink>
          <NavLink to="/home" className="flex flex-col items-center gap-1 text-on-surface-variant">
            <Icon name="article" />
            Home
          </NavLink>
          <NavLink to={`/users/${user.id}/posts`} className="flex flex-col items-center gap-1 text-on-surface-variant">
            <Icon name="edit" />
            My Posts
          </NavLink>
          <NavLink to={`/users/${user.id}/albums`} className="flex flex-col items-center gap-1 text-on-surface-variant">
            <Icon name="photo_library" />
            My Albums
          </NavLink>
          <button className="flex flex-col items-center gap-1 text-on-surface-variant" onClick={logout}>
            <Icon name="close" />
            Logout
          </button>
        </div>
      </nav>

      <InfoDrawer open={infoOpen} onClose={() => setInfoOpen(false)} user={user} />
    </div>
  );
}
