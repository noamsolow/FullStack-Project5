import Icon from "../../components/ui/Icon.jsx";

export default function FeedComments({
  comments,
  commentCount,
  commentDraft,
  getCommentAuthor,
  getCommentAvatar,
  onAddComment,
  onCommentDraftChange,
  post,
  user
}) {
  return (
    <section className="flex flex-col gap-5 border-t border-surface-high bg-surface-low p-6 md:p-10" onClick={(event) => event.stopPropagation()}>
      <div className="flex flex-shrink-0 items-center justify-between gap-4">
        <h3 className="font-serif text-3xl font-medium md:text-4xl">Comments ({commentCount})</h3>
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
        <p className="px-1 text-lg italic text-on-surface-variant">No comments yet. Be the first!</p>
      ) : (
        <ul className="max-h-[34rem] space-y-4 overflow-y-auto pr-2">
          {comments.map((comment, commentIndex) => {
            const commentAuthor = getCommentAuthor(comment);
            const commentIdentity = commentAuthor?.username ? `@${commentAuthor.username}` : comment.email;

            return (
              <li key={comment.id} className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
                <img
                  src={getCommentAvatar(comment, commentIndex)}
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
  );
}
