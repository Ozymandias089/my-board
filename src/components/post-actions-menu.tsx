"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { PostDeleteDialog } from "./post-delete-dialog";

interface PostActionsMenuProps {
  postId: number;
  postTitle: string;
  createdAt: string | Date;
  onDeleted?: () => void; // ★ 리스트에서는 넘겨주고, 상세에서는 생략 가능
}

const EDIT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export function PostActionsMenu({
  postId,
  postTitle,
  createdAt,
  onDeleted,
}: PostActionsMenuProps) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const created =
    typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const canEdit = Date.now() - created.getTime() <= EDIT_WINDOW_MS;

  async function handleConfirmDelete() {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
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

      if (onDeleted) {
        // ★ 리스트에서: 콜백으로 목록 상태 업데이트
        onDeleted();
      } else {
        // ★ 상세에서: 홈으로 보내기
        router.push("/");
      }

      router.refresh();
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred while deleting the post.");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="p-1 rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={(e) => {
            // 리스트에서 카드/링크 클릭 막기
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <MoreVertical className="w-5 h-5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!canEdit}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!canEdit) return;
              router.push(`/posts/${postId}/edit`);
            }}
          >
            <Pencil className="w-4 h-4 mr-2" />
            Edit
            {!canEdit && (
              <span className="ml-2 text-[10px] uppercase text-muted-foreground">
                expired
              </span>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ★ 삭제 AlertDialog */}
      <PostDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        postTitle={postTitle}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
