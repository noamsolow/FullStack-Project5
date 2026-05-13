import { useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Status.jsx";
import Icon from "../../components/ui/Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import AlbumCard from "./AlbumCard.jsx";
import AlbumPreview from "./AlbumPreview.jsx";
import { useAlbums } from "./useAlbums.js";

export default function AlbumsPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const albumsState = useAlbums({ user, params, setParams });

  return (
    <div className="page-shell !max-w-none">
      <header className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-serif text-5xl">Albums</h1>
          <p className="mt-2 text-on-surface-variant">Bento destination galleries for the active user.</p>
        </div>
        <form className="flex flex-col gap-3 md:w-[520px] md:flex-row" onSubmit={albumsState.addAlbum}>
          <input className="field" value={albumsState.title} onChange={(event) => albumsState.setTitle(event.target.value)} placeholder="Create new album..." />
          <button className="btn-primary whitespace-nowrap" disabled={albumsState.submitting}>
            <Icon name="add" />
            {albumsState.submitting ? "Creating..." : "Create New Album"}
          </button>
        </form>
      </header>

      <div className="mb-10 max-w-2xl">
        <label className="relative block">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
          <input
            className="field !pl-12 !py-4 text-lg"
            value={albumsState.q}
            onChange={(event) => albumsState.setParams({ q: event.target.value })}
            placeholder="Search albums by id or title..."
          />
        </label>
      </div>

      {albumsState.error && <ErrorState message={albumsState.error} />}
      {albumsState.loading ? (
        <LoadingState label="Loading albums..." />
      ) : albumsState.visibleAlbums.length === 0 ? (
        <EmptyState title="No albums found" body="Create a new album or change the search." />
      ) : (
        <section className="grid auto-rows-[320px] grid-cols-1 gap-8 lg:grid-cols-3">
          {albumsState.visibleAlbums.map((album, index) => (
            <AlbumCard
              key={album.id}
              album={album}
              count={albumsState.counts[album.id]}
              isLarge={index === 0}
              photos={albumsState.getAlbumPhotos(album)}
              onPreview={albumsState.setPreviewAlbum}
            />
          ))}
        </section>
      )}

      {albumsState.previewAlbum && (
        <AlbumPreview
          album={albumsState.previewAlbum}
          photos={albumsState.getAlbumPhotos(albumsState.previewAlbum).slice(0, 6)}
          manageUrl={`/users/${user.id}/albums/${albumsState.previewAlbum.id}/photos`}
          onClose={() => albumsState.setPreviewAlbum(null)}
        />
      )}
    </div>
  );
}
