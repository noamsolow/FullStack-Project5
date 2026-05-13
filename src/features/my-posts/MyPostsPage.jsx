import { Navigate, useNavigate, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../../components/ui/Status.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import MyPostCard from "./MyPostCard.jsx";
import MyPostComposer from "./MyPostComposer.jsx";
import MyPostDetail from "./MyPostDetail.jsx";
import { useMyPosts } from "./useMyPosts.js";

export default function MyPostsPage() {
  const { user } = useAuth();
  const { postId } = useParams();
  const navigate = useNavigate();
  const postsState = useMyPosts({ user, postId, navigate });
  const avatar = user.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80";

  if (postsState.loading) {
    return (
      <div className="mx-auto w-[min(1200px,calc(100%-40px))] pt-36">
        <LoadingState label="Loading personal logs..." />
      </div>
    );
  }

  if (postsState.error) {
    return (
      <div className="mx-auto w-[min(1200px,calc(100%-40px))] pt-36">
        <ErrorState message={postsState.error} />
      </div>
    );
  }

  if (postId && postsState.selectedIndex === -1) {
    return <Navigate to={`/users/${user.id}/posts`} replace />;
  }

  if (postsState.selectedPost) {
    return (
      <MyPostDetail
        post={postsState.selectedPost}
        index={postsState.selectedIndex}
        user={user}
        editing={postsState.editing}
        setEditing={postsState.setEditing}
        onSave={postsState.savePost}
        onDelete={postsState.deletePost}
        onBack={() => navigate(`/users/${user.id}/posts`)}
        onNext={() => postsState.goToPost(postsState.selectedIndex + 1)}
        onPrevious={() => postsState.goToPost(postsState.selectedIndex - 1)}
        hasMultiple={postsState.sortedPosts.length > 1}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 pt-36 text-[#101727] md:pb-16">
      <main className="mx-auto w-[min(1400px,calc(100%-40px))] md:w-[min(1400px,calc(100%-80px))]">
        <header className="mb-16">
          <h1 className="font-serif text-6xl font-medium leading-tight md:text-7xl">Personal Logs</h1>
          <p className="mt-5 max-w-2xl text-xl leading-8 text-on-surface-variant">Document your journeys, one memory at a time.</p>
        </header>

        <MyPostComposer
          avatar={avatar}
          draft={postsState.draft}
          expanded={postsState.expanded}
          selectedFileName={postsState.selectedFileName}
          submitting={postsState.submitting}
          user={user}
          onDraftChange={postsState.updateDraft}
          onFileChange={postsState.handlePhotoUpload}
          onPublish={postsState.publishPost}
          onSetDraft={postsState.setDraft}
          onSetExpanded={postsState.setExpanded}
        />

        {postsState.error && (
          <div className="mt-8">
            <ErrorState message={postsState.error} />
          </div>
        )}

        <section className="mt-10 space-y-8">
          {postsState.sortedPosts.length === 0 ? (
            <EmptyState title="No personal logs yet" body="Publish your first travel memory above." />
          ) : (
            postsState.sortedPosts.map((post, index) => (
              <MyPostCard
                key={post.id}
                post={post}
                index={index}
                editing={postsState.editing}
                setEditing={postsState.setEditing}
                user={user}
                comments={postsState.commentsByPost[post.id] || []}
                commentsOpen={Boolean(postsState.showComments[post.id])}
                commentDraft={postsState.commentDraft[post.id] || ""}
                onToggleComments={() => postsState.toggleComments(post.id)}
                onCommentDraftChange={(value) => postsState.setPostCommentDraft(post.id, value)}
                onAddComment={postsState.addComment}
                onDeleteComment={postsState.deleteComment}
                getCommentAuthor={postsState.getCommentAuthor}
                getCommentAvatar={postsState.getCommentAvatar}
                onSave={postsState.savePost}
                onDelete={postsState.deletePost}
                onOpen={postsState.openPost}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
}
