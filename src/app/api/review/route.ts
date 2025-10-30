import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/review (add a review log for a card)
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { cardId, result, interval } = data as { cardId: string; result: string; interval: number };
  if (!cardId || !['hard','okay','got'].includes(result)) {
    return new Response(JSON.stringify({ error: 'Missing cardId or invalid result' }), { status: 400 });
  }
  const now = new Date();
  const nextDue = new Date(now.getTime() + interval * 60 * 1000);
  const log = await prisma.reviewLog.create({
    data: {
      cardId,
      reviewedAt: now,
      result,
      interval,
      nextDue,
    },
  });
  return Response.json(log);
}

// GET /api/review?cardId=... (fetch all reviews of a card)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cardId = searchParams.get('cardId');
  if (!cardId) return new Response(JSON.stringify({ error: 'cardId required' }), { status: 400 });
  const logs = await prisma.reviewLog.findMany({ where: { cardId }, orderBy: { reviewedAt: 'desc' } });
  return Response.json(logs);
}
