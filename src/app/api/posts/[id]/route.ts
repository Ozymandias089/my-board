import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const id = Number(context.params.id);

  if (isNaN(id)) {
    return NextResponse.json(
      { error: { code: 'INVALID_ID', message: 'Invalid id.' } },
      { status: 400 }
    );
  }

  const post = await prisma.post.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json(
      { error: { code: 'POST_NOT_FOUND', message: 'Post not found.' } },
      { status: 404 }
    );
  }

  return NextResponse.json(post);
}
