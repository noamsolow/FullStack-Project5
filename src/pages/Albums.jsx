import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { travelImages } from "../data/travelImages.js";
import Icon from "../components/Icon.jsx";

export default function Albums() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [albums, setAlbums] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [counts, setCounts] = useState({});
  const [previewAlbum, setPreviewAlbum] = useState(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const q = params.get("q") || "";

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/albums?userId=${user.id}`, { cache: false }), api.get("/photos", { cache: false })])
      .then(([albumData, photoData]) => {
        setAlbums(albumData);
        setPhotos(photoData);
        setCounts(
          photoData.reduce((acc, photo) => {
            acc[photo.albumId] = (acc[photo.albumId] || 0) + 1;
            return acc;
          }, {})
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  const visibleAlbums = useMemo(() => {
    return albums.filter((album) => !q || String(album.id) === q || album.title.toLowerCase().includes(q.toLowerCase()));
  }, [albums, q]);

  async function addAlbum(event) {
    event.preventDefault();
    if (!title.trim()) return;
    const created = await api.post("/albums", { userId: user.id, title: title.trim(), cover: travelImages[albums.length % travelImages.length] });
    setAlbums((current) => [...current, created]);
    setTitle("");
  }

  return (
    <div className="page-shell !max-w-none">
      <header className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-5xl">Albums</h1>
          <p className="mt-2 text-on-surface-variant">Bento destination galleries for the active user.</p>
        </div>
        <form className="flex flex-col gap-3 md:w-[520px] md:flex-row" onSubmit={addAlbum}>
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Create new album..." />
          <button className="btn-primary whitespace-nowrap">
            <Icon name="add" />
            Create New Album
          </button>
        </form>
      </header>

      <div className="mb-10 max-w-2xl">
        <label className="relative block">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input className="field !pl-12 !py-4 text-lg" value={q} onChange={(event) => setParams({ q: event.target.value })} placeholder="Search albums by id or title..." />
        </label>
      </div>

      {error && <ErrorState message={error} />}
      {loading ? (
        <LoadingState label="Loading albums..." />
      ) : visibleAlbums.length === 0 ? (
        <EmptyState title="No albums found" body="Create a new album or change the search." />
      ) : (
        <section className="grid auto-rows-[320px] grid-cols-1 gap-8 lg:grid-cols-3">
          {visibleAlbums.map((album, index) => {
            const large = index === 0 ? "lg:col-span-2 lg:row-span-2" : "";
            const cover = album.cover || travelImages[index % travelImages.length];
            return (
              <article key={album.id} className={`group relative overflow-hidden rounded-[32px] bg-white shadow-floating ${large}`}>
                <img src={cover} alt={album.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/35 backdrop-blur-xl">
                  <Icon name="more_horiz" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/75 p-5 backdrop-blur-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <h2 className="font-serif text-3xl">{album.title}</h2>
                      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-on-surface-variant">
                        <Icon name="image" />
                        Album #{album.id} - {counts[album.id] || 0} Photos
                      </p>
                    </div>
                    <button className="btn-primary !rounded-full !px-5 !py-2" onClick={() => setPreviewAlbum(album)}>
                      Preview
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {previewAlbum && (
        <AlbumPreview
          album={previewAlbum}
          photos={photos.filter((photo) => Number(photo.albumId) === Number(previewAlbum.id)).slice(0, 6)}
          cover={previewAlbum.cover || travelImages[0]}
          manageUrl={`/users/${user.id}/albums/${previewAlbum.id}/photos`}
          onClose={() => setPreviewAlbum(null)}
        />
      )}
    </div>
  );
}

function AlbumPreview({ album, photos, cover, manageUrl, onClose }) {
  const previewPhotos = photos.length ? photos : [{ id: "cover", title: album.title, url: cover }];
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = previewPhotos[activeIndex];

  function goToPhoto(index) {
    setActiveIndex((index + previewPhotos.length) % previewPhotos.length);
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#101727]/55 p-4 backdrop-blur-md md:p-8" role="dialog" aria-modal="true" aria-label={`${album.title} preview`}>
      <div className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[32px] bg-white shadow-floating">
        <header className="flex items-center justify-between gap-4 border-b border-surface-high p-5 md:p-7">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.16em] text-primary">Album Preview</p>
            <h2 className="font-serif text-4xl">{album.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link className="btn-primary !rounded-full" to={manageUrl}>
              Manage photos
            </Link>
            <button className="icon-btn" onClick={onClose} aria-label="Close preview">
              <Icon name="close" />
            </button>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col p-5 md:p-7">
          <div className="group relative min-h-[360px] flex-1 overflow-hidden rounded-[28px] bg-surface-low">
            <img src={activePhoto.url} alt={activePhoto.title} className="h-full w-full object-cover" />

            {previewPhotos.length > 1 && (
              <>
                <button
                  className="absolute left-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-on-surface shadow-sm backdrop-blur-md transition hover:bg-white"
                  onClick={() => goToPhoto(activeIndex - 1)}
                  aria-label="Previous photo"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  className="absolute right-5 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/70 text-on-surface shadow-sm backdrop-blur-md transition hover:bg-white"
                  onClick={() => goToPhoto(activeIndex + 1)}
                  aria-label="Next photo"
                >
                  <Icon name="chevron_right" />
                </button>
              </>
            )}

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
              <div className="max-w-xl rounded-2xl bg-white/80 p-4 backdrop-blur-xl">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                  Photo {activeIndex + 1} of {previewPhotos.length}
                </p>
                <h3 className="mt-1 font-serif text-3xl">{activePhoto.title}</h3>
              </div>
              <div className="hidden rounded-full bg-white/80 px-4 py-3 backdrop-blur-xl md:flex md:gap-2">
                {previewPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    className={`h-2 rounded-full transition ${index === activeIndex ? "w-8 bg-primary" : "w-2 bg-outline-variant hover:bg-outline"}`}
                    onClick={() => goToPhoto(index)}
                    aria-label={`Preview photo ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {previewPhotos.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {previewPhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  className={`h-20 w-28 shrink-0 overflow-hidden rounded-2xl border-2 transition ${index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"}`}
                  onClick={() => goToPhoto(index)}
                  aria-label={`Open ${photo.title}`}
                >
                  <img src={photo.thumbnailUrl || photo.url} alt={photo.title} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            photos.length === 0 && (
              <div className="mt-4 rounded-[24px] bg-surface-low p-6 text-center">
                <EmptyState title="No photos yet" body="Use Manage photos to add images to this album." />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
