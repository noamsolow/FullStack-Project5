import Icon from "../../components/ui/Icon.jsx";
import { avatarImages } from "../../data/travelImages.js";
import FeedComments from "./FeedComments.jsx";

export default function FeedPostCard({
  author,
  commentCount,
  commentDraft,
  comments,
  commentsOpen,
  getCommentAuthor,
  getCommentAvatar,
  image,
  index,
  isExpandedOnMobile,
  onAddComment,
  onCommentDraftChange,
  onImageError,
  onPostPress,
  onToggleComments,
  post,
  user
}) {
  const avatar = author?.avatar || avatarImages[index % avatarImages.length];

  return (
    <div
      className={`overflow-hidden rounded-[32px] bg-white shadow-spatial flex flex-col ${
        commentsOpen || isExpandedOnMobile ? "h-auto" : image ? "min-h-[44rem] md:h-[48rem]" : "min-h-[26rem]"
      }`}
      onClick={() => onPostPress(post.id)}
    >
      <div className={`grid min-h-0 gap-0 overflow-hidden ${image ? `md:h-[40rem] md:grid-cols-[0.75fr_1.35fr] ${commentsOpen ? "md:flex-none" : "flex-1"}` : "md:block"}`}>
        <div className={`${image ? "order-2 md:order-1" : ""} flex min-h-0 flex-col overflow-hidden`}>
          <div className="flex flex-shrink-0 flex-col overflow-y-auto p-8 pb-7 md:p-12 md:pb-10">
            <header className="mb-12 flex items-center gap-5">
              <img src={avatar} alt={author?.name || "Travel author"} className="h-16 w-16 flex-shrink-0 rounded-full border border-outline-variant object-cover" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-bold">{author?.name || "Travel Author"}</h3>
                <p className="truncate text-base text-on-surface-variant">{author?.company?.name || "Travel Photojournalist"}</p>
              </div>
            </header>

            <section className="mb-4 flex-shrink-0">
              <p className="mb-5 text-base font-bold uppercase tracking-[0.18em] text-primary">Home</p>
              <h2 className={`mb-6 font-serif text-4xl font-medium leading-[1.06] md:text-6xl ${isExpandedOnMobile ? "line-clamp-none" : "line-clamp-3"}`}>{post.title}</h2>
              <p className={`text-xl leading-9 text-[#263149] md:text-2xl md:leading-10 ${isExpandedOnMobile ? "line-clamp-none" : "line-clamp-5"}`}>{post.body}</p>
            </section>
          </div>
        </div>

        {image && (
          <div className="order-1 h-96 w-full overflow-hidden bg-surface-low md:order-2 md:h-full md:min-h-0">
            <img
              key={image}
              src={image}
              alt={post.title}
              className="h-full w-full object-cover object-center"
              onError={(event) => {
                event.currentTarget.style.visibility = "hidden";
                onImageError(post.id);
              }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center justify-between border-t border-surface-high px-8 py-5 md:px-12" onClick={(event) => event.stopPropagation()}>
        <div className="flex flex-wrap items-center gap-4">
          <button
            className={`inline-flex h-14 items-center gap-3 rounded-full px-6 py-3 text-base font-bold transition ${
              commentsOpen ? "bg-primary text-white" : "bg-surface-low text-on-surface hover:bg-surface-container"
            }`}
            onClick={() => onToggleComments(post.id)}
          >
            <Icon name="comment" size={25} strokeWidth={2.1} />
            <span>{commentCount}</span>
          </button>
        </div>
      </div>

      {commentsOpen && (
        <FeedComments
          comments={comments}
          commentCount={commentCount}
          commentDraft={commentDraft}
          getCommentAuthor={getCommentAuthor}
          getCommentAvatar={getCommentAvatar}
          onAddComment={onAddComment}
          onCommentDraftChange={onCommentDraftChange}
          post={post}
          user={user}
        />
      )}
    </div>
  );
}
