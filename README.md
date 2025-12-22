# Prism - OSINT Discovery Tool 🔍✨

A premium, aesthetically stunning web application for discovering digital footprints across the web. Find social media profiles using names, usernames, or faces with advanced OSINT (Open Source Intelligence) techniques.

![Built with Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8?style=for-the-badge&logo=tailwindcss)

## 🌟 Features

### Core Functionality
- **🔎 Text Search**: Find profiles by name or username across 27+ platforms
- **🖼️ Image Search**: Reverse image search (Coming Soon)
- **🧠 Smart Matching**: Automatically generates username variations
  - Removes spaces
  - Tries common separators (`.`, `_`, `-`)
  - Adds popular suffixes (`official`, `123`, `real`, `hq`)
- **⚡ Real-time Results**: Parallel checking across all platforms
- **📊 Category Grouping**: Results organized by platform type

### Supported Platforms (27+)

#### Social Media
- Instagram, Twitter/X, Facebook, TikTok, Snapchat, Reddit, Pinterest, Tumblr

#### Professional
- LinkedIn, GitHub, GitLab, Medium, Dev.to

#### Gaming
- Twitch, Steam, Xbox, PlayStation

#### Creative
- YouTube, Vimeo, SoundCloud, Spotify, Behance, Dribbble

#### Other
- Patreon, Telegram, Discord, Linktree

## 🎨 Design Features

### Premium UI/UX
- **Dark Mode**: Sleek dark gradient background (`#0a0a0f` → `#1a0a2e`)
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Neon Accents**: Cyan (`#00d9ff`), Purple (`#a855f7`), Pink (`#ec4899`)
- **Smooth Animations**: Framer Motion powered micro-interactions
- **Responsive**: Mobile-first design that works on all devices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Devansh-Bhasin/Prism.git
   cd Prism
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage

### Text Search
1. Click on **Text Search** mode (default)
2. Enter a name or username (e.g., "johndoe", "John Doe")
3. Click **Start Discovery**
4. View results organized by category

### How It Works
1. **Input Processing**: Your query is cleaned and normalized
2. **Variation Generation**: Creates up to 10 username variations
3. **Parallel Checking**: Sends HEAD requests to all platforms simultaneously
4. **Result Filtering**: Only shows profiles that exist (HTTP 200-399)
5. **Category Display**: Groups results by platform type

## 🏗️ Project Structure

```
prism/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Search API endpoint
│   ├── components/
│   │   └── ResultsDisplay.tsx    # Results UI component
│   ├── lib/
│   │   └── platforms.ts          # Platform definitions
│   ├── globals.css               # Design system & styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main landing page
├── public/                       # Static assets
├── package.json
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **Icons**: Lucide React

### Backend
- **Runtime**: Edge Runtime (for fast API responses)
- **API**: Next.js API Routes
- **HTTP Client**: Native Fetch API

## 🔒 Privacy & Ethics

### Important Notes
- This tool is for **legitimate OSINT research only**
- Respects platform rate limits with timeouts
- Does not store or log user searches
- Uses HEAD requests (minimal data transfer)
- No authentication bypass or scraping

### Ethical Use
✅ **Acceptable Uses**:
- Finding your own profiles
- Security research
- Background checks (with consent)
- Investigative journalism

❌ **Unacceptable Uses**:
- Stalking or harassment
- Doxxing individuals
- Unauthorized data collection
- Violating platform ToS

## 🎯 Roadmap

### Phase 1 (Current)
- [x] Text-based username search
- [x] 27+ platform support
- [x] Smart username variations
- [x] Premium UI with glassmorphism

### Phase 2 (Upcoming)
- [ ] Reverse image search integration
- [ ] Search history (local storage)
- [ ] Export results to CSV/JSON
- [ ] Confidence scoring
- [ ] More platforms (50+)

### Phase 3 (Future)
- [ ] Browser extension
- [ ] API for developers
- [ ] Advanced filters
- [ ] Profile comparison

## 📝 License

This project is for educational and research purposes. Use responsibly and ethically.

## 🙏 Acknowledgments

- Inspired by [Sherlock Project](https://github.com/sherlock-project/sherlock)
- Design inspiration from modern glassmorphism trends
- Built with ❤️ using Next.js and TailwindCSS

---

**⚠️ Disclaimer**: This tool is provided as-is for legitimate OSINT research. The developers are not responsible for misuse. Always respect privacy and platform terms of service.

**Made with 💎 by Prism Team**
