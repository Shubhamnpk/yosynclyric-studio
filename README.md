<p align="center">
  <img src="public/favicon.svg" alt="Yosync Studio Logo" width="120" height="120" />
</p>

# Yosync Studio

A modern, web-based application for creating and editing synchronized lyrics (karaoke-style) with precision timing and professional features.

## 🚀 Features

### Core Functionality
- **Precision Audio Waveform Editing** - Visual waveform display for accurate timing
- **Real-time Karaoke Preview** - Instant preview of synchronized lyrics
- **Word-level and Line-level Synchronization** - Fine-grained control over timing
- **Smart Mixed-Mode Sync** - Automatically switch between word and line sync for optimal results

### Professional Tools
- **High-quality Video (MP4) Rendering** - Export synchronized lyrics as video with multiple resolutions
- **ID3 Metadata Tagging** - Complete metadata management with cover art support
- **Multi-format Export** - LRC, SRT, VTT, and TXT formats supported
- **LRC File Import** - Import existing synchronized lyrics

### User Experience
- **Modern UI/UX** - Clean, intuitive interface built with shadcn/ui and Tailwind CSS
- **Fully Responsive Design** - Optimized for mobile, tablet, and desktop screens
- **Dark/Light Theme** - System preference detection with manual override
- **Real-time Collaboration** - Auto-save and backup functionality
- **Keyboard Shortcuts** - Efficient workflow with undo/redo support

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Audio Processing**: Web Audio API with waveform visualization
- **Video Rendering**: HTML5 Canvas with FFmpeg.js
- **Storage**: Encrypted local storage with backup system
- **Database**: [Convex](https://www.convex.dev/) for community-sourced, verified lyrics
- **Public API**: Real-time HTTP endpoints for lyrics discovery
- **Responsiveness**: Mobile-first architecture using Tailwind CSS breakpoints

## 📦 Installation

### Prerequisites
- Node.js (version 18 or higher)
- npm or pnpm package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/Shubhamnpk/synclyric-studio.git
   cd synclyric-studio
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Or using pnpm (recommended)
   pnpm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser** and navigate to `http://localhost:5173`

## 🎯 Usage

### Creating a New Project
1. Launch Yosync Studio
2. Click "New Project" on the dashboard
3. Upload your audio file (MP3, WAV, FLAC, etc.)
4. Add your lyrics text
5. Begin synchronizing with the audio

### Synchronization Modes
- **Word Mode**: Precise word-by-word timing
- **Line Mode**: Line-by-line synchronization
- **Mixed Mode**: Automatic switching between word and line sync

### Export Options
- **LRC**: Standard lyrics format
- **SRT**: Subtitle format
- **VTT**: Web video subtitle format
- **TXT**: Plain text format
- **MP4 Video**: High-quality video with synchronized lyrics

### Community Features
- **Publish to Yosync**: Share your verified synced lyrics with the community
- **Universal Search**: Search lyrics across Yosync Database and LRCLIB
- **Admin Review**: Community submissions are reviewed for quality and accuracy

## 🌐 Public API

Yosync Studio provides a public HTTP API to access verified community lyrics.

### Get Lyrics
Fetch lyrics by song details.
- **Endpoint**: `https://<your-convex-site-url>/get`
- **Method**: `GET`
- **Params**:
  - `track_name` (required)
  - `artist_name` (required)
  - `duration` (optional)

### Search Lyrics
Search the community database for songs.
- **Endpoint**: `https://<your-convex-site-url>/search`
- **Method**: `GET`
- **Params**:
  - `q` (required) - Search query for track title

## 📱 Browser & Device Support

### Desktop
- **Chrome** (Recommended)
- **Firefox**
- **Edge**
- **Safari**

### Mobile & Tablet
- **iOS** (Safari on iPhone/iPad)
- **Android** (Chrome on all Android devices)
- **Tablets** (iPadOS, Android Tablets)

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

### Project Structure
```
src/
├── components/          # React components
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── services/           # API services
└── config/             # Configuration files
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- Powered by [Vite](https://vitejs.dev/) for fast development and builds
- Audio processing powered by the Web Audio API
- Video rendering with HTML5 Canvas and FFmpeg.js

## 📞 Support

For support and questions:
- Create an [issue](https://github.com/Shubhamnpk/synclyric-studio/issues)
- Join our [Discord community](https://discord.gg/example) (coming soon)

---

**Yosync Studio** - Professional lyrics synchronization made simple. 🎵
