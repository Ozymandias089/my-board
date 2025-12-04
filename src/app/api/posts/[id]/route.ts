import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EDIT_WINDOW_MS } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// ------------------------------------------------------------------
// GET /api/posts/[id]  : 단일 게시글 조회
// ------------------------------------------------------------------
export async function GET(_req: NextRequest, { params }: RouteContext) {
  // ★ params는 Promise라서 먼저 await로 풀어준다
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid id." } },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });

  if (!post) {
    return NextResponse.json(
      { error: { code: "POST_NOT_FOUND", message: "Post not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json(post, { status: 200 });
}

// ------------------------------------------------------------------
// DELETE /api/posts/[id] : 게시글 삭제
// ------------------------------------------------------------------
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid Post Id." } },
      { status: 400 }
    );
  }

  try {
    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Post Not Found." } },
      { status: 404 }
    );
  }
}

// ------------------------------------------------------------------
// PATCH /api/posts/[id] : 게시글 수정 (3일 제한)
// ------------------------------------------------------------------
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const postId = Number(id);

  if (Number.isNaN(postId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid Post Id." } },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Invalid request body.",
        },
      },
      { status: 400 }
    );
  }

  const { title, content } = body as {
    title?: string;
    content?: string;
  };

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_TITLE",
          message: "Title is required.",
        },
      },
      { status: 400 }
    );
  }

  if (!content || typeof content !== "string" || content.trim().length === 0) {
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

  if (content.length > 10000) {
    return NextResponse.json(
      {
        error: {
          code: "CONTENT_TOO_LONG",
          message: "Content exceeds maximum length of 10,000 characters.",
        },
      },
      { status: 400 }
    );
  }

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) {
    return NextResponse.json(
      { error: { code: "POST_NOT_FOUND", message: "Post not found." } },
      { status: 404 }
    );
  }

  const now = new Date();
  const diffMs = now.getTime() - existing.createdAt.getTime();

  if (diffMs > EDIT_WINDOW_MS) {
    return NextResponse.json(
      {
        error: {
          code: "EDIT_WINDOW_EXPIRED",
          message: "The edit window has expired.",
        },
      },
      { status: 403 }
    );
  }

  const updatedPost = await prisma.post.update({
    where: { id: postId },
    data: {
      title: title.trim(),
      content: content.trim(),
    },
  });

  return NextResponse.json(updatedPost, { status: 200 });
}
