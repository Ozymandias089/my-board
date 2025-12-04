// src/components/comments/types.ts

export type Comment = {
  id: number;
  postId: number;
  parentId: number | null;
  handle: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
};

export type CommentNode = Comment & {
  replies: CommentNode[];
};

export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId == null) {
      roots.push(node);
    } else {
      const parent = map.get(c.parentId);
      if (parent) {
        parent.replies.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}
