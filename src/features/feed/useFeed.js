import { useEffect, useState } from "react";
import { avatarImages, travelImages } from "../../data/travelImages.js";
import { api } from "../../lib/api.js";

const MAX_IMAGE_RETRIES = 3;

export function useFeed(user) {
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentCounts, setCommentCounts] = useState({});
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
        const groupedComments = groupCommentsByPost(commentData);

        setPosts(otherPosts);
        setAuthors(Object.fromEntries(userData.map((author) => [author.id, author])));
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

  function toggleComments(postId) {
    setShowComments((current) => ({ ...current, [postId]: !current[postId] }));
  }

  function setPostCommentDraft(postId, value) {
    setCommentDraft((current) => ({ ...current, [postId]: value }));
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

  function getResolvedPostImage(post, index) {
    if (hideImageAfterFailures[post.id]) return null;

    const primaryImage = getPostImage(post, index);
    if (!primaryImage) return null;

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

  function getPostImage(post, index) {
    if (Array.isArray(post.images) && post.images.length) {
      return post.images[0];
    }
    return post.image || null;
  }

  function getImageSrcWithRetry(postId, baseSrc) {
    if (!baseSrc) return null;
    const retryCount = imageRetryCount[postId] || 0;
    if (!retryCount) return baseSrc;

    const separator = baseSrc.includes("?") ? "&" : "?";
    return `${baseSrc}${separator}retry=${retryCount}`;
  }

  function getFallbackImage(index, fallbackIndex) {
    const offset = Number.isFinite(fallbackIndex) ? fallbackIndex : 0;
    return travelImages[Math.abs(index + offset) % travelImages.length];
  }

  return {
    addComment,
    authors,
    commentCounts,
    commentDraft,
    commentsByPost,
    error,
    expandedPostId,
    getCommentAuthor,
    getCommentAvatar,
    getResolvedPostImage,
    handleImageError,
    handlePostPress,
    loading,
    posts,
    setPostCommentDraft,
    showComments,
    toggleComments
  };
}

function groupCommentsByPost(comments) {
  return comments.reduce((acc, comment) => {
    acc[comment.postId] = [...(acc[comment.postId] || []), comment];
    return acc;
  }, {});
}
