// src/components/comments/comments-section.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageCircle, Loader2 } from "lucide-react";
import { buildCommentTree, type Comment } from "./types";
import { CommentItem } from "./comment-item";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

interface CommentsSectionProps {
  postId: number;
}

export function CommentsSection({ postId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newHandle, setNewHandle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 공용 reply 상태
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);
  const [replyHandle, setReplyHandle] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;

    async function fetchComments() {
      setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          const msg =
            data?.error?.message || "Failed to load comments.";
          if (!canceled) setLoadError(msg);
          return;
        }

        const data = await res.json();
        if (!canceled) {
          setComments(data.items as Comment[]);
        }
      } catch (e) {
        console.error(e);
        if (!canceled) {
          setLoadError("An unexpected error occurred while loading comments.");
        }
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    fetchComments();

    return () => {
      canceled = true;
    };
  }, [postId]);

  const tree = useMemo(() => buildCommentTree(comments), [comments]);

  async function handleCreateComment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const handle = newHandle.trim();
    const content = newContent.trim();

    if (!handle) {
      setSubmitError("Handle is required.");
      return;
    }
    if (
      !/^[a-zA-Z0-9_-]+$/.test(handle) ||
      handle.length < 3 ||
      handle.length > 24
    ) {
      setSubmitError(
        "Handle must be 3–24 characters and contain only letters, numbers, '_' and '-'."
      );
      return;
    }

    if (!content) {
      setSubmitError("Content is required.");
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      setSubmitError(
        `Content exceeds maximum length of ${MAX_COMMENT_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, content }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error?.message || "Failed to add comment.";
        setSubmitError(msg);
        return;
      }

      const created = (await res.json()) as Comment;

      setComments((prev) => [...prev, created]);
      setNewContent("");
    } catch (e) {
      console.error(e);
      setSubmitError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateReply(parentId: number) {
    setReplyError(null);

    const handle = replyHandle.trim();
    const content = replyContent.trim();

    if (!handle) {
      setReplyError("Handle is required.");
      return;
    }
    if (
      !/^[a-zA-Z0-9_-]+$/.test(handle) ||
      handle.length < 3 ||
      handle.length > 24
    ) {
      setReplyError(
        "Handle must be 3–24 characters and contain only letters, numbers, '_' and '-'."
      );
      return;
    }

    if (!content) {
      setReplyError("Content is required.");
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      setReplyError(
        `Content exceeds maximum length of ${MAX_COMMENT_LENGTH.toLocaleString()} characters.`
      );
      return;
    }

    setReplySubmitting(true);

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, content, parentId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error?.message || "Failed to add reply.";
        setReplyError(msg);
        return;
      }

      const created = (await res.json()) as Comment;
      setComments((prev) => [...prev, created]);
      setReplyContent("");
      setReplyTargetId(null);
    } catch (e) {
      console.error(e);
      setReplyError("An unexpected error occurred.");
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleDeleteComment(id: number) {
    if (!confirm("Delete this comment? This will mark it as [deleted].")) {
      return;
    }

    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg = data?.error?.message || "Failed to delete comment.";
        alert(msg);
        return;
      }

      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isDeleted: true } : c))
      );
    } catch (e) {
      console.error(e);
      alert("An unexpected error occurred.");
    }
  }

  return (
    <section className="space-y-4 mt-8">
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 최상위 댓글 작성 폼 */}
          <form onSubmit={handleCreateComment} className="space-y-3">
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Your handle (e.g. dev_lover)"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>
            <Textarea
              placeholder="Write a comment..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              disabled={submitting}
              rows={3}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting && (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                )}
                Add comment
              </Button>
            </div>
          </form>

          <Separator className="my-4" />

          {/* 댓글 목록 */}
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading comments...</p>
          ) : loadError ? (
            <Alert variant="destructive">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : tree.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {tree.map((node) => (
                <CommentItem
                  key={node.id}
                  node={node}
                  depth={0}
                  replyTargetId={replyTargetId}
                  replyHandle={replyHandle}
                  replyContent={replyContent}
                  replySubmitting={replySubmitting}
                  replyError={replyError}
                  setReplyTargetId={setReplyTargetId}
                  setReplyHandle={setReplyHandle}
                  setReplyContent={setReplyContent}
                  setReplyError={setReplyError}
                  onReplySubmit={handleCreateReply}
                  onDeleteClick={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
