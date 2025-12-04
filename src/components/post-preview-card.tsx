"use client";

import { MouseEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { PostActionsMenu } from "./post-actions-menu";

// NOTE: 나중에 공용 타입으로 빼도 됨
type Post = {
  id: number;
  handle: string;
  title: string;
  content: string;
  createdAt: string | Date;
  commentsCount: number;
};

interface PostPreviewCardProps {
  post: Post;
  onCommentsClick: (e: MouseEvent<HTMLButtonElement>) => void;
  onDeleted?: () => void;
}

export function PostPreviewCard({
  post,
  onCommentsClick,
  onDeleted,
}: PostPreviewCardProps) {
  const createdAt =
    typeof post.createdAt === "string"
      ? new Date(post.createdAt)
      : post.createdAt;

  const preview =
    post.content.length > 100
      ? post.content.slice(0, 100) + "..."
      : post.content;

  return (
    <Card className="relative hover:bg-accent/60 transition-colors cursor-pointer">
      {/* 우측 상단 케밥 메뉴 */}
      <div className="absolute top-2 right-2 z-10">
        <PostActionsMenu
          postId={post.id}
          postTitle={post.title}
          createdAt={createdAt}
          onDeleted={onDeleted}
        />
      </div>

      <CardHeader>
        <CardTitle className="text-lg">{post.title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {post.handle} · {createdAt.toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{preview}</p>

        <div className="mt-3 flex items-center justify-between">
          <Button
            variant="link"
            size="sm"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={onCommentsClick}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
