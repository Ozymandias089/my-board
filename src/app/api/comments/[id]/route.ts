import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
