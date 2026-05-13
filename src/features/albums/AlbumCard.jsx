import Icon from "../../components/ui/Icon.jsx";

export default function AlbumCard({ album, count, isLarge, photos, onPreview }) {
  const coverPhoto = photos[0];
  const cover = coverPhoto?.thumbnailUrl || coverPhoto?.url;

  return (
    <article className={`group relative overflow-hidden rounded-[32px] bg-white shadow-floating ${isLarge ? "lg:col-span-2 lg:row-span-2" : ""}`}>
      {cover ? (
        <img src={cover} alt={album.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-surface-low text-center text-on-surface-variant">
          <div className="px-8">
            <Icon name="image" className="mx-auto mb-4 text-outline" size={42} />
            <p className="font-serif text-3xl text-on-surface">No photos yet</p>
            <p className="mt-2 text-sm font-semibold">Add the first photo to set the album cover.</p>
          </div>
        </div>
      )}
      <div className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/35 backdrop-blur-xl">
        <Icon name="more_horiz" />
      </div>
      <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/75 p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="font-serif text-3xl">{album.title}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm font-bold text-on-surface-variant">
              <Icon name="image" />
              Album #{album.id} - {count || 0} Photos
            </p>
          </div>
          <button className="btn-primary !rounded-full !px-5 !py-2" onClick={() => onPreview(album)}>
            Preview
          </button>
        </div>
      </div>
    </article>
  );
}
