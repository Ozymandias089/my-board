// src/components/comments/comment-item.tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  MoreVertical,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CommentNode } from "./types";

export interface CommentItemProps {
  node: CommentNode;
  depth: number;

  // 공용 reply 상태
  replyTargetId: number | null;
  replyHandle: string;
  replyContent: string;
  replySubmitting: boolean;
  replyError: string | null;

  setReplyTargetId: (id: number | null) => void;
  setReplyHandle: (v: string) => void;
  setReplyContent: (v: string) => void;
  setReplyError: (v: string | null) => void;

  onReplySubmit: (parentId: number) => void;
  onDeleteClick: (id: number) => void;

  onEditSubmit: (
    id: number,
    content: string
  ) => Promise<{ ok: boolean; message?: string }>;
}

export function CommentItem(props: CommentItemProps) {
  const {
    node,
    depth,
    replyTargetId,
    replyHandle,
    replyContent,
    replySubmitting,
    replyError,
    setReplyTargetId,
    setReplyHandle,
    setReplyContent,
    setReplyError,
    onReplySubmit,
    onDeleteClick,
  } = props;

  const hasReplies = node.replies.length > 0;
  const created = new Date(node.createdAt);
  const updated = new Date(node.updatedAt);
  const isEdited = updated.getTime() !== created.getTime();
  const [open, setOpen] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.content);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const displayContent = node.isDeleted ? "[deleted]" : node.content;
  const displayHandle = node.isDeleted ? "[deleted]" : node.handle;

  const isReplyingHere = replyTargetId === node.id;

  const indentClass = depth === 0 ? "" : "ml-4";

  return (
    <div className={cn("text-sm", indentClass)}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className="flex gap-2">
          {/* 왼쪽: 항상 있는 caret 버튼 (대댓글 없어도 내용 접기 가능) */}
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-1 inline-flex items-center justify-center w-5 h-5 rounded hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={open ? "Collapse comment" : "Expand comment"}
            >
              {open ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          </CollapsibleTrigger>

          {/* 오른쪽: 헤더 + 내용 + 대댓글 */}
          <div className="flex-1">
            {/* 헤더 줄 */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{displayHandle}</span>
              <span>·</span>
              <span>{created.toLocaleString()}</span>
              {(isEdited && !node.isDeleted) && (
                <span className="text-[10px] uppercase text-muted-foreground ml-1">
                  [edited]
                </span>
              )}

              {!node.isDeleted && (
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="text-xs underline-offset-2 hover:underline"
                    onClick={() => {
                      setReplyTargetId(node.id);
                      if (!replyHandle) {
                        setReplyHandle(node.handle);
                      }
                    }}
                  >
                    Reply
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MoreVertical className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={() => {
                          if (node.isDeleted) return;
                          setEditValue(node.content);
                          setEditError(null);
                          setIsEditing(true);
                          // 편집 들어갈 때는 답글 타겟은 해제해 주는 것도 자연스러움
                          setReplyTargetId(null);
                        }}
                      >
                        <Pencil className="w-3 h-3 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => onDeleteClick(node.id)}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* 내용 + 대댓글 + 인라인 reply 폼 → 모두 접히는 영역 */}
            <CollapsibleContent>
              {/* 본문 or 편집 폼 */}
              {isEditing && !node.isDeleted ? (
                <div className="mt-2 space-y-2">
                  {editError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">
                        {editError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={3}
                    disabled={editSubmitting}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      disabled={editSubmitting}
                      onClick={() => {
                        setIsEditing(false);
                        setEditError(null);
                        setEditValue(node.content); // 취소하면 원래 내용으로
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 px-3 text-xs"
                      disabled={editSubmitting}
                      onClick={async () => {
                        setEditError(null);
                        const result = await (async () => {
                          const trimmed = editValue.trim();
                          if (!trimmed) {
                            return {
                              ok: false,
                              message: "Content is required.",
                            } as const;
                          }
                          setEditSubmitting(true);
                          const r = await props.onEditSubmit(node.id, trimmed);
                          setEditSubmitting(false);
                          return r;
                        })();

                        if (!result.ok) {
                          setEditError(
                            result.message ?? "Failed to update comment."
                          );
                        } else {
                          setIsEditing(false);
                        }
                      }}
                    >
                      {editSubmitting && (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      )}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className={cn(
                    "mt-1 whitespace-pre-wrap leading-relaxed",
                    node.isDeleted && "italic text-muted-foreground"
                  )}
                >
                  {displayContent}
                </p>
              )}

              {/* 이 댓글에 대한 reply 폼 (바로 아래) */}
              {isReplyingHere && !node.isDeleted && (
                <div className="mt-3 mb-2 space-y-2">
                  {replyError && (
                    <Alert variant="destructive">
                      <AlertDescription className="text-xs">
                        {replyError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CornerDownRight className="w-3 h-3" />
                    <span>Replying to this comment</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => {
                        setReplyTargetId(null);
                        setReplyError(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Your handle"
                        value={replyHandle}
                        onChange={(e) => setReplyHandle(e.target.value)}
                        disabled={replySubmitting}
                      />
                    </div>
                  </div>
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    disabled={replySubmitting}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      disabled={replySubmitting}
                      onClick={() => onReplySubmit(node.id)}
                    >
                      {replySubmitting && (
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                      )}
                      Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* 자식 댓글들: 굵은 세로 라인 + 들여쓰기 */}
              {hasReplies && (
                <div className="mt-2 border-l-2 border-border/70 pl-3 space-y-3">
                  {node.replies.map((child) => (
                    <CommentItem
                      key={child.id}
                      node={child}
                      depth={depth + 1}
                      replyTargetId={replyTargetId}
                      replyHandle={replyHandle}
                      replyContent={replyContent}
                      replySubmitting={replySubmitting}
                      replyError={replyError}
                      setReplyTargetId={setReplyTargetId}
                      setReplyHandle={setReplyHandle}
                      setReplyContent={setReplyContent}
                      setReplyError={setReplyError}
                      onReplySubmit={onReplySubmit}
                      onDeleteClick={onDeleteClick}
                      onEditSubmit={props.onEditSubmit}
                    />
                  ))}
                </div>
              )}
            </CollapsibleContent>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
