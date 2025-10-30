"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

type Flashcard = {
  id: string;
  type: "qa" | "cloze";
  question: string;
  answer: string;
  source?: string;
};

type Deck = {
  id: string;
  name: string;
  cards: Flashcard[];
};

type ReviewState = {
  lastReviewed: number | null;
  interval: number;
  due: number;
};

const intervals = {
  hard: 60 * 1000, // 1 min
  okay: 10 * 60 * 1000, // 10 min
  got: 24 * 60 * 60 * 1000, // 1 day
};

function getNextInterval(prev: number, factor: number) {
  if (prev === 0) return factor;
  return Math.floor(prev * factor);
}

function formatInterval(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params?.deckId as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [reviewData, setReviewData] = useState<Record<string, ReviewState>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReviewData = useCallback(async (cards: Flashcard[]) => {
    const data: Record<string, ReviewState> = {};
    await Promise.all(
      cards.map(async (card) => {
        try {
          const res = await fetch(`/api/review?cardId=${card.id}`);
          const logs = await res.json();
          if (logs?.length > 0) {
            const latest = logs[0];
            data[card.id] = {
              interval: latest.interval * 60 * 1000,
              due: new Date(latest.nextDue).getTime(),
              lastReviewed: new Date(latest.reviewedAt).getTime(),
            };
          }
        } catch {}
      })
    );
    setReviewData(data);
  }, []);

  useEffect(() => {
    if (!deckId) return;
    fetch("/api/deck")
      .then((res) => res.json())
      .then((decks) => {
        const found = decks.find((d: Deck) => d.id === deckId);
        if (!found) {
          router.push("/decks");
          return;
        }
        setDeck(found);
        fetchReviewData(found.cards);
        setLoading(false);
      });
  }, [deckId, router, fetchReviewData]);

  const [now] = useState(() => Date.now());

  const dueCards = useMemo(() => {
    if (!deck) return [];
    return deck.cards.filter((c) => {
      const rd = reviewData[c.id];
      return !rd || rd.due <= now;
    });
  }, [deck, reviewData, now]);

  const currentCard = dueCards[currentIdx] || null;

  const reviewCard = useCallback(
    async (choice: "hard" | "okay" | "got") => {
      if (!currentCard) return;
      const old = reviewData[currentCard.id] || { lastReviewed: null, interval: 0, due: 0 };
      const now = Date.now();
      let nextInterval, minutes;

      if (choice === "hard") {
        nextInterval = intervals.hard;
        minutes = 1;
      } else if (choice === "okay") {
        nextInterval = getNextInterval(old.interval || intervals.okay, 2);
        minutes = Math.round(nextInterval / 1000 / 60);
      } else {
        nextInterval = getNextInterval(old.interval || intervals.got, 3.5);
        minutes = Math.round(nextInterval / 1000 / 60);
      }

      await fetch("/api/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cardId: currentCard.id, result: choice, interval: minutes }),
      });

      setReviewData((prev) => ({
        ...prev,
        [currentCard.id]: {
          lastReviewed: now,
          interval: nextInterval,
          due: now + nextInterval,
        },
      }));

      setRevealed(false);
      setCurrentIdx((i) => i + 1);
    },
    [currentCard, reviewData]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!currentCard) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!revealed) setRevealed(true);
      }
      if (revealed) {
        if (e.key === "1") reviewCard("hard");
        else if (e.key === "2") reviewCard("okay");
        else if (e.key === "3") reviewCard("got");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentCard, revealed, reviewCard]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900 text-white">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!deck || dueCards.length === 0 || currentIdx >= dueCards.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">🎉 All Done!</h1>
          <p className="mb-8 text-lg opacity-90">No more cards due for review right now</p>
          <Link
            href="/decks"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-blue-600 hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={18} />
            Back to Decks
          </Link>
        </div>
      </div>
    );
  }

  const progress = ((currentIdx + 1) / dueCards.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-zinc-900 to-black text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4 backdrop-blur-sm">
        <Link href="/decks" className="text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-semibold">{deck.name}</h1>
          <p className="text-sm text-zinc-500">
            {currentIdx + 1} / {dueCards.length}
          </p>
        </div>
        <div className="w-5" />
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <div
            className={`relative min-h-[400px] rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 shadow-2xl transition-all duration-300 ${
              revealed ? "scale-[1.02]" : ""
            }`}
          >
            {/* Question */}
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-medium uppercase tracking-wider text-blue-400">
                  {currentCard.type === "cloze" ? "Fill-in-the-blank" : "Question"}
                </span>
                {currentCard.source && (
                  <span className="text-xs text-zinc-500 max-w-[50%] truncate">
                    Source: {currentCard.source.slice(0, 60)}
                  </span>
                )}
              </div>
              <p className="text-2xl font-medium leading-relaxed">{currentCard.question}</p>
            </div>

            {/* Answer */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                revealed ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="mb-6 rounded-xl bg-zinc-950/50 p-6 border border-zinc-700">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-emerald-400">
                  Answer
                </div>
                <p className="text-lg leading-relaxed text-zinc-200">{currentCard.answer}</p>
              </div>
            </div>

            {/* Reveal button */}
            {!revealed && (
              <button
                onClick={() => setRevealed(true)}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 font-semibold text-white hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <Eye size={20} />
                Show Answer
                <span className="ml-2 text-sm opacity-75">(Space / Enter)</span>
              </button>
            )}

            {/* Review buttons */}
            {revealed && (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => reviewCard("hard")}
                  className="group flex flex-col items-center gap-2 rounded-xl bg-red-600/20 border border-red-600/30 px-4 py-4 font-semibold text-red-400 hover:bg-red-600/30 transition-all"
                >
                  <span>Hard</span>
                  <span className="text-xs opacity-75">{formatInterval(intervals.hard)}</span>
                  <span className="text-xs opacity-50">(Press 1)</span>
                </button>
                <button
                  onClick={() => reviewCard("okay")}
                  className="group flex flex-col items-center gap-2 rounded-xl bg-orange-600/20 border border-orange-600/30 px-4 py-4 font-semibold text-orange-400 hover:bg-orange-600/30 transition-all"
                >
                  <span>Okay</span>
                  <span className="text-xs opacity-75">
                    {formatInterval(
                      getNextInterval(
                        reviewData[currentCard.id]?.interval || intervals.okay,
                        2
                      )
                    )}
                  </span>
                  <span className="text-xs opacity-50">(Press 2)</span>
                </button>
                <button
                  onClick={() => reviewCard("got")}
                  className="group flex flex-col items-center gap-2 rounded-xl bg-emerald-600/20 border border-emerald-600/30 px-4 py-4 font-semibold text-emerald-400 hover:bg-emerald-600/30 transition-all"
                >
                  <span>Got it!</span>
                  <span className="text-xs opacity-75">
                    {formatInterval(
                      getNextInterval(
                        reviewData[currentCard.id]?.interval || intervals.got,
                        3.5
                      )
                    )}
                  </span>
                  <span className="text-xs opacity-50">(Press 3)</span>
                </button>
              </div>
            )}
          </div>

          {/* Hint */}
          <p className="mt-4 text-center text-sm text-zinc-500">
            {revealed
              ? "Choose how well you remembered this card"
              : "Click or press Space to reveal the answer"}
          </p>
        </div>
      </main>
    </div>
  );
}
