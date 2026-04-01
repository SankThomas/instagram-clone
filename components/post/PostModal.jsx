import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";

export default function PostModal({ user: profileUser, post, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user } = useUser();
  const router = useRouter();
  const currentUser = useQuery(
    api.users.getCurrentUser,
    user?.id ? { userId: user.id } : "skip",
  );

  const toggleLike = useMutation(api.posts.toggleLikePost);
  const toggleSave = useMutation(api.posts.toggleSavePost);
  const addComment = useMutation(api.comments.addComment);

  // Update URL when modal opens
  useEffect(() => {
    if (post) {
      window.history.pushState(null, "", `/post/${post._id}`);
    }
  }, [post]);

  const handleClose = () => {
    // Go back to previous URL when closing modal
    window.history.back();
    onClose();
  };

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      await toggleLike({
        postId: post._id,
        userId: currentUser._id,
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      await toggleSave({
        postId: post._id,
        userId: currentUser._id,
      });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser || !commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addComment({
        postId: post._id,
        userId: currentUser._id,
        text: commentText.trim(),
      });
      setCommentText("");
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!post) return null;

  const isLiked = post.likes?.includes(currentUser?._id);
  const isSaved = currentUser?.savedPosts?.includes(post._id);

  return (
    <Dialog open={!!post} onOpenChange={handleClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="flex-1 bg-black flex items-center justify-center">
            <img
              src={post.imageUrl}
              alt="Post"
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Content Section */}
          <div className="w-96 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <img
                src={profileUser?.imageUrl || "/default-avatar.png"}
                alt={profileUser?.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-semibold">{profileUser?.username}</span>
            </div>

            {/* Caption */}
            {post.caption && (
              <div className="p-4 border-b">
                <div className="flex gap-3">
                  <img
                    src={profileUser?.imageUrl || "/default-avatar.png"}
                    alt={profileUser?.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <span className="font-semibold mr-2">
                      {profileUser?.username}
                    </span>
                    <span>{post.caption}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4">
              {post.comments?.map((comment) => (
                <div key={comment._id} className="flex gap-3 mb-4">
                  <img
                    src={comment.user?.imageUrl || "/default-avatar.png"}
                    alt={comment.user?.username}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <span className="font-semibold mr-2">
                      {comment.user?.username}
                    </span>
                    <span>{comment.text}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="border-t p-4">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={handleLike}
                  className={`hover:opacity-70 ${isLiked ? "text-red-500" : ""}`}
                >
                  <Heart
                    className={`size-6 ${isLiked ? "fill-current" : ""}`}
                  />
                </button>
                <button className="hover:opacity-70">
                  <MessageCircle className="size-6" />
                </button>
                <button className="hover:opacity-70">
                  <Send className="size-6" />
                </button>
                <button
                  onClick={handleSave}
                  className={`ml-auto hover:opacity-70 ${isSaved ? "text-blue-500" : ""}`}
                >
                  <Bookmark
                    className={`size-6 ${isSaved ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              {post.likes?.length > 0 && (
                <div className="font-semibold mb-2">
                  {post.likes.length}{" "}
                  {post.likes.length === 1 ? "like" : "likes"}
                </div>
              )}

              <div className="text-xs text-gray-500 mb-3">
                {formatDistanceToNow(new Date(post._creationTime), {
                  addSuffix: true,
                })}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleComment} className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 border-none p-0 focus-visible:ring-0"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || isSubmitting}
                  className="text-blue-500 font-semibold disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
