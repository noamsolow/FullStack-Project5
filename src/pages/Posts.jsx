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
  const [expandedPostId, setExpandedPostId] = useState(null);
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

  function handlePostPress(postId) {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    setExpandedPostId((current) => (current === postId ? null : postId));
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
          const isExpandedOnMobile = expandedPostId === post.id;
          const image = getResolvedPostImage(post, index);

          return (
            <div
              key={post.id}
              className={`overflow-hidden rounded-[32px] bg-white shadow-spatial flex flex-col ${
                commentsOpen || isExpandedOnMobile ? "h-auto" : "min-h-[44rem] md:h-[48rem]"
              }`}
              onClick={() => handlePostPress(post.id)}
            >
              {/* Top: Content Grid (2 columns when not expanded) */}
              <div
                className={`grid min-h-0 gap-0 overflow-hidden md:h-[40rem] md:grid-cols-[0.75fr_1.35fr] ${
                  commentsOpen ? "md:flex-none" : "flex-1"
                }`}
              >
                {/* Left: Content */}
                <div className="order-2 flex min-h-0 flex-col overflow-hidden md:order-1">
                  {/* Author & Content */}
                  <div className="flex flex-shrink-0 flex-col overflow-y-auto p-8 pb-7 md:p-12 md:pb-10">
                    {/* Author Header */}
                    <header className="mb-12 flex items-center gap-5">
                      <img src={avatar} alt={author?.name || "Travel author"} className="h-16 w-16 flex-shrink-0 rounded-full border border-outline-variant object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-lg font-bold">{author?.name || "Travel Author"}</h3>
                        <p className="truncate text-base text-on-surface-variant">{author?.company?.name || "Travel Photojournalist"}</p>
                      </div>
                    </header>

                    {/* Post Content */}
                    <section className="mb-4 flex-shrink-0">
                      <p className="mb-5 text-base font-bold uppercase tracking-[0.18em] text-primary">Home</p>
                      <h2 className={`mb-6 font-serif text-4xl font-medium leading-[1.06] md:text-6xl ${isExpandedOnMobile ? "line-clamp-none" : "line-clamp-3"}`}>{post.title}</h2>
                      <p className={`text-xl leading-9 text-[#263149] md:text-2xl md:leading-10 ${isExpandedOnMobile ? "line-clamp-none" : "line-clamp-5"}`}>{post.body}</p>
                    </section>
                  </div>
                </div>

                {/* Right: Image */}
                <div className="order-1 h-96 w-full overflow-hidden bg-surface-low md:order-2 md:h-full md:min-h-0">
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
              <div className="flex flex-shrink-0 items-center justify-between border-t border-surface-high px-8 py-5 md:px-12" onClick={(event) => event.stopPropagation()}>
                <div className="flex flex-wrap items-center gap-4">
                  <button
                    className={`inline-flex h-14 items-center gap-3 rounded-full px-6 py-3 text-base font-bold transition ${
                      activeLiked ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => setLiked((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  >
                    <Icon name="heart" size={25} strokeWidth={2.1} />
                    <span>{likeCount}</span>
                  </button>
                  <button
                    className={`inline-flex h-14 items-center gap-3 rounded-full px-6 py-3 text-base font-bold transition ${
                      commentsOpen ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => setShowComments((current) => ({ ...current, [post.id]: !current[post.id] }))}
                  >
                    <Icon name="comment" size={25} strokeWidth={2.1} />
                    <span>{commentCount}</span>
                  </button>
                  <button
                    className={`inline-flex h-14 items-center gap-3 rounded-full px-6 py-3 text-base font-bold transition ${
                      activeReshared ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
                    }`}
                    onClick={() => toggleReshare(post.id)}
                    title="Share this post"
                  >
                    <Icon name="share" size={25} strokeWidth={2.1} />
                    <span>{reshareCount}</span>
                  </button>
                </div>
              </div>

              {/* Comments Section - Full Width When Expanded */}
              {commentsOpen && (
                <section className="flex flex-col gap-5 border-t border-surface-high bg-surface-low p-6 md:p-10" onClick={(event) => event.stopPropagation()}>
                  <div className="flex flex-shrink-0 items-center justify-between gap-4">
                    <h3 className="font-serif text-3xl font-medium md:text-4xl">Comments ({commentCount})</h3>
                  </div>

                  <form className="flex flex-shrink-0 flex-col gap-3 md:flex-row" onSubmit={(e) => addComment(e, post.id)}>
                    <input
                      className="field px-5 py-4 text-base md:text-lg"
                      value={commentDraft[post.id] || ""}
                      onChange={(e) => setCommentDraft((current) => ({ ...current, [post.id]: e.target.value }))}
                      placeholder="Add comment..."
                    />
                    <button className="btn-primary px-8 py-4 text-base md:text-lg">Post</button>
                  </form>

                  {comments.length === 0 ? (
                    <p className="px-1 text-lg italic text-on-surface-variant">No comments yet. Be the first!</p>
                  ) : (
                    <ul className="max-h-[34rem] space-y-4 overflow-y-auto pr-2">
                      {comments.map((comment) => {
                        const commentAuthor = getCommentAuthor(comment);
                        const commentIdentity = commentAuthor?.username ? `@${commentAuthor.username}` : comment.email;
                        return (
                          <li key={comment.id} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
                            <img
                              src={getCommentAvatar(comment, 0)}
                              alt={commentAuthor?.name || comment.email || "User"}
                              className="h-12 w-12 flex-shrink-0 rounded-full border border-outline-variant object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-base font-bold md:text-lg">{commentAuthor?.name || comment.email}</p>
                                  <p className="truncate text-sm font-semibold text-on-surface-variant md:text-base">{commentIdentity}</p>
                                </div>
                                {Number(comment.userId) === Number(user.id) && (
                                  <span className="flex-shrink-0 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary md:text-sm">You</span>
                                )}
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
            </div>
          );
        })}
      </main>
    </div>
  );
}
