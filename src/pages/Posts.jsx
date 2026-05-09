import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { api } from "../lib/api.js";
import { avatarImages, travelImages } from "../data/travelImages.js";

export default function Posts() {
  const { user } = useAuth();
  const { postId } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [liked, setLiked] = useState({});
  const [reshared, setReshared] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get("/posts", { cache: false }), api.get("/users", { cache: false }), api.get("/comments", { cache: false })])
      .then(([postData, userData, commentData]) => {
        const otherPosts = postData.filter((post) => Number(post.userId) !== Number(user.id));
        setPosts(otherPosts);
        setAuthors(Object.fromEntries(userData.map((author) => [author.id, author])));
        const groupedComments = commentData.reduce((acc, comment) => {
          acc[comment.postId] = [...(acc[comment.postId] || []), comment];
          return acc;
        }, {});
        setCommentsByPost(groupedComments);
        setCommentCounts(Object.fromEntries(Object.entries(groupedComments).map(([id, comments]) => [id, comments.length])));
        if (!postId && otherPosts[0]) {
          navigate(`/users/${user.id}/posts/${otherPosts[0].id}`, { replace: true });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate, postId, user.id]);

  const selectedIndex = useMemo(() => {
    if (!posts.length) return -1;
    const index = posts.findIndex((post) => Number(post.id) === Number(postId));
    return index >= 0 ? index : 0;
  }, [postId, posts]);

  const selectedPost = selectedIndex >= 0 ? posts[selectedIndex] : null;
  const author = selectedPost ? authors[selectedPost.userId] : null;

  useEffect(() => {
    setPhotoIndex(0);
    setShowComments(false);
    setCommentDraft("");
  }, [selectedPost?.id]);

  if (!loading && posts.length > 0 && postId && !posts.some((post) => Number(post.id) === Number(postId))) {
    return <Navigate to={`/users/${user.id}/posts/${posts[0].id}`} replace />;
  }

  function goToIndex(index) {
    const post = posts[(index + posts.length) % posts.length];
    navigate(`/users/${user.id}/posts/${post.id}`);
  }

  if (loading) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading feed..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <ErrorState message={error} />
      </div>
    );
  }

  if (!selectedPost) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <EmptyState title="No feed posts yet" body="The feed shows posts from other travelers, not your own posts." />
      </div>
    );
  }

  const commentCount = commentCounts[selectedPost.id] || 0;
  const activeLiked = Boolean(liked[selectedPost.id]);
  const activeReshared = Boolean(reshared[selectedPost.id]);
  const likeCount = activeLiked ? "1.3k" : "1.2k";
  const reshareCount = activeReshared ? 19 : 18;
  const comments = commentsByPost[selectedPost.id] || [];
  const postPhotos = [
    selectedPost.image || travelImages[selectedIndex % travelImages.length],
    travelImages[(selectedIndex + 1) % travelImages.length],
    travelImages[(selectedIndex + 4) % travelImages.length]
  ];
  const image = postPhotos[photoIndex];
  const avatar = author?.avatar || avatarImages[selectedIndex % avatarImages.length];

  function goToPhoto(index) {
    setPhotoIndex((index + postPhotos.length) % postPhotos.length);
  }

  async function addComment(event) {
    event.preventDefault();
    if (!commentDraft.trim()) return;

    const created = await api.post("/comments", {
      postId: selectedPost.id,
      userId: user.id,
      name: `${user.name} comment`,
      email: user.email,
      body: commentDraft.trim()
    });

    setCommentsByPost((current) => ({
      ...current,
      [selectedPost.id]: [...(current[selectedPost.id] || []), created]
    }));
    setCommentCounts((current) => ({
      ...current,
      [selectedPost.id]: (current[selectedPost.id] || 0) + 1
    }));
    setCommentDraft("");
    setShowComments(true);
  }

  async function toggleReshare() {
    setReshared((current) => ({ ...current, [selectedPost.id]: !current[selectedPost.id] }));
    await navigator.clipboard?.writeText(window.location.href);
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

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-12">
      <main className="mx-auto grid min-h-[760px] w-full max-w-[1400px] gap-8 md:grid-cols-[1.05fr_1fr]">
        <section className="group relative min-h-[520px] overflow-hidden rounded-[32px] shadow-floating md:min-h-[760px]">
          <img src={image} alt={selectedPost.title} className="h-full w-full object-cover" />

          {postPhotos.length > 1 && (
            <>
              <button
                className="absolute left-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/30 text-white opacity-100 backdrop-blur-md transition hover:bg-white/50 md:opacity-0 md:group-hover:opacity-100"
                onClick={() => goToPhoto(photoIndex - 1)}
                aria-label="Previous photo"
              >
                <Icon name="chevron_left" />
              </button>
              <button
                className="absolute right-5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/30 text-white opacity-100 backdrop-blur-md transition hover:bg-white/50 md:opacity-0 md:group-hover:opacity-100"
                onClick={() => goToPhoto(photoIndex + 1)}
                aria-label="Next photo"
              >
                <Icon name="chevron_right" />
              </button>
            </>
          )}

          <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 gap-2">
            {postPhotos.map((photo, index) => (
              <button
                key={`${selectedPost.id}-${photo}-${index}`}
                className={`h-2 rounded-full transition ${index === photoIndex ? "w-7 bg-white" : "w-2 bg-white/55"}`}
                onClick={() => goToPhoto(index)}
                aria-label={`Open photo ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <article className="flex min-h-[520px] flex-col rounded-[32px] bg-white p-8 shadow-spatial md:min-h-[760px] md:p-10">
          <header className="mb-12 flex items-center gap-4">
            <img src={avatar} alt={author?.name || "Travel author"} className="h-14 w-14 rounded-full border border-outline-variant object-cover" />
            <div>
              <h2 className="text-base font-bold">{author?.name || "Travel Author"}</h2>
              <p className="text-[15px] text-on-surface-variant">{author?.company?.name || "Travel Photojournalist"}</p>
            </div>
          </header>

          <section className="flex-1">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-primary">Explore</p>
            <h1 className="max-w-[640px] font-serif text-5xl font-medium leading-[1.12] tracking-[-0.01em] md:text-6xl">{selectedPost.title}</h1>
            <div className="mt-8 max-w-[680px] space-y-5 text-[20px] leading-[1.65] text-[#263149]">
              {selectedPost.body
                .split(". ")
                .filter(Boolean)
                .reduce((paragraphs, sentence, index) => {
                  const target = Math.floor(index / 2);
                  paragraphs[target] = `${paragraphs[target] || ""}${paragraphs[target] ? ". " : ""}${sentence}`;
                  return paragraphs;
                }, [])
                .map((paragraph, index) => (
                  <p key={index}>{paragraph.endsWith(".") ? paragraph : `${paragraph}.`}</p>
                ))}
            </div>
          </section>

          <footer className="mt-10 flex flex-wrap items-center gap-4 border-t border-surface-high pt-8">
            <button
              className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-bold transition ${
                activeLiked ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
              }`}
              onClick={() => setLiked((current) => ({ ...current, [selectedPost.id]: !current[selectedPost.id] }))}
            >
              <Icon name="heart" size={25} strokeWidth={2.1} />
              {likeCount}
            </button>
            <button
              className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-bold transition ${
                showComments ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
              }`}
              onClick={() => setShowComments((current) => !current)}
            >
              <Icon name="comment" size={25} strokeWidth={2.1} />
              {commentCount}
            </button>
            <button
              className={`inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-bold transition md:ml-2 ${
                activeReshared ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
              }`}
              onClick={toggleReshare}
            >
              <Icon name="share" size={25} strokeWidth={2.1} />
              {reshareCount}
            </button>
          </footer>

          {showComments && (
            <section className="mt-6 rounded-[28px] bg-surface-low p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="font-serif text-3xl">Comments</h2>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-on-surface-variant">{commentCount}</span>
              </div>

              <form className="mb-5 flex flex-col gap-3 md:flex-row" onSubmit={addComment}>
                <input
                  className="field"
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Write a comment..."
                />
                <button className="btn-primary whitespace-nowrap">Post</button>
              </form>

              {comments.length === 0 ? (
                <p className="rounded-2xl bg-white p-4 text-sm font-semibold text-on-surface-variant">No comments yet. Start the conversation.</p>
              ) : (
                <ul className="max-h-60 space-y-3 overflow-y-auto pr-1">
                  {comments.map((comment, index) => {
                    const commentAuthor = getCommentAuthor(comment);

                    return (
                      <li key={comment.id} className="rounded-2xl bg-white p-4">
                        <div className="mb-3 flex items-start gap-3">
                          <img
                            src={getCommentAvatar(comment, index)}
                            alt={commentAuthor?.name || comment.email || "Comment author"}
                            className="h-10 w-10 shrink-0 rounded-full border border-outline-variant object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold">{commentAuthor?.name || comment.email}</p>
                                <p className="truncate text-xs font-semibold text-on-surface-variant">{comment.email}</p>
                              </div>
                              {Number(comment.userId) === Number(user.id) && (
                                <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-xs font-bold text-primary">You</span>
                              )}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-on-surface-variant">{comment.body}</p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </article>
      </main>

      {posts.length > 1 && (
        <div className="mt-10 hidden justify-center md:flex">
          <button className="text-outline-variant transition hover:text-primary" onClick={() => goToIndex(selectedIndex + 1)} aria-label="Next feed item">
            <Icon name="chevron_right" className="rotate-90" size={34} />
          </button>
        </div>
      )}
    </div>
  );
}
