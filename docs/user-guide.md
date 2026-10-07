# User guide

**English** · [简体中文](user-guide.zh-CN.md)

This guide is for tournament hosts running a draft with BA Draft Tool.

## Screen layout

| Area | What it's for |
|---|---|
| **Header** | Undo/redo, special rules, Free/Protected sidebar, archive, round and full reset, language, theme, fullscreen, settings |
| **Ban bar** | Attacker bans (left), shared bans (centre, gold), defender bans (right) |
| **Roster** | Every released student, with search and filters |
| **Free & Protected sidebar** | Protected slots and the free-student list |
| **Team panels** | Player avatar and name, team mode toggle, 6 pick slots per side |
| **Scoreboard** | Scores, side swap and the pick timer |

## Drafting

**Drag** a student from the roster (or from the sidebar) onto a slot. While you drag, every slot shows whether it accepts that student: **green** means it fits, a dimmed slot means it doesn't. Dropping on a red slot shows a message explaining why.

| Action | How |
|---|---|
| Ban or pick | Drag from the roster onto a slot |
| Move or swap | Drag a student from one slot onto another. If the target is occupied, the two swap. |
| Remove | Drag the student back onto the roster, **right-click** the slot, or hover and click **×** |
| Undo / redo | `Ctrl+Z` / `Ctrl+Shift+Z` (or `Ctrl+Y`), or the arrow buttons in the header |

Banned students turn grey in the roster and can't be dragged. Picked students get an **ATK**/**DEF** band in their side's colour.

### Rules enforced in normal mode

- A student can only be banned once (across attacker, defender and shared bans).
- A banned student can't be picked.
- A student can only be picked once, by either side.
- In **4+2** mode, slots marked **M** take Strikers only and slots marked **S** take Specials only. Switch a side to **6 any** to allow any mix.
- Students in **protected** slots can never be banned, not even with special rules on.

### Team modes

Each side has a `4+2` / `6 any` toggle. Switching from 6 generic slots to 4+2 rearranges the team so Strikers fill the main slots and Specials the support slots. Anything that still doesn't fit is highlighted in red.

### Free students

Free students (★) can be picked by both sides, picked while banned, and placed in any slot. Add them by searching in the sidebar, or right-click a student and choose **Mark as free student**. By default this is Shiroko (Swimsuit), as in v1.

### Protected slots

Drag a student into one of the four protected slots in the sidebar, or right-click a student and choose **Add to protected**. Protected students can't be banned. Dragging a protected student into a team copies them, so they stay protected. Protected slots survive both kinds of reset.

### Special rules

**Special rules** lets any student go into any slot. Use it for exhibition matches or to fix an unusual situation. While it's on, slots that would be illegal under the normal rules glow red. You can only turn special rules off once the board is legal again; otherwise the app tells you what's blocking it.

## Between games

| Button | Clears | Keeps |
|---|---|---|
| **Next round** | Each side's own bans, both teams | Shared bans, scores, names, protected slots |
| **Reset all** | All bans, both teams, the timer, scores | Names, avatars, protected slots, settings |

Both can be undone with `Ctrl+Z`. Use **⇄** in the scoreboard to swap the players (names, avatars and scores) between sides.

## Scoreboard and timer

- Click a score to type a value, or hover and use **+**/**−**.
- Set the timer length in seconds, then press **Start** (or `Space`). Pausing and resuming continues from where it stopped.
- The display turns gold at 30 s and red at 10 s. It beeps for the last 5 seconds and sounds an alarm at zero. Sounds can be turned off in settings.
- `R` resets the timer.

## Players

Type a name above each team. Click the round avatar (or drop an image file onto it) to set a picture. Avatars are resized and saved, so they're still there after a restart.

## Roster filters

- **Search** matches the localised name, the internal English name, the student ID and SchaleDB nicknames (`Ctrl+F` focuses it, `Esc` clears it).
- **Striker / Special**, **role**, **attack type** and **armor type** filters. Click several roles or types to combine them.
- **Hide banned** / **Hide picked** to shrink the pool as the draft goes on.
- Use the slider to change card size.

### Archive

Right-click a student and choose **Move to archive** to hide them from the roster entirely, which is useful for students that are never allowed. Open **Archive** in the header to search the archive or restore students.

## Settings

| Setting | Notes |
|---|---|
| Interface language | 中文 / English. Also toggled by the 中/EN button in the header. |
| Theme | System, light or dark |
| Student name language | Which SchaleDB translation to use for names |
| Server | Only show students released on JP, Global or CN |
| Bans per side / shared bans | 0–10 per side, 0–80 shared |
| Timer sounds | On or off |
| Student data | Shows when the roster was last updated; **Refresh** fetches it again |

## Keyboard shortcuts

| Key | Action |
|---|---|
| `Space` | Start / pause timer |
| `R` | Reset timer |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |
| `Ctrl+F` | Focus search |
| `F11` | Fullscreen |

## Streaming tips

- Use fullscreen (`F11`) and capture the window in OBS. The dark theme suits most overlays.
- The web version can also be used as an OBS *Browser Source*, but it has its own saved data, separate from the desktop app.

## Offline use and data

The roster is cached after the first successful load. If SchaleDB is unreachable, the app uses the cached data and shows an **Offline** badge. Student portraits are loaded from SchaleDB and cached by the browser engine.

All data is stored locally (WebView2 storage for the desktop app, browser storage for the web version). Nothing is sent anywhere except requests to SchaleDB for student data, and a once-a-day version check against GitHub in the desktop app.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Couldn't load student data" | Check that `schaledb.com` is reachable, then click **Retry** |
| A new student is missing | Settings → **Refresh data**, and check the **Server** setting |
| Can't drop a student | Read the message at the top of the window. Turn on **Special rules** if you really want to. |
| Can't turn off special rules | Fix the slots highlighted in red first |
