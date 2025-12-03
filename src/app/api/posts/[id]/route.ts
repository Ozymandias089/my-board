import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

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

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;
  const postId= Number(id);

  if (isNaN(postId)) {
    return NextResponse.json(
      { error: { code: 'INVALID_ID', message: 'Invalid Post Id.' } },
      { status: 400 }
    );
  }

  try {
    await prisma.post.delete({ where: { id: postId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Post Not Found.' } },
      { status: 404 }
    );
  }
}