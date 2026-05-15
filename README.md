# Instagram Follower Tracker

A privacy-first, 100% client-side web application that allows users to upload their Instagram data exports to track followers, unfollowers, and analytics over time.

![IG Tracker UI](https://via.placeholder.com/800x400?text=Instagram+Follower+Tracker)

## 🌟 Overview

Instagram doesn't tell you who unfollowed you. Third-party apps that ask for your Instagram password are often scams, violate terms of service, and can get your account banned. 

**This app is different.** 

You download your official data export directly from Instagram and drop it into this web app. All processing happens locally in your browser. **Your data never leaves your device.**

## ✨ Features

- **🛡️ 100% Privacy Preserving:** No backend servers, no API calls, no databases in the cloud. Everything runs strictly in the browser using Web Workers and IndexedDB.
- **⚡ Blazing Fast Parsing:** Heavy data crunching is offloaded to a Web Worker, ensuring the UI never freezes, even when processing 500MB+ ZIP files.
- **📂 Multi-Format Support:** 
  - Drag-and-drop your raw `.zip` export directly.
  - Or upload individual `.json` or `.html` follower/following files.
- **📈 Timeline Analytics (Coming Soon):** Compare multiple data exports over time to see exactly *who* unfollowed you, *who* you aren't following back, and your net follower growth.
- **🌙 Dark Minimalist UI:** A premium, fully responsive interface built with Tailwind CSS v4.

## 🏗️ Architecture & Tech Stack

This project is built with modern, cutting-edge web technologies:

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 (using the new `@theme` system)
- **Local Database:** Dexie.js (IndexedDB wrapper)
- **Background Processing:** Native Web Workers
- **ZIP Handling:** JSZip
- **Data Validation:** Zod

For a deep dive into the architecture, state management, and file processing algorithms, see the `docs/` folder:
- [System Specs](docs/SYSTEM_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design Language](docs/DESIGN_LANGUAGE.md)

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Aebroyx/tracker-parser-web.git
   cd tracker-parser-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Get Your Instagram Data

1. Open Instagram on your phone or computer.
2. Go to **Settings & Activity** -> **Your Activity**.
3. Scroll down to **Download your information**.
4. Request a download. **Make sure to select JSON or HTML format.**
5. Once Instagram emails you the file, download the `.zip` archive.
6. Drag and drop that `.zip` file directly into this app!

## 📄 License

This project is open-source. Please see the LICENSE file for details.
