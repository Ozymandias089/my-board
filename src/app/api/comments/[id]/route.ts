import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_COMMENT_LENGTH } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// DELETE /api/comments/[id]
// → 소프트 삭제: isDeleted = true, deletedAt 설정
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const commentId = Number(id);

  if (Number.isNaN(commentId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid comment id." } },
      { status: 400 }
    );
  }

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, isDeleted: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: "COMMENT_NOT_FOUND", message: "Comment not found." } },
      { status: 404 }
    );
  }

  // 이미 삭제된 댓글이면 그냥 성공으로 처리해도 됨
  if (existing.isDeleted) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  try {
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        // content: "",   // 진짜 내용까지 날리고 싶으면 주석 해제
        // handle: "[deleted]" // 레딧처럼 author도 가리고 싶으면 이 옵션도 가능
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}

// PATCH /api/comments/[id] → 내용 수정
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const commentId = Number(id);

  if (Number.isNaN(commentId)) {
    return NextResponse.json(
      { error: { code: "INVALID_ID", message: "Invalid comment id." } },
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

  const { content } = body as { content?: string };

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

  const trimmed = content.trim();

  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "CONTENT_TOO_LONG",
          message: `Content exceeds maximum length of ${MAX_COMMENT_LENGTH} characters.`,
        },
      },
      { status: 400 }
    );
  }

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: "COMMENT_NOT_FOUND", message: "Comment not found." } },
      { status: 404 }
    );
  }

  if (existing.isDeleted) {
    return NextResponse.json(
      {
        error: {
          code: "COMMENT_DELETED",
          message: "Deleted comments cannot be edited.",
        },
      },
      { status: 403 }
    );
  }

  try {
    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: trimmed,
        // updatedAt는 @updatedAt이 알아서 갱신
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Internal server error." } },
      { status: 500 }
    );
  }
}