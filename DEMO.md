# 🎬 StudySprint Demo Guide

Quick walkthrough for presenting StudySprint at a hackathon.

## 🚀 Quick Start (< 2 minutes)

1. **Start the app**
```bash
npm run dev
```

2. **Open browser**: http://localhost:3000

## 🎯 Demo Flow (5 minutes)

### Part 1: Create a Deck (2 min)
1. **Show the beautiful homepage**
   - Point out the gradient background and clean UI
   - "StudySprint transforms your notes into smart flashcards"

2. **Upload a sample file**
   - Drag & drop a PDF or text file
   - Or use the Upload button
   - Sample files you can use:
     - Study notes (MD/TXT)
     - Textbook chapter (PDF)
     - Lecture slides (PDF)

3. **Generate flashcards**
   - Click "Generate Flashcards"
   - Show the loading animation
   - "AI analyzes your content and creates Q&A and fill-in-the-blank cards"

4. **Name your deck**
   - Modal pops up with smart suggestions
   - "AI suggests names based on your content"
   - Select a suggestion or type your own
   - Click "Save Deck"

### Part 2: Review Your Deck (2 min)
1. **Go to Deck Library**
   - Click "My Decks" in navigation
   - Show the beautiful card grid
   - Point out statistics (total cards, cards due)

2. **Start studying**
   - Click "Study" on a deck
   - Fullscreen Anki-style interface appears
   - "Dark theme for focused studying"

3. **Review cards**
   - Press Space to reveal answer
   - Show keyboard shortcuts (1, 2, 3)
   - "Spaced repetition: cards return based on difficulty"
   - Progress bar shows completion

4. **Complete session**
   - Finish all due cards
   - Show completion screen
   - Return to deck library

### Part 3: Features Overview (1 min)
1. **Key Features**
   - ✅ AI-powered generation (GPT-4)
   - ✅ Spaced repetition algorithm
   - ✅ Beautiful, modern UI
   - ✅ Keyboard shortcuts
   - ✅ PDF/TXT/MD support
   - ✅ Progress tracking
   - ✅ Deck management

2. **Tech Stack Highlight**
   - Next.js 16 + React 19
   - TypeScript for type safety
   - Tailwind CSS 4 for styling
   - SQLite + Prisma for data
   - OpenAI for AI generation

## 💡 Talking Points

### Problem We're Solving
"Students waste hours creating flashcards manually. StudySprint automates this with AI, so you can focus on learning, not card-making."

### Why It's Different
- **Instant**: Generate cards in seconds, not hours
- **Smart**: AI understands context and creates relevant cards
- **Effective**: Science-based spaced repetition
- **Beautiful**: Modern UI that students actually want to use

### Use Cases
- 📚 Exam preparation
- 🎓 Course material review
- 📖 Textbook studying
- 📝 Lecture note consolidation
- 🌍 Language learning

## 🎨 UI Highlights to Show Off

1. **Gradient backgrounds** - Modern, engaging design
2. **Glassmorphism effects** - Backdrop blur on headers
3. **Smooth animations** - Card reveals, progress bars
4. **Keyboard shortcuts** - Power user features
5. **Responsive design** - Works on all devices
6. **Dark mode review** - Easy on the eyes

## 📊 If Asked About Stats

- **Generation time**: ~5-10 seconds per deck
- **Card quality**: High relevance due to GPT-4o-mini
- **Max cards**: 20 per deck (configurable)
- **File support**: PDF, TXT, MD, up to 40 pages
- **Database**: SQLite (portable, fast)

## 🔮 Future Roadmap (If Asked)

- User authentication
- Deck sharing
- Export to Anki
- Mobile apps
- Browser extension
- Collaboration features
- Advanced analytics

## 🎤 Closing Statement

"StudySprint takes the busywork out of flashcard creation. Just upload your notes, and start studying smarter in seconds. It's like having an AI study buddy that knows exactly what you need to review."

---

**Pro Tips:**
- Keep a few sample PDFs ready to demo
- Pre-generate a deck so you can show instant results
- Emphasize the keyboard shortcuts during review
- Point out the beautiful UI/UX throughout
- Be ready to show the code if judges are technical
