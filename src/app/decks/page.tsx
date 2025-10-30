"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Plus, BookOpen, Clock, Brain } from "lucide-react";
import Link from "next/link";

type Card = {
  id: string;
  question: string;
  answer: string;
  type: string;
};

type Deck = {
  id: string;
  name: string;
  cards: Card[];
  createdAt: string;
};

type ReviewStat = {
  due: number;
  lastReviewed: number;
};

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [reviewData, setReviewData] = useState<Record<string, ReviewStat>>({});

  const fetchAllReviewStats = useCallback(async (decks: Deck[]) => {
    const stats: Record<string, ReviewStat> = {};
    for (const deck of decks) {
      for (const card of deck.cards) {
        try {
          const res = await fetch(`/api/review?cardId=${card.id}`);
          const logs = await res.json();
          if (logs?.length > 0) {
            const latest = logs[0];
            stats[card.id] = {
              due: new Date(latest.nextDue).getTime(),
              lastReviewed: new Date(latest.reviewedAt).getTime(),
            };
          }
        } catch {}
      }
    }
    setReviewData(stats);
  }, []);

  useEffect(() => {
    fetch("/api/deck")
      .then((res) => res.json())
      .then((data) => {
        setDecks(data);
        // Fetch review stats for all cards
        fetchAllReviewStats(data);
      })
      .catch(() => setDecks([]));
  }, [fetchAllReviewStats]);

  const deleteDeck = useCallback(async (id: string) => {
    if (!confirm("Delete this deck? This cannot be undone.")) return;
    await fetch(`/api/deck?id=${id}`, { method: "DELETE" });
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const getDeckStats = useCallback((deck: Deck) => {
    const now = Date.now();
    const due = deck.cards.filter((c) => {
      const rd = reviewData[c.id];
      return !rd || rd.due <= now;
    }).length;
    const total = deck.cards.length;
    return { due, total };
  }, [reviewData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            StudySprint
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={16} />
            New Deck
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Your Decks</h1>
          <p className="text-zinc-600">
            {decks.length} {decks.length === 1 ? "deck" : "decks"} total
          </p>
        </div>

        {decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={64} className="text-zinc-300 mb-4" />
            <h2 className="text-xl font-semibold text-zinc-700 mb-2">No decks yet</h2>
            <p className="text-zinc-500 mb-6">Create your first deck to get started</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus size={18} />
              Create Deck
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {decks.map((deck) => {
              const stats = getDeckStats(deck);
              return (
                <div
                  key={deck.id}
                  className="group relative rounded-xl border border-zinc-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-zinc-900 mb-1 line-clamp-2">
                      {deck.name}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Created {new Date(deck.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                      <BookOpen size={16} className="text-indigo-600" />
                      <span className="text-zinc-700">
                        {stats.total} {stats.total === 1 ? "card" : "cards"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={16} className="text-orange-600" />
                      <span className="text-zinc-700">
                        {stats.due} due now
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/review/${deck.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                    >
                      <Brain size={16} />
                      Study
                    </Link>
                    <button
                      onClick={() => deleteDeck(deck.id)}
                      className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete deck"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
