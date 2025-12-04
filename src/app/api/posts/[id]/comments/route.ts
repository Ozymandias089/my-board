import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_CONTENT_LENGTH } from "@/lib/constants";

type RouteContext = {
  params: Promise<{ id: string }>;
}

// GET /api/posts/[id]/comments
// 특정 게시글의 전체 댓글 목록 조회 (flat list)
export async function GET() {}