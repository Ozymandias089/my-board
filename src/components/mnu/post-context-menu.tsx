"use client";

import { ReactNode, useState, MouseEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Pencil, Trash2, Share2 } from "lucide-react";
import { EDIT_WINDOW_MS } from "@/lib/constants";
import { PostDeleteDialog } from "./post-delete-dialog";
import { ShareLinkDialog } from "./share-dialog";

// NOTE: 나중에 공용 타입으로 빼도 됨
type Post = {
  id: number;
  handle: string;
  title: string;
  content: string;
  createdAt: string | Date;
  commentsCount: number;
};

interface PostContextMenuProps {
  post: Post;
  children: ReactNode;
  onDeleted?: () => void;
}

export function PostContextMenu({
  post,
  children,
  onDeleted,
}: PostContextMenuProps) {
  const router = useRouter();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const createdAt =
    typeof post.createdAt === "string"
      ? new Date(post.createdAt)
      : post.createdAt;
  const canEdit = Date.now() - createdAt.getTime() <= EDIT_WINDOW_MS;

  async function handleConfirmDelete() {
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error?.message || "Failed to delete this post.";
        alert(message);
        return;
      }

      setDeleteOpen(false);
      onDeleted?.();
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred while deleting the post.");
    }
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem
          disabled={!canEdit}
          onClick={() => {
            if (!canEdit) return;
            router.push(`/posts/${post.id}/edit`);
          }}
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit
          {!canEdit && (
            <span className="ml-2 text-[10px] uppercase text-muted-foreground">
              expired
            </span>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const base = process.env.NEXT_PUBLIC_BASE_URL ?? "";
            setShareUrl(`${base}/posts/${post.id}`);
            setShareOpen(true);
          }}
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>

      {/* 삭제 다이얼로그 */}
      <PostDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        postTitle={post.title}
        onConfirm={handleConfirmDelete}
      />

      {/* 공유 다이얼로그 */}
      <ShareLinkDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={shareUrl}
      />
    </ContextMenu>
  );
}
