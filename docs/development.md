# Development

**English** · [简体中文](development.zh-CN.md)

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, TypeScript (strict), Tailwind CSS 4 |
| State | Zustand 5 with `persist` (localStorage) |
| Drag and drop | dnd-kit (pointer sensor, drag overlay) |
| Build | Vite 8 |
| Desktop shell | Tauri 2 (Rust, WebView2), NSIS installer |
| Quality | Biome (lint + format), `tsc`, Vitest |
| Package manager | pnpm (version pinned in `package.json` → `packageManager`) |

## Getting started

```bash
corepack enable          # or install pnpm another way
pnpm install
pnpm dev                 # http://localhost:1420
```

For the desktop app, install [Rust](https://rustup.rs) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) (on Windows: the MSVC build tools and WebView2), then:

```bash
pnpm tauri dev           # desktop window with hot reload
pnpm tauri build         # → src-tauri/target/release/bundle/nsis/*.exe
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm preview` | Vite dev server / production build / preview the build |
| `pnpm check` | Everything CI runs: `biome ci`, `tsc --noEmit`, `vitest run`, version consistency |
| `pnpm lint` / `pnpm format` | Biome check / Biome check with auto-fix |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm version:bump <patch\|minor\|major\|x.y.z>` | Bumps the version in `package.json`, `Cargo.toml` and `Cargo.lock` |

## Project layout

```
src/
├── App.tsx               # layout, roster loading, theme sync, update check
├── main.tsx
├── types.ts              # Board, SlotRef, Student, constants
├── lib/
│   ├── rules.ts          # ★ pure draft-rules engine (applyDrop, findViolations, …)
│   ├── schaledb.ts       # SchaleDB fetch, parse, cache, search
│   ├── legacy.ts         # migration of v1.x localStorage keys
│   ├── update.ts         # GitHub "new version" check
│   ├── avatar.ts, sound.ts, platform.ts
├── store/
│   ├── draft.ts          # board + players + undo/redo history (persisted)
│   ├── settings.ts       # user preferences (persisted)
│   ├── roster.ts         # student list, stale-while-revalidate cache
│   └── timer.ts          # deadline-based countdown
├── dnd/                  # DndContext root and drag/drop payload types
├── components/           # Header, BanBar, Roster, TeamPanel, Scoreboard, …
│   └── ui/               # Dialog, ContextMenu, Portrait, TypeBadges
├── hooks/                # keyboard shortcuts, board indexes
├── i18n/                 # zh.ts (source of keys) and en.ts
└── styles/index.css      # theme tokens (light/dark) and component classes
src-tauri/                # Tauri shell (Rust), config, capabilities, icons
scripts/                  # version.mjs, release-notes.mjs
.github/workflows/        # ci.yml, release.yml
```

## How the draft works

The board is plain data: student IDs (or `null`) in arrays.

```ts
interface Board {
  bans: { attacker: Slot[]; shared: Slot[]; defender: Slot[] };
  picks: { attacker: Slot[]; defender: Slot[] }; // always 6; 0–3 main, 4–5 support in 4+2 mode
  protected: Slot[];                               // 4
}
```

Every drag ends in one call, `applyDrop(board, source, target, studentId, ctx)` in `src/lib/rules.ts`:

1. It applies the move to a copy of the board. Pool → slot places the student; slot → slot swaps; protected → elsewhere copies; slot → pool clears.
2. It runs `findViolations()` on the board before and after.
3. If the move introduced a violation, it's rejected with that violation's code (shown to the user as a localised message). Otherwise the new board is committed and the previous one goes onto the undo stack.

The same functions power the green/red drop preview, the red highlight on illegal slots, and the "can't leave special rules" check. Because the rules are pure functions over plain data, they're unit tested in `rules.test.ts` without any UI.

Storing IDs instead of student objects means switching the name language updates every slot immediately, and saved state stays small.

## Persistence

| Key | Contents |
|---|---|
| `ba-draft:settings` | Preferences, ban counts, free and archived IDs |
| `ba-draft:match` | Board, players (names, avatar data URLs, scores), special-rules flag |
| `ba-draft:roster:<lang>` | Compact cached roster for offline use |

On first launch after upgrading, `lib/legacy.ts` reads the v1.x keys (`ba_draft_*`) so hosts keep their archive, free students, protected slots and ban configuration. The Tauri bundle identifier is unchanged (`com.badraft.tool`), so the WebView2 storage carries over.

## Adding a UI string

1. Add the key and Chinese text to `src/i18n/zh.ts`.
2. Add the English text to `src/i18n/en.ts`. TypeScript fails until every key exists.
3. Use `const t = useT(); t("my.key", { name })` in components, or `t()` from `src/i18n` outside React.

## Desktop shell notes

- `tauri.conf.json` reads its version from `../package.json`, so there's a single source of truth.
- `dragDropEnabled: false` is needed so HTML5 file drops (player avatars) reach the page on Windows.
- The CSP only allows SchaleDB (data and images) and the GitHub API (update check).
- `capabilities/default.json` grants only what the UI uses: the opener (external links) and fullscreen.
- Keep the npm `@tauri-apps/*` packages and the Rust `tauri*` crates on the same minor version. The Tauri CLI refuses to build when they differ. Update them together with `pnpm up "@tauri-apps/*" --latest` and `cargo update` in `src-tauri/`.

## CI/CD

Both workflows run on GitHub-hosted runners, which are free and unmetered for public repositories. They **never upload workflow artifacts**, so they don't use Actions artifact storage. The only storage involved is the dependency cache (pnpm store and Rust `target/`), which GitHub manages separately and evicts automatically.

### `ci.yml`, on every PR and push to `main`

| Job | Runner | Runs when | Time |
|---|---|---|---|
| Lint, typecheck, test, build | ubuntu | Always (except docs-only changes) | about 1 min |
| Check desktop shell (`cargo clippy`) | windows | Only if `src-tauri/`, `package.json` or the lockfile changed | about 3 min warm, longer cold |

Pushes that only touch Markdown or `docs/` don't run CI at all. Superseded runs on the same branch are cancelled.

### `release.yml`, when `package.json` changes on `main`

```
prepare ──► verify (ubuntu: pnpm check) ───────────────┐
        └─► build-windows (tauri build → draft release)┴─► publish (un-draft, deploy web)
                                                         └─► discard (delete draft if anything failed)
```

1. **prepare** reads the version and checks whether tag `v<version>` exists. If it does (for example after a dependency-only change to `package.json`), nothing else runs.
2. **verify** and **build-windows** run in parallel. The Windows job builds the NSIS installer, copies the portable exe, writes `SHA256SUMS.txt`, and uploads them straight into a **draft** GitHub Release. Release assets don't count as Actions storage.
3. **publish** runs only if both succeeded. It publishes the draft (marked *latest*, or *pre-release* for versions like `2.1.0-beta.1`) and pushes the web build to the `gh-pages` branch.
4. **discard** deletes the draft if verification failed, so a broken build never becomes a release.

Release notes combine the download table from `scripts/release-notes.mjs`, the matching section of `CHANGELOG.md`, and GitHub's auto-generated list of merged PRs and commits.

### Releasing

```bash
pnpm version:bump minor          # 2.0.0 → 2.1.0 (updates package.json, Cargo.toml, Cargo.lock)
# optionally add a "## [2.1.0]" section to CHANGELOG.md
git commit -am "chore: release v2.1.0"
git push                         # to main, directly or by merging a PR
```

Pre-releases (`pnpm version:bump 2.1.0-beta.1`) are published as GitHub pre-releases and don't update the web version or the in-app update notice. To retry a failed release, re-run the workflow from the Actions tab (it is idempotent) or use **Run workflow**.

### One-time repository setup

- **Settings → Pages**: source = *Deploy from a branch*, branch = `gh-pages` / root. This is only needed for the web version; the branch appears after the first release.
- **Settings → Actions → General → Workflow permissions**: the workflows request `contents: write` themselves, so the default read-only setting is fine.
