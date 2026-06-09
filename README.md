# Blue Archive — Draft Tool

A lightweight desktop app for hosting **ban-pick drafts** in unofficial Blue Archive PvP competitions. Built with **React + Vite + Tauri** — ships as a single Windows `.exe` with no runtime dependencies.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Student roster** | Fetches the full student list from SchaleDB (Chinese names) on launch |
| **Ban zone** | 5 ban slots per side (attacker / defender) — drag & drop from the grid |
| **Pick zone** | 4 main + 2 support slots per side — enforces squad type (Main / Support only in correct slots) |
| **Visual feedback** | Banned students turn greyscale · Picked students turn purple in the grid |
| **Countdown timer** | Host sets duration (seconds), clicks Start — auto-counts down, resets on each round |
| **Player identity** | Name text boxes + drag-and-drop local image for player avatars |
| **Swap button** | Instantly swap attacker/defender names and avatars |
| **Filters** | Search by name, filter by Main/Support squad type and role |
| **Reset** | One-click full reset with confirmation modal |
| **Single EXE** | Tauri bundles everything into a ~5 MB installer — no Node/Rust needed to run |

---

## 🖥 Screenshot layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: BA Draft Tool                          [↺ 重置]         │
├─────────────────────────────────────────────────────────────────┤
│ [ATK BAN ×5]              禁用区              [DEF BAN ×5]      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Student avatar grid (scrollable, filterable)                  │
│   grey = banned  ·  purple = picked                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ [Player A] [M×4|S×2]    ⏱ 00:60  [⇄]   [M×4|S×2] [Player B]  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting started (development)

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [Rust](https://rustup.rs/) (stable toolchain)
- Windows: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) or Visual Studio with C++ workload
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) — already included on Windows 10/11

### Install

```bash
git clone https://github.com/YOUR_USERNAME/ba-draft-tool.git
cd ba-draft-tool
npm install
```

### Run in development

```bash
npm run tauri dev
```

### Build for Windows (produces installer EXE + MSI)

```bash
npm run tauri build
```

Output is in `src-tauri/target/release/bundle/`.

> **First time?** Generate icons before building:
> ```bash
> # Place a 512×512 PNG as app-icon.png in the project root, then:
> npm run tauri icon app-icon.png
> ```
> Or copy placeholder icons from the [Tauri examples repo](https://github.com/tauri-apps/tauri/tree/dev/examples/api/src-tauri/icons) into `src-tauri/icons/`.

---

## 📦 Release via GitHub Actions

Push a tag to trigger an automated Windows build:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow (`.github/workflows/build.yml`) will build and attach the installer to a GitHub Release draft.

---

## 🎮 How to use (host guide)

1. Launch the app — students load automatically from SchaleDB.
2. **Ban phase**: Drag a student card from the grid onto one of the ban slots (top row). The student turns greyscale in the grid.
3. **Pick phase**: Drag a student card from the grid onto one of the team slots (bottom row).
   - Main students (1XXXX IDs) → the 4 main slots only
   - Supporter students (2XXXX IDs) → the 2 support slots only
4. **Timer**: Enter seconds in the input box. Click **▶ 开始** to start countdown. Click again to pause. Click **↺** to reset.
5. **Player info**: Type player names in the text boxes. Click/drag a local image onto the circular avatar to set a profile picture. Use **⇄** to swap sides.
6. **Reset**: Click the **↺ 重置** button in the header to clear everything.

---

## 🗂 Project structure

```
ba-draft-tool/
├── src/
│   ├── components/
│   │   ├── AvatarSlot.jsx      # Droppable slot (ban or pick)
│   │   ├── BanZone.jsx         # Top ban row
│   │   ├── PlayerPanel.jsx     # Bottom team panel (one side)
│   │   ├── PickZone.jsx        # Bottom row layout
│   │   ├── ResetModal.jsx      # Confirmation dialog
│   │   ├── StudentCard.jsx     # Draggable card in grid
│   │   ├── StudentGrid.jsx     # Scrollable student roster
│   │   └── Timer.jsx           # Countdown timer
│   ├── hooks/
│   │   └── useDragContext.jsx  # Custom drag & drop context
│   ├── store/
│   │   └── draftStore.js       # Zustand global state
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── src-tauri/
│   ├── src/main.rs
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   └── icons/
├── .github/workflows/build.yml
├── index.html
├── package.json
└── vite.config.js
```

---

## 🔧 Configuration

### Change number of ban slots

In `src/store/draftStore.js`, edit:
```js
const MAX_BAN_SLOTS = 5; // change to desired count
```
And update `BanZone.jsx` slot rendering accordingly.

### Switch to English student names

In `App.jsx`, change the fetch URL:
```js
const STUDENTS_URL = "https://schaledb.com/data/en/students.json";
```

### Offline mode

To use without internet, pre-download the JSON and bundle it:
1. Save `students.json` into `src/assets/students.json`
2. In `App.jsx`, replace the `fetch()` with:
   ```js
   import rawStudents from "./assets/students.json";
   // then call setStudents(parseStudents(rawStudents)) directly
   ```
Student images will still need network access (or you can download and serve them locally).

---

## 📄 License

MIT — do whatever you want with it.
