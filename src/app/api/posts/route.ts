import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handle, title, content } = body;

    // 기본 검증
    if (!handle || typeof handle !== 'string' || handle.length < 2) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Handle is invalid.' } },
        { status: 400 }
      );
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Title is required.' } },
        { status: 400 }
      );
    }
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'Content is required.' } },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      // 예: 1만자 이상은 막기
      return NextResponse.json(
        { error: { message: "Content is too long (max 10,000 characters)." } },
        { status: 400 },
      );
    }

    const post = await prisma.post.create({
      data: { handle, title, content },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Internal server error.' } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get('cursor');
  const limitParam = searchParams.get('limit');

  const limit = limitParam ? Math.min(Number(limitParam), 50) : 20;
  const cursor = cursorParam ? Number(cursorParam) : null;

  const posts = await prisma.post.findMany({
    where: cursor ? { id: { lt: cursor } } : undefined,
    orderBy: { id: 'desc' },
    take: limit,
  });

  const nextCursor = posts.length > 0 ? posts[posts.length - 1].id : null;
  const hasMore = posts.length === limit;

  return NextResponse.json({ items: posts, nextCursor, hasMore });
}
