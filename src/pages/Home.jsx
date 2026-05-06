import { useEffect, useMemo, useState } from "react";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { travelImages } from "../data/travelImages.js";
import { api } from "../lib/api.js";

const initialDraft = {
  title: "",
  body: "",
  location: "",
  date: "",
  image: "",
  tags: ""
};

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [draft, setDraft] = useState(initialDraft);
  const [expanded, setExpanded] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avatar = user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80";

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts?userId=${user.id}`, { cache: false })
      .then((data) => setPosts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

  const sortedPosts = useMemo(() => {
    return [...posts].sort((a, b) => {
      const aTime = Date.parse(a.date || "");
      const bTime = Date.parse(b.date || "");
      if (Number.isFinite(aTime) && Number.isFinite(bTime) && aTime !== bTime) return bTime - aTime;
      return Number(b.id) - Number(a.id);
    });
  }, [posts]);

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handlePhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setSelectedFileName(file.name);
    updateDraft("image", dataUrl);
    setExpanded(true);
  }

  async function publishPost(event) {
    event.preventDefault();
    if (!draft.title.trim()) {
      setExpanded(true);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const created = await api.post("/posts", {
        userId: user.id,
        title: draft.title.trim(),
        body: draft.body.trim() || "A new memory from the road, saved while the details are still fresh.",
        image: draft.image.trim() || travelImages[posts.length % travelImages.length],
        location: draft.location.trim() || user.address?.city || "Travel Log",
        date: draft.date.trim() || formatDate(new Date()),
        tags: parseTags(draft.tags)
      });

      setPosts((current) => [...current, created]);
      setDraft(initialDraft);
      setSelectedFileName("");
      setExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function savePost(post) {
    if (!editing?.title.trim()) return;
    const updated = await api.patch(`/posts/${post.id}`, {
      title: editing.title.trim(),
      body: editing.body.trim(),
      location: editing.location.trim(),
      date: editing.date.trim(),
      image: editing.image.trim(),
      tags: parseTags(editing.tags)
    });
    setPosts((current) => current.map((item) => (item.id === post.id ? updated : item)));
    setEditing(null);
  }

  async function deletePost(id) {
    await api.delete(`/posts/${id}`);
    setPosts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-36 text-[#101727] md:pb-16">
      <main className="mx-auto w-[min(1200px,calc(100%-40px))] md:w-[min(1200px,calc(100%-80px))]">
        <header className="mb-16">
          <h1 className="font-serif text-6xl font-medium leading-tight md:text-7xl">Personal Logs</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-on-surface-variant">Document your journeys, one memory at a time.</p>
        </header>

        <form className="rounded-[32px] bg-white p-6 shadow-spatial md:p-8" onSubmit={publishPost}>
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <img src={avatar} alt={user.name} className="h-16 w-16 shrink-0 rounded-full object-cover" />
            <input
              className="min-h-12 flex-1 border-none bg-transparent p-0 text-xl text-on-surface outline-none placeholder:text-outline focus:ring-0"
              value={draft.title}
              onChange={(event) => updateDraft("title", event.target.value)}
              onFocus={() => setExpanded(true)}
              placeholder="Write a new travel log..."
            />
            <div className="flex gap-3">
              <label className="btn-secondary cursor-pointer">
                <Icon name="image" size={18} />
                Photo
                <input className="sr-only" type="file" accept="image/*" onChange={handlePhotoUpload} />
              </label>
              <button className="btn-primary !rounded-xl !px-7" disabled={submitting}>
                {submitting ? "Publishing..." : "Publish"}
              </button>
            </div>
          </div>

          {expanded && (
            <div className="mt-6 grid gap-4 border-t border-surface-high pt-6 md:grid-cols-[1fr_190px_1fr]">
              <textarea
                className="field min-h-32 md:col-span-3"
                value={draft.body}
                onChange={(event) => updateDraft("body", event.target.value)}
                placeholder="Tell the story..."
              />
              <input className="field" value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="Location" />
              <input className="field" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} placeholder="Date" />
              <input className="field" value={draft.tags} onChange={(event) => updateDraft("tags", event.target.value)} placeholder="Tags, comma separated" />
              <input
                className="field md:col-span-3"
                value={draft.image.startsWith("data:") ? selectedFileName : draft.image}
                onChange={(event) => {
                  setSelectedFileName("");
                  updateDraft("image", event.target.value);
                }}
                placeholder="Image URL or uploaded photo"
              />
            </div>
          )}
        </form>

        {error && <div className="mt-8"><ErrorState message={error} /></div>}

        <section className="mt-10 space-y-8">
          {loading ? (
            <LoadingState label="Loading personal logs..." />
          ) : sortedPosts.length === 0 ? (
            <EmptyState title="No personal logs yet" body="Publish your first travel memory above." />
          ) : (
            sortedPosts.map((post, index) => (
              <LogCard
                key={post.id}
                post={post}
                index={index}
                editing={editing}
                setEditing={setEditing}
                onSave={savePost}
                onDelete={deletePost}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

function LogCard({ post, index, editing, setEditing, onSave, onDelete }) {
  const isEditing = editing?.id === post.id;
  const location = post.location || inferLocation(post.title, index);
  const date = post.date || fallbackDate(index);
  const tags = Array.isArray(post.tags) && post.tags.length ? post.tags : fallbackTags(index);
  const image = post.image || travelImages[index % travelImages.length];

  return (
    <article className="group relative overflow-hidden rounded-[32px] bg-white shadow-spatial md:grid md:min-h-[300px] md:grid-cols-[0.68fr_1fr]">
      <div className="absolute right-6 top-6 z-10 flex gap-2 rounded-full bg-white/85 px-3 py-2 opacity-100 shadow-sm backdrop-blur-md transition md:opacity-0 md:group-hover:opacity-100">
        {isEditing ? (
          <button className="rounded-full px-3 py-1 text-sm font-bold text-primary hover:bg-surface-low" onClick={() => onSave(post)}>
            Save
          </button>
        ) : (
          <button
            className="grid h-8 w-8 place-items-center rounded-full text-outline transition hover:bg-surface-low hover:text-primary"
            onClick={() =>
              setEditing({
                id: post.id,
                title: post.title,
                body: post.body,
                location,
                date,
                image,
                tags: tags.join(", ")
              })
            }
            aria-label="Edit post"
          >
            <Icon name="edit" size={18} />
          </button>
        )}
        <button
          className="grid h-8 w-8 place-items-center rounded-full text-outline transition hover:bg-surface-low hover:text-error"
          onClick={() => onDelete(post.id)}
          aria-label="Delete post"
        >
          <Icon name="delete" size={18} />
        </button>
      </div>

      <div className="relative min-h-[230px] md:min-h-full">
        <img src={isEditing ? editing.image : image} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
      </div>

      <div className="flex flex-col justify-center p-7 md:p-10">
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <input className="field" value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} />
              <input className="field" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
            </div>
            <input className="field" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
            <textarea className="field min-h-28" value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} />
            <input className="field" value={editing.tags} onChange={(event) => setEditing({ ...editing, tags: event.target.value })} />
            <input className="field" value={editing.image} onChange={(event) => setEditing({ ...editing, image: event.target.value })} />
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center gap-3 text-sm font-bold">
              <span className="uppercase tracking-[0.16em] text-secondary">{location}</span>
              <span className="text-outline">•</span>
              <span className="text-outline">{date}</span>
            </div>
            <h2 className="font-serif text-4xl font-medium leading-tight transition group-hover:text-primary md:text-5xl">{post.title}</h2>
            <p className="mt-5 line-clamp-2 text-lg leading-8 text-on-surface-variant">{post.body}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-low px-4 py-2 text-xs font-semibold text-on-surface-variant">
                  {tag}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function fallbackDate(index) {
  return ["Oct 12, 2023", "Sep 28, 2023", "Aug 05, 2023"][index % 3];
}

function fallbackTags(index) {
  return [
    ["Hiking", "Nature"],
    ["Urban", "Food"],
    ["Relaxation", "Coastal"]
  ][index % 3];
}

function inferLocation(title, index) {
  if (/alps|matterhorn|winter/i.test(title)) return "Switzerland";
  if (/shinjuku|kyoto|japan/i.test(title)) return "Japan";
  if (/oia|greece|azure/i.test(title)) return "Greece";
  return ["Switzerland", "Japan", "Greece"][index % 3];
}
