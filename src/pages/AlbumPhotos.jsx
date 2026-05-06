import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { travelImages } from "../data/travelImages.js";
import Icon from "../components/Icon.jsx";

const PAGE_LIMIT = 6;

export default function AlbumPhotos() {
  const { user } = useAuth();
  const { albumId } = useParams();
  const [params, setParams] = useSearchParams();
  const [album, setAlbum] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [totalLoaded, setTotalLoaded] = useState(false);
  const [form, setForm] = useState({ title: "", url: "" });
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const page = Number(params.get("page") || "1");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/albums/${albumId}`, { cache: false }),
      api.get(`/photos?albumId=${albumId}&_page=1&_limit=${page * PAGE_LIMIT}`, { cache: false })
    ])
      .then(([albumData, photoData]) => {
        if (Number(albumData.userId) !== Number(user.id)) {
          throw new Error("This album does not belong to the active user.");
        }
        setAlbum(albumData);
        setPhotos(photoData);
        setTotalLoaded(photoData.length < page * PAGE_LIMIT);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [albumId, page, user.id]);

  async function addPhoto(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    const url = form.url.trim() || travelImages[(photos.length + Number(albumId)) % travelImages.length];
    const created = await api.post("/photos", {
      albumId: Number(albumId),
      title: form.title.trim(),
      url,
      thumbnailUrl: url
    });
    setPhotos((current) => [created, ...current]);
    setForm({ title: "", url: "" });
  }

  async function savePhoto(photo) {
    if (!editing?.title.trim() || !editing?.url.trim()) return;
    const updated = await api.patch(`/photos/${photo.id}`, {
      title: editing.title.trim(),
      url: editing.url.trim(),
      thumbnailUrl: editing.url.trim()
    });
    setPhotos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setEditing(null);
  }

  async function deletePhoto(id) {
    await api.delete(`/photos/${id}`);
    setPhotos((current) => current.filter((photo) => photo.id !== id));
  }

  return (
    <div className="page-shell">
      <Link to={`/users/${user.id}/albums`} className="btn-secondary mb-6">
        <Icon name="arrow_back" />
        Back to Albums
      </Link>

      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Loading album photos..." />
      ) : album ? (
        <>
          <header className="mb-8 card p-8">
            <p className="text-sm font-bold text-primary">Album #{album.id}</p>
            <h1 className="mt-2 font-serif text-5xl">{album.title}</h1>
            <p className="mt-2 text-on-surface-variant">Photos are fetched gradually with JSON Server pagination.</p>
          </header>

          <form className="mb-8 grid gap-3 rounded-[24px] bg-white p-5 shadow-spatial md:grid-cols-[1fr_1fr_auto]" onSubmit={addPhoto}>
            <input className="field" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="New photo title" />
            <input className="field" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} placeholder="Image URL or leave blank" />
            <button className="btn-primary">
              <Icon name="add" />
              Add Photo
            </button>
          </form>

          {photos.length === 0 ? (
            <EmptyState title="No photos yet" body="Add the first photo to this album." />
          ) : (
            <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo) => (
                <article key={photo.id} className="card overflow-hidden">
                  <img src={photo.url} alt={photo.title} className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <p className="mb-2 text-sm font-bold text-outline">Photo #{photo.id}</p>
                    {editing?.id === photo.id ? (
                      <div className="space-y-3">
                        <input className="field" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
                        <input className="field" value={editing.url} onChange={(event) => setEditing({ ...editing, url: event.target.value })} />
                      </div>
                    ) : (
                      <h2 className="font-serif text-2xl">{photo.title}</h2>
                    )}
                    <div className="mt-5 flex gap-2">
                      {editing?.id === photo.id ? (
                        <button className="btn-primary" onClick={() => savePhoto(photo)}>
                          Save
                        </button>
                      ) : (
                        <button className="btn-secondary" onClick={() => setEditing({ id: photo.id, title: photo.title, url: photo.url })}>
                          <Icon name="edit" />
                          Edit
                        </button>
                      )}
                      <button className="btn-secondary hover:!text-error" onClick={() => deletePhoto(photo.id)}>
                        <Icon name="delete" />
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          )}

          {!totalLoaded && (
            <div className="mt-8 flex justify-center">
              <button className="btn-primary" onClick={() => setParams({ page: String(page + 1) })}>
                Load More Photos
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
