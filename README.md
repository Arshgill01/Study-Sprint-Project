# 🚀 StudySprint

**Transform your study notes into smart flashcards with AI-powered spaced repetition.**

StudySprint is an intelligent flashcard generator that converts your PDFs, text files, and markdown notes into effective study materials using advanced AI. Built for students who want to study smarter, not harder.

## ✨ Features

### 🤖 AI-Powered Generation
- **Smart Flashcard Creation**: Upload any study material (PDF, TXT, MD) and get instant flashcards
- **Multiple Card Types**: Supports both Q&A and cloze (fill-in-the-blank) formats
- **Intelligent Summarization**: Auto-generates concise summaries of your study material
- **Source Tracking**: Each card includes reference to its source material

### 🧠 Spaced Repetition System
- **Science-Based Learning**: Implements proven spaced repetition algorithms
- **Smart Scheduling**: Cards reappear based on how well you know them
- **Review Tracking**: Complete history of your study sessions
- **Adaptive Intervals**: Hard (1 min), Okay (progressive), Got it (extended)

### 🎯 Beautiful & Intuitive UI
- **Modern Design**: Gradient backgrounds, smooth animations, glassmorphism effects
- **Fullscreen Review Mode**: Distraction-free Anki-style card review
- **Keyboard Shortcuts**: Space to reveal, 1/2/3 for ratings
- **Progress Tracking**: Visual progress bars and statistics
- **Mobile Responsive**: Works seamlessly on all devices

### 📚 Deck Management
- **Deck Library**: Organize all your flashcard decks in one place
- **Smart Naming**: AI suggests relevant deck names from your content
- **Quick Stats**: See cards due and total cards at a glance
- **Easy Deletion**: One-click deck removal with confirmation

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4o-mini
- **PDF Processing**: pdfjs-dist
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd study-sprint
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your-openai-api-key-here"
```

4. **Initialize the database**
```bash
npx prisma migrate dev
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**

Visit [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Creating a Deck
1. Go to the homepage
2. Upload a PDF, TXT, or MD file (or drag & drop)
3. Click "Generate Flashcards"
4. Choose a name from suggestions or enter your own
5. Click "Save Deck"

### Studying
1. Click "My Decks" in the navigation
2. Select a deck and click "Study"
3. Press Space/Enter to reveal answers
4. Rate your recall: 1 (Hard), 2 (Okay), 3 (Got it)
5. Cards reappear based on your ratings

### Managing Decks
- View all decks in the library with statistics
- Delete decks you no longer need
- See how many cards are due for review

## 🎨 Key Features Explained

### Anki-Style Review Interface
The fullscreen review mode provides:
- Clean, focused environment
- Large, readable cards
- Smooth reveal animations
- Color-coded difficulty buttons
- Progress tracking

### Smart Deck Naming
When you generate cards, the AI analyzes your content and suggests:
- Topic-based names from headings
- Summary-based names
- Contextual keywords

### Spaced Repetition Algorithm
- **Hard (1 min)**: Card reappears in 1 minute
- **Okay (2x)**: Interval doubles each time
- **Got it (3.5x)**: Interval increases by 3.5x

## 🏗️ Project Structure

```
study-sprint/
├── src/
│   └── app/
│       ├── page.tsx              # Homepage - create decks
│       ├── decks/
│       │   └── page.tsx          # Deck library
│       ├── review/
│       │   └── [deckId]/
│       │       └── page.tsx      # Fullscreen review mode
│       └── api/
│           ├── generate/          # AI flashcard generation
│           ├── deck/              # Deck CRUD operations
│           └── review/            # Review log tracking
├── prisma/
│   └── schema.prisma             # Database schema
└── README.md
```

## 🎯 Future Enhancements

- [ ] User authentication
- [ ] Deck sharing and collaboration
- [ ] Advanced statistics and analytics
- [ ] Export to Anki format
- [ ] Audio pronunciation for language learning
- [ ] Image occlusion cards
- [ ] Mobile apps (iOS/Android)
- [ ] Browser extension for quick card creation

## 📝 License

MIT License - feel free to use this project for learning and development!

## 🙏 Acknowledgments

- Inspired by Anki and modern spaced repetition research
- Built with amazing open-source tools
- Designed for students, by students

---

**Made with ❤️ for better studying**
