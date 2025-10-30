import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/deck (create a new deck with cards)
export async function POST(req: NextRequest) {
  const data = await req.json();
  const { name, cards } = data as { name: string; cards: Array<{ question: string; answer: string; type: string; source?: string }>; };
  if (!name || !Array.isArray(cards) || cards.length === 0) {
    return new Response(JSON.stringify({ error: 'Deck must have a name and at least one card.' }), { status: 400 });
  }
  // Deck creation, associate with userId: null for now
  const deck = await prisma.deck.create({
    data: {
      name,
      userId: null,
      cards: {
        create: cards.map(card => ({
          question: card.question,
          answer: card.answer,
          type: card.type,
          source: card.source ?? null,
        }))
      },
    },
    include: { cards: true },
  });
  return Response.json(deck);
}

// GET /api/deck (list all decks, prototype/MVP: all decks)
export async function GET() {
  const decks = await prisma.deck.findMany({
    include: { cards: true },
    orderBy: { createdAt: 'desc' },
  });
  return Response.json(decks);
}

// DELETE /api/deck?id=... (delete a deck and its cards)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
  await prisma.deck.delete({ where: { id } });
  return Response.json({ success: true });
}
