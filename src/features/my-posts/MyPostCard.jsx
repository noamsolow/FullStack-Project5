import Icon from "../../components/ui/Icon.jsx";
import { avatarImages } from "../../data/travelImages.js";
import MyPostComments from "./MyPostComments.jsx";
import { fallbackDate, fallbackTags, getPostImages, inferLocation, normalizePostImages, parseImageList } from "./postUtils.js";

export default function MyPostCard({
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
  const image = getPostImages(post)[0] || "";
  const displayImage = isEditing ? normalizePostImages(parseImageList(editing.imagesText || editing.image))[0] || "" : image;
  const avatar = user.avatar || avatarImages[(Number(user.id) - 1) % avatarImages.length];

  return (
    <article
      className={`group overflow-hidden rounded-[32px] bg-white shadow-spatial ${
        isEditing ? "h-auto" : `${displayImage ? "min-h-[44rem]" : "min-h-[26rem]"} transition hover:-translate-y-1 hover:shadow-floating md:min-h-0`
      }`}
      onClick={() => !isEditing && onOpen(post)}
    >
      <div
        className={`grid min-h-0 gap-0 overflow-hidden ${
          displayImage ? `md:grid-cols-[0.75fr_1.35fr] ${isEditing ? "md:min-h-[40rem]" : "md:h-[40rem]"}` : "md:block"
        }`}
      >
        <div className={`${displayImage ? "order-2 md:order-1" : ""} flex min-h-0 flex-col overflow-hidden`}>
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

        {displayImage && (
          <div className="order-1 h-96 w-full overflow-hidden bg-surface-low md:order-2 md:h-full md:min-h-0">
            <img src={displayImage} alt={post.title} className="h-full w-full object-cover object-center" />
          </div>
        )}
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
                  imagesText: getPostImages(post).join("\n"),
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
        <MyPostComments
          comments={comments}
          commentDraft={commentDraft}
          getCommentAuthor={getCommentAuthor}
          getCommentAvatar={getCommentAvatar}
          onAddComment={onAddComment}
          onCommentDraftChange={onCommentDraftChange}
          onDeleteComment={onDeleteComment}
          post={post}
          user={user}
        />
      )}
    </article>
  );
}
