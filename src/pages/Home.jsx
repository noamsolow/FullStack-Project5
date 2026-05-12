import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { avatarImages, travelImages } from "../data/travelImages.js";
import { api } from "../lib/api.js";

const initialDraft = {
  title: "",
  body: "",
  location: "",
  date: "",
  image: "",
  images: [],
  tags: ""
};

export default function Home() {
  const { user } = useAuth();
  const { postId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [showComments, setShowComments] = useState({});
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
    Promise.all([api.get(`/posts?userId=${user.id}`, { cache: false }), api.get("/users", { cache: false }), api.get("/comments", { cache: false })])
      .then(([postData, userData, commentData]) => {
        setPosts(postData);
        setAuthors(Object.fromEntries(userData.map((author) => [author.id, author])));
        setCommentsByPost(
          commentData.reduce((acc, comment) => {
            acc[comment.postId] = [...(acc[comment.postId] || []), comment];
            return acc;
          }, {})
        );
      })
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

  const selectedIndex = useMemo(() => {
    if (!postId || !sortedPosts.length) return -1;
    return sortedPosts.findIndex((post) => Number(post.id) === Number(postId));
  }, [postId, sortedPosts]);

  const selectedPost = selectedIndex >= 0 ? sortedPosts[selectedIndex] : null;

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handlePhotoUpload(event) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
    setSelectedFileName(files.map((file) => file.name).join(", "));
    setDraft((current) => ({ ...current, images: dataUrls }));
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
      const images = normalizePostImages([...draft.images, ...parseImageList(draft.image)], posts.length);
      const created = await api.post("/posts", {
        userId: user.id,
        title: draft.title.trim(),
        body: draft.body.trim() || "A new memory from the road, saved while the details are still fresh.",
        image: images[0],
        images,
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
    const images = normalizePostImages(parseImageList(editing.imagesText || editing.image), posts.findIndex((item) => item.id === post.id));
    const updated = await api.patch(`/posts/${post.id}`, {
      title: editing.title.trim(),
      body: editing.body.trim(),
      location: editing.location.trim(),
      date: editing.date.trim(),
      image: images[0],
      images,
      tags: parseTags(editing.tags)
    });
    setPosts((current) => current.map((item) => (item.id === post.id ? updated : item)));
    setEditing(null);
  }

  async function deletePost(id) {
    await api.delete(`/posts/${id}`);
    setPosts((current) => current.filter((item) => item.id !== id));
    if (Number(postId) === Number(id)) {
      navigate(`/users/${user.id}/posts`, { replace: true });
    }
  }

  function openPost(post) {
    navigate(`/users/${user.id}/posts/${post.id}`);
  }

  function goToPost(index) {
    if (!sortedPosts.length) return;
    const post = sortedPosts[(index + sortedPosts.length) % sortedPosts.length];
    navigate(`/users/${user.id}/posts/${post.id}`);
  }

  async function addComment(event, postId) {
    event.preventDefault();
    if (!commentDraft[postId]?.trim()) return;

    const created = await api.post("/comments", {
      postId,
      userId: user.id,
      name: `${user.name} comment`,
      email: user.email,
      body: commentDraft[postId].trim()
    });

    setCommentsByPost((current) => ({
      ...current,
      [postId]: [...(current[postId] || []), created]
    }));
    setCommentDraft((current) => ({ ...current, [postId]: "" }));
    setShowComments((current) => ({ ...current, [postId]: true }));
  }

  async function deleteComment(comment) {
    if (Number(comment.userId) !== Number(user.id)) return;
    await api.delete(`/comments/${comment.id}`);
    setCommentsByPost((current) => ({
      ...current,
      [comment.postId]: (current[comment.postId] || []).filter((item) => Number(item.id) !== Number(comment.id))
    }));
  }

  function getCommentAuthor(comment) {
    if (Number(comment.userId) === Number(user.id)) return user;
    return authors[comment.userId];
  }

  function getCommentAvatar(comment, index) {
    const commentAuthor = getCommentAuthor(comment);
    const fallbackIndex = Number.isFinite(Number(comment.userId)) ? Number(comment.userId) - 1 : index;
    return commentAuthor?.avatar || avatarImages[Math.abs(fallbackIndex) % avatarImages.length];
  }

  if (loading) {
    return (
      <div className="mx-auto w-[min(1200px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading personal logs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-[min(1200px,calc(100%-40px))] pt-36">
        <ErrorState message={error} />
      </div>
    );
  }

  if (postId && selectedIndex === -1) {
    return <Navigate to={`/users/${user.id}/posts`} replace />;
  }

  if (selectedPost) {
    return (
      <JournalDisplay
        post={selectedPost}
        index={selectedIndex}
        user={user}
        editing={editing}
        setEditing={setEditing}
        onSave={savePost}
        onDelete={deletePost}
        onBack={() => navigate(`/users/${user.id}/posts`)}
        onNext={() => goToPost(selectedIndex + 1)}
        onPrevious={() => goToPost(selectedIndex - 1)}
        hasMultiple={sortedPosts.length > 1}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-36 text-[#101727] md:pb-16">
      <main className="mx-auto w-[min(1400px,calc(100%-40px))] md:w-[min(1400px,calc(100%-80px))]">
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
                Photos
                <input className="sr-only" type="file" accept="image/*" multiple onChange={handlePhotoUpload} />
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
              <textarea
                className="field min-h-24 md:col-span-3"
                value={draft.images.length ? selectedFileName : draft.image}
                onChange={(event) => {
                  setSelectedFileName("");
                  setDraft((current) => ({ ...current, image: event.target.value, images: [] }));
                }}
                placeholder="Image URLs separated by commas or new lines, or upload photos"
              />
              {draft.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto md:col-span-3">
                  {draft.images.map((image) => (
                    <img key={image} src={image} alt="Uploaded preview" className="h-20 w-28 rounded-2xl object-cover" />
                  ))}
                </div>
              )}
            </div>
          )}
        </form>

        {error && <div className="mt-8"><ErrorState message={error} /></div>}

        <section className="mt-10 space-y-8">
          {sortedPosts.length === 0 ? (
            <EmptyState title="No personal logs yet" body="Publish your first travel memory above." />
          ) : (
            sortedPosts.map((post, index) => (
              <LogCard
                key={post.id}
                post={post}
                index={index}
                editing={editing}
                setEditing={setEditing}
                user={user}
                comments={commentsByPost[post.id] || []}
                commentsOpen={Boolean(showComments[post.id])}
                commentDraft={commentDraft[post.id] || ""}
                onToggleComments={() => setShowComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                onCommentDraftChange={(value) => setCommentDraft((current) => ({ ...current, [post.id]: value }))}
                onAddComment={addComment}
                onDeleteComment={deleteComment}
                getCommentAuthor={getCommentAuthor}
                getCommentAvatar={getCommentAvatar}
                onSave={savePost}
                onDelete={deletePost}
                onOpen={openPost}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

function JournalDisplay({ post, index, user, editing, setEditing, onSave, onDelete, onBack, onNext, onPrevious, hasMultiple }) {
  const isEditing = editing?.id === post.id;
  const [photoIndex, setPhotoIndex] = useState(0);
  const location = post.location || inferLocation(post.title, index);
  const date = post.date || fallbackDate(index);
  const tags = Array.isArray(post.tags) && post.tags.length ? post.tags : fallbackTags(index);
  const postImages = getPostImages(post, index);
  const editingImages = isEditing ? normalizePostImages(parseImageList(editing.imagesText || editing.image), index) : postImages;
  const displayImages = isEditing ? editingImages : postImages;
  const image = displayImages[photoIndex % displayImages.length];
  const avatar = user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80";

  useEffect(() => {
    setPhotoIndex(0);
  }, [post.id]);

  function goToPhoto(nextIndex) {
    setPhotoIndex((nextIndex + displayImages.length) % displayImages.length);
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-12">
      <main className="mx-auto grid min-h-[760px] w-full max-w-[1400px] gap-8 md:grid-cols-[1.05fr_1fr]">
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
                    imagesText: getPostImages(post, index).join("\n"),
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

function LogCard({
  post,
  index,
  editing,
  setEditing,
  user,
  comments,
  commentsOpen,
  commentDraft,
  onToggleComments,
  onCommentDraftChange,
  onAddComment,
  onDeleteComment,
  getCommentAuthor,
  getCommentAvatar,
  onSave,
  onDelete,
  onOpen
}) {
  const isEditing = editing?.id === post.id;
  const location = post.location || inferLocation(post.title, index);
  const date = post.date || fallbackDate(index);
  const tags = Array.isArray(post.tags) && post.tags.length ? post.tags : fallbackTags(index);
  const image = getPostImages(post, index)[0];
  const displayImage = isEditing ? normalizePostImages(parseImageList(editing.imagesText || editing.image), index)[0] : image;
  const avatar = user.avatar || avatarImages[(Number(user.id) - 1) % avatarImages.length];

  return (
    <article
      className={`group overflow-hidden rounded-[32px] bg-white shadow-spatial ${
        isEditing ? "h-auto" : "min-h-[44rem] transition hover:-translate-y-1 hover:shadow-floating md:min-h-0"
      }`}
      onClick={() => !isEditing && onOpen(post)}
    >
      <div className={`grid min-h-0 gap-0 overflow-hidden md:grid-cols-[0.75fr_1.35fr] ${isEditing ? "md:min-h-[40rem]" : "md:h-[40rem]"}`}>
        <div className="order-2 flex min-h-0 flex-col overflow-hidden md:order-1">
          <div className="flex flex-shrink-0 flex-col overflow-y-auto p-8 pb-7 md:p-12 md:pb-10">
            <header className="mb-12 flex items-center gap-5">
              <img src={avatar} alt={user.name} className="h-16 w-16 flex-shrink-0 rounded-full border border-outline-variant object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{user.name}</h3>
                <p className="truncate text-base text-on-surface-variant">@{user.username}</p>
              </div>
            </header>

            {isEditing ? (
              <div className="space-y-4" onClick={(event) => event.stopPropagation()}>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="field text-base md:text-lg" value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} />
                  <input className="field text-base md:text-lg" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
                </div>
                <input className="field text-base md:text-lg" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
                <textarea className="field min-h-40 text-base md:text-lg" value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} />
                <input className="field text-base md:text-lg" value={editing.tags} onChange={(event) => setEditing({ ...editing, tags: event.target.value })} />
                <textarea
                  className="field min-h-28 text-base md:text-lg"
                  value={editing.imagesText}
                  onChange={(event) => setEditing({ ...editing, imagesText: event.target.value })}
                  placeholder="Image URLs separated by commas or new lines"
                />
              </div>
            ) : (
              <section>
                <div className="mb-5 flex flex-wrap items-center gap-3 text-base font-bold">
                  <span className="uppercase tracking-[0.16em] text-secondary">{location}</span>
                  <span className="text-outline">•</span>
                  <span className="text-outline">{date}</span>
                </div>
                <p className="mb-5 text-base font-bold uppercase tracking-[0.18em] text-primary">Journal</p>
                <h2 className="mb-6 font-serif text-4xl font-medium leading-[1.06] transition group-hover:text-primary md:text-6xl">{post.title}</h2>
                <p className="line-clamp-5 text-xl leading-9 text-[#263149] md:text-2xl md:leading-10">{post.body}</p>
                <div className="mt-8 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-low px-4 py-2 text-sm font-semibold text-on-surface-variant">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        <div className="order-1 h-96 w-full overflow-hidden bg-surface-low md:order-2 md:h-full md:min-h-0">
          <img src={displayImage} alt={post.title} className="h-full w-full object-cover object-center" />
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-surface-high px-8 py-5 md:px-12" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-4">
          {isEditing ? (
            <>
              <button className="btn-primary h-14 rounded-full px-6 py-3 text-base" onClick={() => onSave(post)}>
                Save
              </button>
              <button className="btn-secondary h-14 rounded-full px-6 py-3 text-base" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </>
          ) : (
            <button
              className="inline-flex h-14 items-center gap-3 rounded-full bg-surface-low px-6 py-3 text-base font-bold text-on-surface transition hover:bg-surface-container"
              onClick={() =>
                setEditing({
                  id: post.id,
                  title: post.title,
                  body: post.body,
                  location,
                  date,
                  image,
                  imagesText: getPostImages(post, index).join("\n"),
                  tags: tags.join(", ")
                })
              }
            >
              <Icon name="edit" size={25} strokeWidth={2.1} />
              Edit
            </button>
          )}
          <button className="inline-flex h-14 items-center gap-3 rounded-full bg-surface-low px-6 py-3 text-base font-bold text-on-surface transition hover:bg-surface-container hover:text-error" onClick={() => onDelete(post.id)}>
            <Icon name="delete" size={25} strokeWidth={2.1} />
            Delete
          </button>
          <button
            className={`inline-flex h-14 items-center gap-3 rounded-full px-6 py-3 text-base font-bold transition ${
              commentsOpen ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
            }`}
            onClick={onToggleComments}
          >
            <Icon name="comment" size={25} strokeWidth={2.1} />
            {comments.length}
          </button>
          <button className="inline-flex h-14 items-center gap-3 rounded-full bg-surface-low px-6 py-3 text-base font-bold text-on-surface transition hover:bg-surface-container" onClick={() => onOpen(post)}>
            <Icon name="article" size={25} strokeWidth={2.1} />
            Open
          </button>
        </div>
        <div className="hidden text-base font-bold text-on-surface-variant md:block">{comments.length} comments</div>
      </div>

      {commentsOpen && (
        <section className="flex flex-col gap-5 border-t border-surface-high bg-surface-low p-6 md:p-10" onClick={(event) => event.stopPropagation()}>
          <div className="flex flex-shrink-0 items-center justify-between gap-4">
            <h3 className="font-serif text-3xl font-medium md:text-4xl">Comments ({comments.length})</h3>
          </div>

          <form className="flex flex-shrink-0 flex-col gap-3 md:flex-row" onSubmit={(event) => onAddComment(event, post.id)}>
            <input
              className="field px-5 py-4 text-base md:text-lg"
              value={commentDraft}
              onChange={(event) => onCommentDraftChange(event.target.value)}
              placeholder="Add comment..."
            />
            <button className="btn-primary px-8 py-4 text-base md:text-lg">Post</button>
          </form>

          {comments.length === 0 ? (
            <p className="px-1 text-lg italic text-on-surface-variant">No comments yet. Be the first.</p>
          ) : (
            <ul className="max-h-[34rem] space-y-4 overflow-y-auto pr-2">
              {comments.map((comment, commentIndex) => {
                const commentAuthor = getCommentAuthor(comment);
                const commentIdentity = commentAuthor?.username ? `@${commentAuthor.username}` : comment.email;
                const canDelete = Number(comment.userId) === Number(user.id);
                return (
                  <li key={comment.id} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
                    <img
                      src={getCommentAvatar(comment, commentIndex)}
                      alt={commentAuthor?.name || comment.email || "Comment author"}
                      className="h-12 w-12 flex-shrink-0 rounded-full border border-outline-variant object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-bold md:text-lg">{commentAuthor?.name || comment.email}</p>
                          <p className="truncate text-sm font-semibold text-on-surface-variant md:text-base">{commentIdentity}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {canDelete && <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary md:text-sm">You</span>}
                          {canDelete && (
                            <button
                              className="grid h-10 w-10 place-items-center rounded-full bg-surface-low text-on-surface-variant transition hover:bg-surface-container hover:text-error"
                              onClick={() => onDeleteComment(comment)}
                              aria-label="Delete comment"
                            >
                              <Icon name="delete" size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 break-words text-base leading-7 text-on-surface-variant md:text-lg md:leading-8">{comment.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </article>
  );
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function parseImageList(value = "") {
  const text = String(value).trim();
  if (!text) return [];
  const parts = text.includes("data:image") ? text.split(/\n+/) : text.split(/[\n,]+/);
  const normalizedParts = text.includes("data:image")
    ? parts
    : text.replace(/(https?:\/\/)/g, "\n$1").split(/[\n,]+/);
  return normalizedParts.map((image) => image.trim()).filter(Boolean);
}

function normalizePostImages(images, fallbackIndex) {
  const uniqueImages = [];
  images.forEach((image) => {
    if (typeof image !== "string") return;
    const value = image.trim();
    if (value && !uniqueImages.includes(value)) {
      uniqueImages.push(value);
    }
  });
  return uniqueImages.length ? uniqueImages : [travelImages[Math.abs(fallbackIndex) % travelImages.length]];
}

function getPostImages(post, index) {
  if (Array.isArray(post.images) && post.images.length) {
    return normalizePostImages(post.images, index);
  }
  return normalizePostImages([post.image], index);
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
