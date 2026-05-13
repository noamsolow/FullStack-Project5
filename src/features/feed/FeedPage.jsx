import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Status.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import FeedPostCard from "./FeedPostCard.jsx";
import { useFeed } from "./useFeed.js";

export default function FeedPage() {
  const { user } = useAuth();
  const feed = useFeed(user);

  if (feed.loading) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading feed..." />
      </div>
    );
  }

  if (feed.error) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <ErrorState message={feed.error} />
      </div>
    );
  }

  if (feed.posts.length === 0) {
    return (
      <div className="mx-auto w-[min(1400px,calc(100%-40px))] pt-36">
        <EmptyState title="No feed posts yet" body="The feed shows posts from other travelers, not your own posts." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-5 pb-24 pt-36 text-[#101727] md:px-10 md:pb-12">
      <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-6">
        {feed.posts.map((post, index) => (
          <FeedPostCard
            key={post.id}
            author={feed.authors[post.userId]}
            commentCount={feed.commentCounts[post.id] || 0}
            commentDraft={feed.commentDraft[post.id] || ""}
            comments={feed.commentsByPost[post.id] || []}
            commentsOpen={Boolean(feed.showComments[post.id])}
            getCommentAuthor={feed.getCommentAuthor}
            getCommentAvatar={feed.getCommentAvatar}
            image={feed.getResolvedPostImage(post, index)}
            index={index}
            isExpandedOnMobile={feed.expandedPostId === post.id}
            onAddComment={feed.addComment}
            onCommentDraftChange={(value) => feed.setPostCommentDraft(post.id, value)}
            onImageError={feed.handleImageError}
            onPostPress={feed.handlePostPress}
            onToggleComments={feed.toggleComments}
            post={post}
            user={user}
          />
        ))}
      </main>
    </div>
  );
}
