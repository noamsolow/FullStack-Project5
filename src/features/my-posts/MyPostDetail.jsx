import { useEffect, useState } from "react";
import Icon from "../../components/ui/Icon.jsx";
import {
  fallbackDate,
  fallbackTags,
  getPostImages,
  inferLocation,
  normalizePostImages,
  parseImageList
} from "./postUtils.js";

export default function MyPostDetail({ post, index, user, editing, setEditing, onSave, onDelete, onBack, onNext, onPrevious, hasMultiple }) {
  const isEditing = editing?.id === post.id;
  const [photoIndex, setPhotoIndex] = useState(0);
  const location = post.location || inferLocation(post.title, index);
  const date = post.date || fallbackDate(index);
  const tags = Array.isArray(post.tags) && post.tags.length ? post.tags : fallbackTags(index);
  const postImages = getPostImages(post);
  const editingImages = isEditing ? normalizePostImages(parseImageList(editing.imagesText || editing.image)) : postImages;
  const displayImages = isEditing ? editingImages : postImages;
  const hasImages = displayImages.length > 0;
  const image = hasImages ? displayImages[photoIndex % displayImages.length] : "";
  const avatar = user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80";

  useEffect(() => {
    setPhotoIndex(0);
  }, [post.id]);

  function goToPhoto(nextIndex) {
    if (!displayImages.length) return;
    setPhotoIndex((nextIndex + displayImages.length) % displayImages.length);
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-12">
      <main className={`mx-auto grid min-h-[760px] w-full max-w-[1400px] gap-8 ${hasImages ? "md:grid-cols-[1.05fr_1fr]" : "md:max-w-[900px]"}`}>
        {hasImages && (
          <section className="group relative min-h-[520px] overflow-hidden rounded-[32px] shadow-floating md:min-h-[760px]">
            <img src={image} alt={post.title} className="h-full w-full object-cover" />

            {displayImages.length > 1 && (
              <>
                <button
                  className="absolute left-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/30 text-white backdrop-blur-md transition hover:bg-white/50"
                  onClick={() => goToPhoto(photoIndex - 1)}
                  aria-label="Previous photo"
                >
                  <Icon name="chevron_left" />
                </button>
                <button
                  className="absolute right-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/30 text-white backdrop-blur-md transition hover:bg-white/50"
                  onClick={() => goToPhoto(photoIndex + 1)}
                  aria-label="Next photo"
                >
                  <Icon name="chevron_right" />
                </button>
              </>
            )}

            {displayImages.length > 1 && (
              <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
                {displayImages.map((photo, photoIndexValue) => (
                  <button
                    key={`${photo}-${photoIndexValue}`}
                    className={`h-2 rounded-full transition ${photoIndexValue === photoIndex ? "w-8 bg-white" : "w-2 bg-white/55"}`}
                    onClick={() => goToPhoto(photoIndexValue)}
                    aria-label={`Open photo ${photoIndexValue + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <article className="flex min-h-[520px] flex-col overflow-hidden rounded-[32px] bg-white p-8 shadow-spatial md:min-h-[760px] md:max-h-[760px] md:p-10">
          <header className="mb-12 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <img src={avatar} alt={user.name} className="h-14 w-14 rounded-full border border-outline-variant object-cover" />
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold">{user.name}</h2>
                <p className="truncate text-[15px] text-on-surface-variant">@{user.username}</p>
              </div>
            </div>
            <button className="btn-secondary shrink-0" onClick={onBack}>
              <Icon name="arrow_back" size={18} />
              Back
            </button>
          </header>

          {isEditing ? (
            <section className="flex-1 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input className="field" value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} />
                <input className="field" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
              </div>
              <input className="field" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
              <textarea className="field min-h-48" value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} />
              <input className="field" value={editing.tags} onChange={(event) => setEditing({ ...editing, tags: event.target.value })} />
              <textarea
                className="field min-h-28"
                value={editing.imagesText}
                onChange={(event) => setEditing({ ...editing, imagesText: event.target.value })}
                placeholder="Image URLs separated by commas or new lines"
              />
            </section>
          ) : (
            <section className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-primary">Journal</p>
              <h1 className="max-w-[640px] break-words font-serif text-5xl font-medium leading-[1.12] md:text-6xl">{post.title}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-bold">
                <span className="uppercase tracking-[0.16em] text-secondary">{location}</span>
                <span className="text-outline">•</span>
                <span className="text-outline">{date}</span>
              </div>
              <div className="mt-8 max-w-[680px] space-y-5 text-[20px] leading-[1.65] text-[#263149]">
                {post.body
                  .split(". ")
                  .filter(Boolean)
                  .reduce((paragraphs, sentence, paragraphIndex) => {
                    const target = Math.floor(paragraphIndex / 2);
                    paragraphs[target] = `${paragraphs[target] || ""}${paragraphs[target] ? ". " : ""}${sentence}`;
                    return paragraphs;
                  }, [])
                  .map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph.endsWith(".") ? paragraph : `${paragraph}.`}</p>
                  ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-surface-low px-4 py-2 text-xs font-semibold text-on-surface-variant">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          <footer className="mt-10 flex flex-wrap items-center gap-3 border-t border-surface-high pt-8">
            {isEditing ? (
              <>
                <button className="btn-primary" onClick={() => onSave(post)}>
                  Save
                </button>
                <button className="btn-secondary" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="btn-secondary"
                onClick={() =>
                  setEditing({
                    id: post.id,
                    title: post.title,
                    body: post.body,
                    location,
                    date,
                    image,
                    imagesText: getPostImages(post).join("\n"),
                    tags: tags.join(", ")
                  })
                }
              >
                <Icon name="edit" size={18} />
                Edit
              </button>
            )}
            <button className="btn-secondary hover:!text-error" onClick={() => onDelete(post.id)}>
              <Icon name="delete" size={18} />
              Delete
            </button>
          </footer>
        </article>
      </main>

      {hasMultiple && !isEditing && (
        <div className="mt-10 hidden justify-center md:flex">
          <button className="text-outline-variant transition hover:text-primary" onClick={onNext} aria-label="Next journal post">
            <Icon name="chevron_right" className="rotate-90" size={34} />
          </button>
        </div>
      )}
    </div>
  );
}
