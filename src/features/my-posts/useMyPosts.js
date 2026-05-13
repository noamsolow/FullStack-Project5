import { useEffect, useMemo, useState } from "react";
import { avatarImages } from "../../data/travelImages.js";
import { api } from "../../lib/api.js";
import { formatDate, normalizePostImages, parseImageList, parseTags, readFileAsDataUrl } from "./postUtils.js";

export const initialPostDraft = {
  title: "",
  body: "",
  location: "",
  date: "",
  image: "",
  images: [],
  tags: ""
};

export function useMyPosts({ user, postId, navigate }) {
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentDraft, setCommentDraft] = useState({});
  const [showComments, setShowComments] = useState({});
  const [draft, setDraft] = useState(initialPostDraft);
  const [expanded, setExpanded] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get(`/posts?userId=${user.id}`, { cache: false }), api.get("/users", { cache: false }), api.get("/comments", { cache: false })])
      .then(([postData, userData, commentData]) => {
        setPosts(postData);
        setAuthors(Object.fromEntries(userData.map((author) => [author.id, author])));
        setCommentsByPost(groupCommentsByPost(commentData));
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
      const images = normalizePostImages([...draft.images, ...parseImageList(draft.image)]);
      const created = await api.post("/posts", {
        userId: user.id,
        title: draft.title.trim(),
        body: draft.body.trim() || "A new memory from the road, saved while the details are still fresh.",
        image: images[0] || "",
        images,
        location: draft.location.trim() || user.address?.city || "Travel Log",
        date: draft.date.trim() || formatDate(new Date()),
        tags: parseTags(draft.tags)
      });

      setPosts((current) => [...current, created]);
      setDraft(initialPostDraft);
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

    const images = normalizePostImages(parseImageList(editing.imagesText || editing.image));
    const updated = await api.patch(`/posts/${post.id}`, {
      title: editing.title.trim(),
      body: editing.body.trim(),
      location: editing.location.trim(),
      date: editing.date.trim(),
      image: images[0] || "",
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

  function setPostCommentDraft(postId, value) {
    setCommentDraft((current) => ({ ...current, [postId]: value }));
  }

  function toggleComments(postId) {
    setShowComments((current) => ({ ...current, [postId]: !current[postId] }));
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

  return {
    addComment,
    commentDraft,
    commentsByPost,
    deleteComment,
    deletePost,
    draft,
    editing,
    error,
    expanded,
    getCommentAuthor,
    getCommentAvatar,
    goToPost,
    handlePhotoUpload,
    loading,
    openPost,
    publishPost,
    savePost,
    selectedFileName,
    selectedIndex,
    selectedPost,
    setDraft,
    setEditing,
    setExpanded,
    setPostCommentDraft,
    showComments,
    sortedPosts,
    submitting,
    toggleComments,
    updateDraft
  };
}

function groupCommentsByPost(comments) {
  return comments.reduce((acc, comment) => {
    acc[comment.postId] = [...(acc[comment.postId] || []), comment];
    return acc;
  }, {});
}
