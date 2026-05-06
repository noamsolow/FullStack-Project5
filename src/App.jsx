import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/AppShell.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import RegisterDetails from "./pages/RegisterDetails.jsx";
import Home from "./pages/Home.jsx";
import Todos from "./pages/Todos.jsx";
import Posts from "./pages/Posts.jsx";
import Albums from "./pages/Albums.jsx";
import AlbumPhotos from "./pages/AlbumPhotos.jsx";

function RequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-on-surface">
        <div className="card px-8 py-6 font-semibold">Loading TravelHub...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/details" element={<RegisterDetails />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/home" element={<Home />} />
          <Route path="/users/:userId/todos" element={<Todos />} />
          <Route path="/users/:userId/posts" element={<Posts />} />
          <Route path="/users/:userId/posts/:postId" element={<Posts />} />
          <Route path="/users/:userId/albums" element={<Albums />} />
          <Route path="/users/:userId/albums/:albumId/photos" element={<AlbumPhotos />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
