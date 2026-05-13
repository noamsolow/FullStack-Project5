import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "../../components/ui/Status.jsx";
import Icon from "../../components/ui/Icon.jsx";

export default function AlbumPreview({ album, photos, manageUrl, onClose }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activePhoto = photos[activeIndex];

  function goToPhoto(index) {
    setActiveIndex((index + photos.length) % photos.length);
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
            {activePhoto ? (
              <img src={activePhoto.url} alt={activePhoto.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full min-h-[360px] place-items-center p-6 text-center">
                <EmptyState title="No photos yet" body="Use Manage photos to add images to this album." />
              </div>
            )}

            {photos.length > 1 && (
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

            {activePhoto && (
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div className="max-w-xl rounded-2xl bg-white/80 p-4 backdrop-blur-xl">
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">
                    Photo {activeIndex + 1} of {photos.length}
                  </p>
                  <h3 className="mt-1 font-serif text-3xl">{activePhoto.title}</h3>
                </div>
                <div className="hidden rounded-full bg-white/80 px-4 py-3 backdrop-blur-xl md:flex md:gap-2">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      className={`h-2 rounded-full transition ${index === activeIndex ? "w-8 bg-primary" : "w-2 bg-outline-variant hover:bg-outline"}`}
                      onClick={() => goToPhoto(index)}
                      aria-label={`Preview photo ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {photos.length > 1 ? (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {photos.map((photo, index) => (
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
