import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/posts/[id]/comments
// 특정 게시글의 전체 댓글 목록 조회 (flat list)
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid post id." } },
      { status: 400 }
    );
  }

  // 게시글 존재 여부 확인 (없으면 404)
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json(
      { error: { code: "POST_NOT_FOUND", message: "Post not found." } },
      { status: 404 }
    );
  }

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ items: comments }, { status: 200 });
}

// POST /api/posts/[id]/comments
// 댓글 작성 (parentId가 있으면 대댓글)
export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid post id." } },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return NextResponse.json(
      { error: { code: "POST_NOT_FOUND", message: "Post not found." } },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid request body." } },
      { status: 400 }
    );
  }

  let { handle, content, parentId } = body as {
    handle?: string;
    content?: string;
    parentId?: number | null;
  };

  // --- handle 검증 (게시글과 동일 규칙 사용) ---
  if (typeof handle !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_HANDLE",
          message: "Handle is required.",
        },
      },
      { status: 400 }
    );
  }

  handle = handle.trim();
  const handleValid =
    /^[a-zA-Z0-9_-]+$/.test(handle) &&
    handle.length >= 3 &&
    handle.length <= 24;

  if (!handleValid) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_HANDLE",
          message:
            "Handle must be 3–24 characters and contain only letters, numbers, '_' and '-'.",
        },
      },
      { status: 400 }
    );
  }

  // --- content 검증 ---
  if (typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_CONTENT",
          message: "Content is required.",
        },
      },
      { status: 400 }
    );
  }

  content = content.trim();

  if (content.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "CONTENT_TOO_LONG",
          message: `Content exceeds maximum length of ${MAX_COMMENT_LENGTH.toLocaleString()} characters.`,
        },
      },
      { status: 400 }
    );
  }

  // --- parentId 검증 (대댓글인 경우) ---
  let parentCommentId: number | null = null;

  if (parentId !== undefined && parentId !== null) {
    if (typeof parentId !== "number" || Number.isNaN(parentId)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PARENT_ID",
            message: "Invalid parentId.",
          },
        },
        { status: 400 }
      );
    }

    parentCommentId = parentId;

    const parent = await prisma.comment.findUnique({
      where: { id: parentCommentId },
      select: { id: true, postId: true },
    });

    if (!parent || parent.postId !== postId) {
      return NextResponse.json(
        {
          error: {
            code: "PARENT_NOT_FOUND",
            message: "Parent comment not found in this post.",
          },
        },
        { status: 400 }
      );
    }
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        postId,
        parentId: parentCommentId,
        handle,
        content,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        error: {
          code: "SERVER_ERROR",
          message: "Internal server error.",
        },
      },
      { status: 500 }
    );
  }
}
