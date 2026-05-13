import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";

export function useAlbums({ user, params, setParams }) {
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [counts, setCounts] = useState({});
  const [previewAlbum, setPreviewAlbum] = useState(null);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = params.get("q") || "";

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/albums?userId=${user.id}`, { cache: false }), api.get("/photos", { cache: false })])
      .then(([albumData, photoData]) => {
        setAlbums(albumData);
        setPhotos(photoData);
        setCounts(countPhotosByAlbum(photoData));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  const visibleAlbums = useMemo(() => {
    return albums.filter((album) => !q || String(album.id) === q || album.title.toLowerCase().includes(q.toLowerCase()));
  }, [albums, q]);

  async function addAlbum(event) {
    event.preventDefault();
    const normalizedTitle = title.trim();
    if (!normalizedTitle || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const created = await api.post("/albums", {
        userId: user.id,
        title: normalizedTitle
      });
      setAlbums((current) => [...current, created]);
      setTitle("");
      setParams({});
    } catch (err) {
      setError(err.message || "Failed to add album.");
    } finally {
      setSubmitting(false);
    }
  }

  function getAlbumPhotos(album) {
    return photos.filter((photo) => Number(photo.albumId) === Number(album.id));
  }

  return {
    addAlbum,
    counts,
    error,
    getAlbumPhotos,
    loading,
    photos,
    previewAlbum,
    q,
    setPreviewAlbum,
    setParams,
    setTitle,
    submitting,
    title,
    visibleAlbums
  };
}

function countPhotosByAlbum(photos) {
  return photos.reduce((acc, photo) => {
    acc[photo.albumId] = (acc[photo.albumId] || 0) + 1;
    return acc;
  }, {});
}
