import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AppShell from "./components/layout/AppShell.jsx";
import Login from "./features/auth/LoginPage.jsx";
import Register from "./features/auth/RegisterPage.jsx";
import RegisterDetails from "./features/auth/RegisterDetailsPage.jsx";
import FeedPage from "./features/feed/FeedPage.jsx";
import MyPostsPage from "./features/my-posts/MyPostsPage.jsx";
import TodosPage from "./features/todos/TodosPage.jsx";
import AlbumsPage from "./features/albums/AlbumsPage.jsx";
import AlbumPhotosPage from "./features/albums/AlbumPhotosPage.jsx";

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
          <Route path="/home" element={<FeedPage />} />
          <Route path="/home/:postId" element={<FeedPage />} />
          <Route path="/users/:userId/todos" element={<TodosPage />} />
          <Route path="/users/:userId/posts" element={<MyPostsPage />} />
          <Route path="/users/:userId/posts/:postId" element={<MyPostsPage />} />
          <Route path="/users/:userId/albums" element={<AlbumsPage />} />
          <Route path="/users/:userId/albums/:albumId/photos" element={<AlbumPhotosPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
