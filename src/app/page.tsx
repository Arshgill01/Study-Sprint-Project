"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Sparkles, BookOpen, X, Loader2 } from "lucide-react";
import Link from "next/link";

type Flashcard = {
  id: string;
  type: "qa" | "cloze";
  question: string;
  answer: string;
  source?: { page?: number; text?: string };
};


type Deck = {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: string;
};



export default function Home() {
  const [rawText, setRawText] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [suggestedNames, setSuggestedNames] = useState<string[]>([]);
  const [deckNameInput, setDeckNameInput] = useState<string>("");
  const [showNameModal, setShowNameModal] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);


  // Save the generated deck/cards after generate
  const saveDeck = useCallback(async (name: string, cards: Flashcard[]) => {
    if (!name || !cards.length) return;
    await fetch('/api/deck', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, cards: cards.map(c => ({
        question: c.question,
        answer: c.answer,
        type: c.type,
        source: c.source?.text || "",
      })) }),
    });
  }, []);

  // Only cards that are due for review now
  const handleFiles = useCallback(async (file: File) => {
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isText = file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md");

    if (isText) {
      const text = await file.text();
      setRawText(text);
      return;
    }

    if (isPdf) {
      const pdfjsLib = await import("pdfjs-dist");

      // Configure worker for Next.js bundling
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.mjs",
        import.meta.url
      ).toString();

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= Math.min(pdf.numPages, 40); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const text = content.items.map((it) => ("str" in it ? (it as { str: string }).str : "")).join(" ");
        fullText += `\n\n[Page ${i}]\n` + text;
      }
      setRawText(fullText);
      return;
    }

    // Fallback: read as text
    const text = await file.text();
    setRawText(text);
  }, []);

  const onDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) await handleFiles(file);
    },
    [handleFiles]
  );

  // Generate flashcards and show name modal
  const generate = useCallback(async () => {
    if (!rawText.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: rawText, maxItems: 20 }),
      });
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const errData = (await res.json()) as { error?: string; details?: string };
          errMsg = errData?.details || errData?.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = (await res.json()) as { summary: string; flashcards: Flashcard[]; deckNameSuggestions?: string[] };
      setGeneratedCards(data.flashcards || []);
      setSummary(data.summary || "");
      setFlashcards(data.flashcards || []);
      // Show modal to name the deck - API now always provides suggestions
      setSuggestedNames(data.deckNameSuggestions || ["Untitled Deck"]);
      setShowNameModal(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Generate failed:", msg);
      setSummary("");
      setFlashcards([]);
      alert(`Generation failed: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, [rawText]);

  const ready = !!rawText.trim();

  const handleSaveDeck = async () => {
    const name = deckNameInput.trim() || suggestedNames[0] || "Untitled Deck";
    await saveDeck(name, generatedCards);
    setShowNameModal(false);
    setDeckNameInput("");
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            StudySprint
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/decks" className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors">
              <BookOpen size={16} />
              My Decks
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-4xl font-bold text-gray-900">Create Your Study Deck</h1>
          <p className="text-lg text-gray-600">Upload your notes and let AI generate flashcards instantly</p>
        </div>

        <div className="grid max-w-6xl mx-auto grid-cols-1 gap-6 md:grid-cols-2">
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="flex min-h-[600px] flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">📄 Source Material</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Upload size={18} /> Upload File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,text/plain,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) await handleFiles(f);
                  }}
                />
              </div>
            </div>
            <div className="relative flex-1 overflow-auto rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm leading-relaxed text-zinc-700">
              {!rawText ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 text-zinc-400">
                  <Upload size={48} className="opacity-50" />
                  <div className="text-center">
                    <p className="text-lg font-medium">Drop your study material here</p>
                    <p className="text-sm">or click Upload to select a file</p>
                    <p className="mt-2 text-xs">Supports PDF, TXT, and Markdown</p>
                  </div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{rawText}</pre>
              )}
            </div>
            <button
              disabled={!ready || isLoading}
              onClick={generate}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating Flashcards...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Flashcards
                </>
              )}
            </button>
          </section>

          <section className="flex min-h-[600px] flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">✨ Generated Cards</h2>
              {flashcards.length > 0 && (
                <div className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
                  {flashcards.length} cards
                </div>
              )}
            </div>
            <div className="flex-1 overflow-auto">
              {summary ? (
                <div className="space-y-4">
                  <article className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                    <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-700">📝 Summary</div>
                    <div className="text-gray-800 whitespace-pre-wrap leading-relaxed">{summary}</div>
                  </article>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-zinc-700">Preview Cards:</div>
                    {flashcards.slice(0, 3).map((card) => (
                      <div key={card.id} className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow">
                        <div className="mb-2 text-xs font-medium uppercase text-indigo-600">
                          {card.type === "cloze" ? "Fill-in-the-blank" : "Q&A"}
                        </div>
                        <div className="mb-2 font-medium text-gray-900">{card.question}</div>
                        <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-900">
                          {card.answer}
                        </div>
                      </div>
                    ))}
                    {flashcards.length > 3 && (
                      <p className="text-center text-sm text-zinc-500">+ {flashcards.length - 3} more cards</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-zinc-400">
                  <Sparkles size={64} className="mb-4 opacity-30" />
                  <p className="text-lg font-medium">No flashcards yet</p>
                  <p className="text-sm">Upload a file and click Generate to get started</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Name Deck Modal */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900">Name Your Deck</h2>
              <button onClick={() => setShowNameModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <p className="mb-4 text-sm text-zinc-600">Choose a name for your flashcard deck</p>
            
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-700">Deck Name</label>
              <input
                type="text"
                value={deckNameInput}
                onChange={(e) => setDeckNameInput(e.target.value)}
                placeholder="Enter deck name..."
                className="w-full rounded-lg border-2 border-zinc-300 px-4 py-3 text-base focus:border-blue-500 focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveDeck()}
              />
            </div>

            {suggestedNames.length > 0 && (
              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-zinc-700">Suggestions</label>
                <div className="flex flex-wrap gap-2">
                  {suggestedNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => setDeckNameInput(name)}
                      className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      {name.length > 30 ? name.slice(0, 30) + "..." : name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowNameModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDeck}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Save Deck
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
