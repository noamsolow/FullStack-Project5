import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { api } from "../lib/api.js";
import { avatarImages, travelImages } from "../data/travelImages.js";

export default function Posts() {
  const MAX_IMAGE_RETRIES = 3;
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
  const [liked, setLiked] = useState({});
  const [reshared, setReshared] = useState({});
  const [showComments, setShowComments] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [imageRetryCount, setImageRetryCount] = useState({});
  const [primaryImageFailed, setPrimaryImageFailed] = useState({});
  const [fallbackImageIndex, setFallbackImageIndex] = useState({});
  const [hideImageAfterFailures, setHideImageAfterFailures] = useState({});
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
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user.id]);

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
    setCommentCounts((current) => ({
      ...current,
      [postId]: (current[postId] || 0) + 1
    }));
    setCommentDraft((current) => ({ ...current, [postId]: "" }));
    setShowComments((current) => ({ ...current, [postId]: true }));
  }

  async function toggleReshare(postId) {
    setReshared((current) => ({ ...current, [postId]: !current[postId] }));
    await navigator.clipboard?.copyText(window.location.href);
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

  function getPostImage(post, index) {
    if (Array.isArray(post.images) && post.images.length) {
      return post.images[0];
    }
    return post.image || travelImages[Math.abs(index) % travelImages.length];
  }

  function getImageSrcWithRetry(postId, baseSrc) {
    const retryCount = imageRetryCount[postId] || 0;
    if (!retryCount) return baseSrc;

    const separator = baseSrc.includes("?") ? "&" : "?";
    return `${baseSrc}${separator}retry=${retryCount}`;
  }

  function getFallbackImage(index, fallbackIndex) {
    const offset = Number.isFinite(fallbackIndex) ? fallbackIndex : 0;
    return travelImages[Math.abs(index + offset) % travelImages.length];
  }

  function getResolvedPostImage(post, index) {
    if (hideImageAfterFailures[post.id]) return null;

    const primaryImage = getPostImage(post, index);
    if (primaryImageFailed[post.id]) {
      return getFallbackImage(index, fallbackImageIndex[post.id] || 0);
    }

    return getImageSrcWithRetry(post.id, primaryImage);
  }

  function retryPostImage(postId) {
    setImageRetryCount((current) => {
      const currentRetries = current[postId] || 0;
      if (currentRetries >= MAX_IMAGE_RETRIES) {
        setPrimaryImageFailed((failedCurrent) => ({ ...failedCurrent, [postId]: true }));
        return current;
      }
      return { ...current, [postId]: currentRetries + 1 };
    });
  }

  function handleImageError(postId) {
    if (primaryImageFailed[postId]) {
      setFallbackImageIndex((current) => {
        const nextIndex = (current[postId] || 0) + 1;
        if (nextIndex >= travelImages.length) {
          setHideImageAfterFailures((hiddenCurrent) => ({ ...hiddenCurrent, [postId]: true }));
          return current;
        }
        return { ...current, [postId]: nextIndex };
      });
      return;
    }

    retryPostImage(postId);
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

  if (posts.length === 0) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <EmptyState title="No feed posts yet" body="The feed shows posts from other travelers, not your own posts." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-12">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        {posts.map((post, index) => {
          const author = authors[post.userId];
          const avatar = author?.avatar || avatarImages[index % avatarImages.length];
          const commentCount = commentCounts[post.id] || 0;
          const activeLiked = Boolean(liked[post.id]);
          const activeReshared = Boolean(reshared[post.id]);
          const likeCount = activeLiked ? "1.3k" : "1.2k";
          const reshareCount = activeReshared ? 19 : 18;
          const comments = commentsByPost[post.id] || [];
          const commentsOpen = Boolean(showComments[post.id]);
          const image = getResolvedPostImage(post, index);

          return (
            <div
              key={post.id}
              className={`overflow-hidden rounded-[32px] bg-white shadow-spatial flex flex-col ${
                commentsOpen ? "h-auto" : "h-[24rem]"
              }`}
            >
              {/* Top: Content Grid (2 columns when not expanded) */}
              <div
                className={`grid min-h-0 gap-6 overflow-hidden md:h-[19rem] md:grid-cols-2 ${
                  commentsOpen ? "md:flex-none" : "flex-1"
                }`}
              >
                {/* Left: Content */}
                <div className="flex min-h-0 flex-col overflow-hidden">
                  {/* Author & Content */}
                  <div className="flex flex-col flex-shrink-0 overflow-y-auto p-8 pb-6">
                    {/* Author Header */}
                    <header className="mb-6 flex items-center gap-4">
                      <img src={avatar} alt={author?.name || "Travel author"} className="h-12 w-12 flex-shrink-0 rounded-full border border-outline-variant object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold">{author?.name || "Travel Author"}</h3>
                        <p className="truncate text-xs text-on-surface-variant">{author?.company?.name || "Travel Photojournalist"}</p>
                      </div>
                    </header>

                    {/* Post Content */}
                    <section className="mb-4 flex-shrink-0">
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Explore</p>
                      <h2 className="mb-2 font-serif text-lg font-medium leading-tight line-clamp-2">{post.title}</h2>
                      <p className="text-xs leading-relaxed text-[#263149] line-clamp-3">{post.body}</p>
                    </section>
                  </div>
                </div>

                {/* Right: Image */}
                <div className="hidden h-full min-h-0 overflow-hidden bg-surface-low md:flex">
                  {image ? (
                    <img
                      key={image}
                      src={image}
                      alt={post.title}
                      className="h-full w-full object-cover object-center"
                      onError={(event) => {
                        event.currentTarget.style.visibility = "hidden";
                        handleImageError(post.id);
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-surface-low" />
                  )}
                </div>
              </div>

              {/* Buttons Row - Full width */}
              <div className="border-t border-surface-high px-8 py-3 flex-shrink-0 flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      activeLiked ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => setLiked((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  >
                    <Icon name="heart" size={16} strokeWidth={2} />
                    <span>{likeCount}</span>
                  </button>
                  <button
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      commentsOpen ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => setShowComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  >
                    <Icon name="comment" size={16} strokeWidth={2} />
                    <span>{commentCount}</span>
                  </button>
                  <button
                    className={`inline-flex h-10 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      activeReshared ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => toggleReshare(post.id)}
                    title="Share this post"
                  >
                    <Icon name="share" size={16} strokeWidth={2} />
                    <span>{reshareCount}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section - Full Width When Expanded */}
              {commentsOpen && (
                <section className="border-t border-surface-high flex flex-col gap-2 bg-surface-low p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 flex-shrink-0">
                    <h3 className="font-serif text-xs font-medium">Comments ({commentCount})</h3>
                  </div>

                  <form className="mb-2 flex flex-col gap-1.5 flex-shrink-0" onSubmit={(e) => addComment(e, post.id)}>
                    <input
                      className="field text-xs px-3 py-2"
                      value={commentDraft[post.id] || ""}
                      onChange={(e) => setCommentDraft((current) => ({ ...current, [post.id]: e.target.value }))}
                      placeholder="Add comment..."
                    />
                    <button className="btn-primary text-xs py-1.5">Post</button>
                  </form>

                  {comments.length === 0 ? (
                    <p className="text-xs text-on-surface-variant italic px-1">No comments yet. Be the first!</p>
                  ) : (
                    <ul className="space-y-2 max-h-80 overflow-y-auto pr-2">
                      {comments.map((comment) => {
                        const commentAuthor = getCommentAuthor(comment);
                        return (
                          <li key={comment.id} className="flex gap-2 rounded-lg bg-white p-2">
                            <img
                              src={getCommentAvatar(comment, 0)}
                              alt={commentAuthor?.name || comment.email || "User"}
                              className="h-6 w-6 flex-shrink-0 rounded-full border border-outline-variant object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="truncate text-xs font-bold">{commentAuthor?.name || comment.email}</p>
                                {Number(comment.userId) === Number(user.id) && (
                                  <span className="flex-shrink-0 rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">You</span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs leading-snug text-on-surface-variant break-words">{comment.body}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
