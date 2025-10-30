import { NextRequest } from "next/server";
import puter from "puter";

type Flashcard = {
  id: string;
  type: "qa" | "cloze";
  question: string;
  answer: string;
  source?: { page?: number; text?: string };
};

type GenerateResponse = {
  summary: string;
  flashcards: Flashcard[];
};


function generateFallbackDeckNames(summary: string, rawText: string): string[] {
  const names: string[] = [];
  
  // Try to extract key topics from summary
  if (summary) {
    const summaryLines = summary.split(/\n/).filter(line => line.trim().length > 0);
    for (const line of summaryLines.slice(0, 3)) {
      // Extract first few meaningful words (not full sentences)
      const cleaned = line.replace(/^[•\-*\d.]+\s*/, '').trim();
      const words = cleaned.split(/\s+/).slice(0, 4).join(' ');
      if (words.length > 5 && words.length < 50 && !words.includes('?')) {
        names.push(words);
      }
    }
  }
  
  // Try to extract from first lines of raw text
  if (names.length < 3 && rawText) {
    const lines = rawText.split(/\n/).filter(l => l.trim().length > 10);
    for (const line of lines.slice(0, 5)) {
      const cleaned = line.trim().replace(/^[#*\-\d.]+\s*/, '');
      const words = cleaned.split(/\s+/).slice(0, 4).join(' ');
      if (words.length > 5 && words.length < 50 && !words.includes('?')) {
        names.push(words);
      }
      if (names.length >= 3) break;
    }
  }
  
  // Deduplicate and limit
  const unique = Array.from(new Set(names));
  
  // If still nothing useful, provide generic fallbacks
  if (unique.length === 0) {
    return ["Study Notes", "Flashcard Deck", "Learning Material"];
  }
  
  return unique.slice(0, 5);
}

function localFallbackGenerate(text: string, maxItems: number): GenerateResponse & { deckNameSuggestions: string[] } {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const bulletCount = Math.min(8, Math.max(3, Math.floor(maxItems / 2)));
  const bullets = sentences.slice(0, bulletCount).map((s) => `- ${s}`);
  const summary = bullets.length ? bullets.join("\n") : "- Summary unavailable.";

  const makeId = (i: number) => `local-${Date.now()}-${i}`;
  const pickClozeWord = (s: string) => {
    const words = s
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .split(/\s+/)
      .filter((w) => w.length > 4);
    words.sort((a, b) => b.length - a.length);
    return words[0] || null;
  };

  const cards: Flashcard[] = [];
  for (let i = 0; i < Math.min(maxItems, sentences.length); i++) {
    const s = sentences[i];
    const key = pickClozeWord(s);
    if (key) {
      const cloze = s.replace(new RegExp(key, "i"), "_____");
      cards.push({
        id: makeId(i),
        type: "cloze",
        question: cloze,
        answer: key,
        source: { text: s },
      });
    } else {
      cards.push({
        id: makeId(i),
        type: "qa",
        question: `What is a key detail from: "${s.slice(0, 80)}"?`,
        answer: s,
        source: { text: s },
      });
    }
  }

  return { 
    summary, 
    flashcards: cards,
    deckNameSuggestions: generateFallbackDeckNames(summary, text)
  };
}

export async function POST(req: NextRequest) {
  let textStr = "";
  let maxItemsNum = 20;
  try {
    const body = await req.json();
    const { text, maxItems = 20 } = body as { text?: string; maxItems?: number };
    textStr = text || "";
    maxItemsNum = Number(maxItems) || 20;

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
    }

    // Enhanced system prompt for better analysis
    const systemPrompt = `You are an expert educational content analyzer and flashcard creator. Your job is to:

1. Detect the content format: Is it already Q&A/quiz format, or raw study notes?
2. Create a concise, well-structured summary (6-10 bullet points) highlighting the main topics
3. Generate 3-5 SHORT, descriptive deck names based on the MAIN TOPIC (not questions)
4. Generate high-quality flashcards

**IMPORTANT: Content Format Detection**
- If the content is ALREADY in Q&A/quiz format (numbered questions with answers), PRESERVE the questions and extract clean answers
- If the content is raw study notes/paragraphs, CREATE new flashcards using best practices below

**For Q&A/Quiz Format Content:**
- Keep the original questions intact
- Extract the correct answer cleanly (remove letters like "a)", "b)", just keep the answer text)
- Use type "qa" for all cards
- NEVER create cloze cards from existing questions
- Example: "Answer: c) Nvidia" → answer should be just "Nvidia"

**For Raw Study Notes:**
- Use CLOZE deletion for definitions, formulas, key facts (replace important terms with "_____")
- Use Q&A format for explanations, processes, "why/how" questions
- Focus on ONE concept per card
- Cover the breadth of the material, not just the beginning

Deck Name Guidelines:
- Keep names SHORT (2-5 words maximum)
- Focus on the SUBJECT/TOPIC (e.g., "World Economics 2025", "Japan Politics", "Space Exploration")
- NEVER use questions or full sentences as deck names
- Make names descriptive and memorable

Flashcard Quality:
- Make questions specific and unambiguous
- Keep answers concise (1-2 sentences max)
- Extract actual text snippets as sources when possible

IMPORTANT: You MUST return valid JSON with this EXACT structure:
{
  "summary": "markdown-formatted summary with bullet points",
  "deckNameSuggestions": ["Short Topic Name 1", "Short Topic Name 2", "Short Topic Name 3"],
  "flashcards": [
    {
      "id": "unique-id",
      "type": "qa" or "cloze",
      "question": "the question or cloze text",
      "answer": "the answer or missing term",
      "source": { "text": "relevant excerpt from source" }
    }
  ]
}

Do NOT wrap the JSON in markdown code blocks. Return ONLY the raw JSON.`;

    const userPrompt = `Analyze the following study material and create ${maxItemsNum} effective flashcards:

${text.slice(0, 30000)}

IMPORTANT Instructions:
1. FIRST: Detect if this content is already Q&A/quiz format (numbered questions with "Answer:" lines)
   - If YES: Keep questions as-is, extract clean answers (remove "a)", "b)", "Answer:" prefixes)
   - If NO: Create new flashcards using cloze/Q&A best practices
2. Generate 3-5 SHORT deck name suggestions (2-5 words) based on the MAIN TOPIC
3. Distribute cards across the ENTIRE material, not just the start
4. Generate ${maxItemsNum} high-quality cards
5. Return ONLY valid JSON, no markdown code blocks`;

    // Use Puter.js to access GPT-4o for FREE
    const completion = await puter.ai.chat(userPrompt, {
      model: "gpt-4o",
      system: systemPrompt,
      temperature: 0.4,
    });

    // Puter returns the message directly
    const content = completion.message?.content || "{}";
    let parsed: GenerateResponse & { deckNameSuggestions?: string[] } | null = null;
    
    try {
      if (!content || typeof content !== 'string') {
        console.error('No content returned from Puter AI:', content);
        return new Response(JSON.stringify({ error: "No content from AI" }), { status: 500, headers: { "content-type": "application/json" } });
      }
      
      // Try to extract JSON from markdown code blocks if present
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      parsed = JSON.parse(jsonContent) as GenerateResponse & { deckNameSuggestions?: string[] };
      
      // Generate IDs if not present
      if (parsed?.flashcards) {
        parsed.flashcards = parsed.flashcards.map((card, idx) => ({
          ...card,
          id: card.id || `card-${Date.now()}-${idx}`,
        }));
      }
      
      // Ensure deckNameSuggestions exists and is valid
      if (!parsed.deckNameSuggestions || !Array.isArray(parsed.deckNameSuggestions) || parsed.deckNameSuggestions.length === 0) {
        // Generate sensible fallback names from the summary
        parsed.deckNameSuggestions = generateFallbackDeckNames(parsed.summary, textStr);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e, 'Content:', content);
      // fallback minimal structure
      parsed = { summary: "", flashcards: [], deckNameSuggestions: generateFallbackDeckNames("", textStr) };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    const anyErr = err as { status?: number; message?: string };
    const status = typeof anyErr?.status === "number" ? anyErr.status : 500;
    const message = anyErr?.message || "Generation failed";
    // Log server-side for debugging
    console.error("/api/generate error:", anyErr);
    
    // Puter.js is free and unlimited, but use fallback if needed
    const fallback = localFallbackGenerate(textStr, Math.min(maxItemsNum, 40));
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "x-generation": "local-fallback",
      },
    });
  }
}


