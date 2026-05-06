import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/Status.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { avatarImages, travelImages } from "../data/travelImages.js";
import { api } from "../lib/api.js";

const blankPost = { title: "", body: "" };

export default function Posts() {
  const { user } = useAuth();
  const { postId } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState(blankPost);
  const [editingPost, setEditingPost] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [error, setError] = useState("");

  const q = params.get("q") || "";

  useEffect(() => {
    setLoading(true);
    api
      .get(`/posts?userId=${user.id}`, { cache: false })
      .then((data) => {
        setPosts(data);
        if (!postId && data[0]) navigate(`/users/${user.id}/posts/${data[0].id}`, { replace: true });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [navigate, postId, user.id]);

  const selectedPost = useMemo(() => {
    if (!posts.length) return null;
    return posts.find((post) => Number(post.id) === Number(postId)) || posts[0];
  }, [postId, posts]);

  useEffect(() => {
    if (!selectedPost) {
      setComments([]);
      return;
    }
    setCommentsLoading(true);
    api
      .get(`/comments?postId=${selectedPost.id}`, { cache: false })
      .then(setComments)
      .catch((err) => setError(err.message))
      .finally(() => setCommentsLoading(false));
  }, [selectedPost?.id]);

  const visiblePosts = useMemo(() => {
    return posts.filter((post) => !q || String(post.id) === q || post.title.toLowerCase().includes(q.toLowerCase()));
  }, [posts, q]);

  function selectPost(post) {
    const suffix = params.toString() ? `?${params.toString()}` : "";
    navigate(`/users/${user.id}/posts/${post.id}${suffix}`);
  }

  async function addPost(event) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) return;
    const created = await api.post("/posts", {
      userId: user.id,
      title: draft.title.trim(),
      body: draft.body.trim(),
      image: travelImages[posts.length % travelImages.length],
      location: user.address?.city || "Travel Log",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      tags: ["Travel"]
    });
    setPosts((current) => [created, ...current]);
    setDraft(blankPost);
    navigate(`/users/${user.id}/posts/${created.id}`);
  }

  async function savePost() {
    if (!editingPost?.title.trim() || !editingPost?.body.trim()) return;
    const updated = await api.patch(`/posts/${editingPost.id}`, {
      title: editingPost.title.trim(),
      body: editingPost.body.trim()
    });
    setPosts((current) => current.map((post) => (post.id === updated.id ? { ...post, ...updated } : post)));
    setEditingPost(null);
  }

  async function deletePost(id) {
    await api.delete(`/posts/${id}`);
    const nextPosts = posts.filter((post) => post.id !== id);
    setPosts(nextPosts);
    if (Number(selectedPost?.id) === Number(id)) {
      navigate(nextPosts[0] ? `/users/${user.id}/posts/${nextPosts[0].id}` : `/users/${user.id}/posts`);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!commentDraft.trim() || !selectedPost) return;
    const created = await api.post("/comments", {
      postId: selectedPost.id,
      userId: user.id,
      name: `${user.name} comment`,
      email: user.email,
      body: commentDraft.trim()
    });
    setComments((current) => [...current, created]);
    setCommentDraft("");
  }

  async function saveComment(comment) {
    if (!editingComment?.body.trim()) return;
    const updated = await api.patch(`/comments/${comment.id}`, { body: editingComment.body.trim() });
    setComments((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setEditingComment(null);
  }

  async function deleteComment(id) {
    await api.delete(`/comments/${id}`);
    setComments((current) => current.filter((comment) => comment.id !== id));
  }

  if (loading) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading posts..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-14">
      <main className="mx-auto grid w-full max-w-[1400px] gap-8 lg:grid-cols-[390px_1fr]">
        <aside className="space-y-6">
          <section className="card p-6">
            <h1 className="font-serif text-5xl">Posts</h1>
            <p className="mt-3 text-on-surface-variant">Your user-owned posts. Summary cards show only ID and title until selected.</p>
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-bold">Search by id or title</span>
              <input className="field" value={q} onChange={(event) => setParams({ q: event.target.value })} placeholder="Search posts..." />
            </label>
          </section>

          <form className="card p-6" onSubmit={addPost}>
            <h2 className="font-serif text-3xl">Add Post</h2>
            <div className="mt-4 space-y-3">
              <input className="field" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Title" />
              <textarea className="field min-h-28" value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} placeholder="Content" />
            </div>
            <button className="btn-primary mt-4 w-full">
              <Icon name="add" />
              Add Post
            </button>
          </form>

          <section className="card p-4">
            {visiblePosts.length === 0 ? (
              <EmptyState title="No posts found" body="Create a post or change your search." />
            ) : (
              <ul className="space-y-3">
                {visiblePosts.map((post) => (
                  <li key={post.id}>
                    <button
                      className={`w-full rounded-2xl p-4 text-left transition ${
                        Number(selectedPost?.id) === Number(post.id) ? "bg-primary text-white" : "bg-surface-low hover:bg-surface-container"
                      }`}
                      onClick={() => selectPost(post)}
                    >
                      <span className="block text-xs font-bold opacity-70">Post #{post.id}</span>
                      <span className="mt-1 block font-bold">{post.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        <section className="space-y-6">
          {error && <ErrorState message={error} />}
          {!selectedPost ? (
            <EmptyState title="No posts yet" body="Use the form to add your first post." />
          ) : (
            <>
              <article className="grid overflow-hidden rounded-[32px] bg-white shadow-spatial xl:grid-cols-[0.9fr_1fr]">
                <img src={selectedPost.image || travelImages[0]} alt={selectedPost.title} className="h-80 w-full object-cover xl:h-full" />
                <div className="p-8">
                  <div className="mb-8 flex items-center gap-4">
                    <img src={user.avatar || avatarImages[0]} alt={user.name} className="h-14 w-14 rounded-full object-cover" />
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-sm text-on-surface-variant">@{user.username}</p>
                    </div>
                  </div>

                  {editingPost ? (
                    <div className="space-y-4">
                      <input className="field" value={editingPost.title} onChange={(event) => setEditingPost({ ...editingPost, title: event.target.value })} />
                      <textarea className="field min-h-40" value={editingPost.body} onChange={(event) => setEditingPost({ ...editingPost, body: event.target.value })} />
                      <div className="flex gap-2">
                        <button className="btn-primary" type="button" onClick={savePost}>
                          Save
                        </button>
                        <button className="btn-secondary" type="button" onClick={() => setEditingPost(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-serif text-5xl leading-tight">{selectedPost.title}</h2>
                      <p className="mt-6 text-lg leading-8 text-on-surface-variant">{selectedPost.body}</p>
                      <div className="mt-8 flex flex-wrap gap-2 border-t border-surface-high pt-6">
                        <button className="btn-secondary" onClick={() => setEditingPost(selectedPost)}>
                          <Icon name="edit" />
                          Edit Content
                        </button>
                        <button className="btn-secondary hover:!text-error" onClick={() => deletePost(selectedPost.id)}>
                          <Icon name="delete" />
                          Delete
                        </button>
                        <Link className="btn-secondary" to={`/users/${user.id}/posts/${selectedPost.id}`}>
                          <Icon name="link" />
                          Informative URL
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </article>

              <section className="card p-6 md:p-8">
                <h2 className="font-serif text-4xl">Comments</h2>
                <form className="mt-5 flex flex-col gap-3 md:flex-row" onSubmit={addComment}>
                  <input className="field" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Add your comment..." />
                  <button className="btn-primary">
                    <Icon name="chat_bubble" />
                    Add Comment
                  </button>
                </form>

                {commentsLoading ? (
                  <LoadingState label="Loading comments..." />
                ) : comments.length === 0 ? (
                  <EmptyState title="No comments yet" body="Add the first comment for this post." />
                ) : (
                  <ul className="mt-6 space-y-4">
                    {comments.map((comment) => {
                      const isOwner = Number(comment.userId) === Number(user.id);
                      return (
                        <li className="rounded-[24px] bg-surface-low p-5" key={comment.id}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold">{comment.name}</p>
                              <p className="text-sm text-on-surface-variant">{comment.email}</p>
                            </div>
                            {isOwner && (
                              <div className="flex gap-2">
                                <button className="icon-btn" onClick={() => setEditingComment({ id: comment.id, body: comment.body })} aria-label="Edit comment">
                                  <Icon name="edit" />
                                </button>
                                <button className="icon-btn hover:!text-error" onClick={() => deleteComment(comment.id)} aria-label="Delete comment">
                                  <Icon name="delete" />
                                </button>
                              </div>
                            )}
                          </div>
                          {editingComment?.id === comment.id ? (
                            <div className="mt-4 space-y-3">
                              <textarea className="field min-h-24" value={editingComment.body} onChange={(event) => setEditingComment({ ...editingComment, body: event.target.value })} />
                              <button className="btn-primary" onClick={() => saveComment(comment)}>
                                Save Comment
                              </button>
                            </div>
                          ) : (
                            <p className="mt-4 leading-7 text-on-surface-variant">{comment.body}</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
