@@ .. @@
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
+import {
+  DropdownMenu,
+  DropdownMenuContent,
+  DropdownMenuItem,
+  DropdownMenuTrigger,
+} from "../ui/dropdown-menu";
+import ConfirmDialog from "../ui/ConfirmDialog";

export default function PostModal({ post, onClose }) {
   const [commentText, setCommentText] = useState("");
   const [isSubmitting, setIsSubmitting] = useState(false);
+  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

   const { user } = useUser();
@@ .. @@
   const toggleLike = useMutation(api.posts.toggleLike);
   const toggleSave = useMutation(api.posts.toggleSavePost);
   const addComment = useMutation(api.comments.addComment);
+  const deletePost = useMutation(api.posts.deletePost);

+  const isOwner = currentUser && post.user._id === currentUser._id;
+
   const handleLike = async () => {
@@ .. @@
     }
   };

+  const handleDelete = async () => {
+    if (!user) return;
+    try {
+      await deletePost({ clerkId: user.id, postId: post._id });
+      toast.success("Post deleted");
+      onClose();
+    } catch (error) {
+      toast.error("Failed to delete post");
+    }
+  };
+
   return (
@@ .. @@
                 </div>
               </Link>
-              <Button variant="ghost" size="sm">
-                <MoreHorizontal className="size-4" />
-              </Button>
+              <DropdownMenu>
+                <DropdownMenuTrigger asChild>
+                  <Button variant="ghost" size="sm">
+                    <MoreHorizontal className="size-4" />
+                  </Button>
+                </DropdownMenuTrigger>
+                <DropdownMenuContent align="end">
+                  {isOwner && (
+                    <DropdownMenuItem
+                      onClick={() => setShowDeleteConfirm(true)}
+                      className="text-destructive"
+                    >
+                      Delete post
+                    </DropdownMenuItem>
+                  )}
+                  <DropdownMenuItem>Share</DropdownMenuItem>
+                  <DropdownMenuItem>Copy link</DropdownMenuItem>
+                </DropdownMenuContent>
+              </DropdownMenu>
             </div>

@@ .. @@
           </div>
         </div>
       </DialogContent>
+
+      <ConfirmDialog
+        isOpen={showDeleteConfirm}
+        onClose={() => setShowDeleteConfirm(false)}
+        onConfirm={handleDelete}
+        title="Delete post?"
+        description="Are you sure you want to delete this post? This action cannot be undone."
+      />
     </Dialog>
   );
 }