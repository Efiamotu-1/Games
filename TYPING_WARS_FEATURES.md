# Typing Wars — Feature Audit

This document catalogs every feature currently implemented for Typing Wars, split into two groups:

- **Part A** — features that were specified in one of the two BRDs (`readme.md`, the original single-player Typing Performance Tracker spec, and `brd`, the Party Arcade multiplayer platform spec) and are actually implemented and verified in code.
- **Part B** — features that exist in the codebase today but were never specified in either BRD: gameplay mechanics, UX polish, and infrastructure decisions added along the way.

A closing section lists notable BRD items that are **not** implemented, so this document also doubles as an honest gap list.

---

## Part A — Implemented BRD Features

### From `readme.md` (Typing Performance Tracker BRD)

| Feature | BRD Reference | Notes |
|---|---|---|
| Typing test with a random target passage | §7.1, §84 | `getRandomPassage()` in `passages.ts` |
| Typing interface: target text, user input, position, timer, live WPM, live accuracy | §7.2 | `TypingScreen` in `TypingWarsGame.tsx` |
| Timer starts on first keystroke, stops on completion | §7.3, §19, §84 | `handleChange`: `setStartedAt(Date.now())` on first char |
| No-Backspace Mode | §7.5, §96 | Backspace/Delete `preventDefault()`'d; correction attempts still counted |
| Character accuracy calculation | §7.6 | `scoreAttempt()` in `scoring.ts` |
| Word accuracy, single-letter words counted as full words | §7.6 | Whole-word string comparison in `scoreAttempt()` |
| Error counts: incorrect/missing/extra chars, incorrect words | §7.6 | `AttemptResult` fields |
| Standard WPM formula: (chars ÷ 5) ÷ minutes | §7.7 | `scoring.ts` |
| Raw WPM and Net/Corrected WPM shown separately | §7.7 | `rawWpm` vs `wpm` |
| Results screen: WPM, accuracy, words/chars, duration, backspaces, corrections, mode | §7.8 | `ResultsScreen` in `TypingWarsGame.tsx` |
| Evidence system: unique attempt ID, timestamp, stated WPM methodology | §8 | `makeAttemptId()`, results screen footer |
| Performance history, sortable (fastest / most accurate / most recent) | §9 | `HistoryScreen` |
| Personal record: fastest WPM | §12 | `personalBest` calc + "🏆 New Personal Record!" banner |
| Shareable results summary (score, accuracy, conditions, ID); results not editable post-completion | §13, §20 | Clipboard copy in `ResultsScreen`; `finished.current` guard blocks re-scoring |
| Test modes explicitly labeled (Standard / No Backspace) | §14 | `modeLabel()` |
| Immediate keystroke response, no debounce | §15 | Live stat updates on every change |

**Known partial coverage:** only "fastest WPM" is tracked as a personal record; the BRD's other record categories (highest accuracy, fastest ≥95% accuracy, best blind score, etc.) are not implemented.

### From `brd` (Party Arcade BRD)

| Feature | BRD Reference | Notes |
|---|---|---|
| All players race the same passage | §9 | `room.passage` set once by host/rematch, shared by all |
| Metrics: WPM, accuracy, completion time, correct/incorrect chars, backspaces | §9 | `RaceResult` / `AttemptResult` |
| Mode: Normal | §9 | `DEFAULT_RACE_MODE` |
| Mode: No Backspace | §9 | Verified in `handleKeyDown` across multiplayer screens |
| Mode: Blind Typing | §9 | Implemented as "No Peek" — see note below |
| Mode: Sudden Death | §9 | Verified: last-typed char mismatch immediately eliminates the player |
| Winner via combination of speed + accuracy | §9 | `raceScore(wpm, accuracy)` composite ranking |
| Lobby: room code, invite link, player list, avatars/colors, ready status, host start control | §7 | `LobbyScreen.tsx` |
| Real-time sync, server-maintained authoritative state | §8 | Supabase Postgres + Realtime (`useRoom`, `useRaceProgress`) |
| Room creation, room codes, player joining | §28 (MVP) | `roomApi.ts` |
| Players join without accounts | §1, §24 | Nickname + generated ID only |
| Scoreboard / rematch / session results | §28 (MVP) | `resetRoomForRematch`, results screens |
| Server-authoritative scores/timers (partial) | §26 | Client computes, server stores; DB-level round guard prevents duplicate writes |
| Synchronized start timestamp | §26 | Server-set `startedAt`, all clients count down to the same value |

**Note on "Blind Typing":** the BRD names this mode but never defines its mechanic. What's implemented is "No Peek" — the passage is blurred and only revealed while a player holds down a peek button. This satisfies the mode in spirit but the specific interaction is an original design choice (see Part B).

**Note on Lobby host controls:** only "Start Game" is implemented. "Select game," "Remove player," "Restart game," and "End room" (all listed in §7) are not implemented.

---

## Part B — Implemented Features Not in Either BRD

### Gameplay mechanics beyond spec

- **Elimination Rounds tournament mode** — a full round-based tournament format with no BRD precedent. Everyone races the same passage under a host-configurable timer (10s–10min); when time's up, last place (by `raceScore`) is eliminated; this repeats until one champion remains. (`EliminationTournament.tsx`)
- **"No Peek" hold-to-reveal mechanic** — the specific interaction behind "Blind Typing": the passage stays blurred by default and is only revealed while actively holding a button (pointer down/up/leave/cancel handling for mouse and touch parity). Neither BRD specifies any UI for blind typing. (`PeekablePassage.tsx`)
- **Composite `raceScore` formula** — `wpm × (accuracy ÷ 100)`. The BRD only says "combination of speed + accuracy," with no formula. (`scoring.ts`)
- **Spectator view for eliminated tournament players** — eliminated players can keep watching the remaining rounds' live progress. (`SpectatorView` in `EliminationTournament.tsx`)
- **Did-not-finish ranking fallback** — players who never complete a race are still ranked, by characters typed. Not a BRD requirement, but necessary for the feature to work correctly.

### UX / polish additions

- **Synced 3-second countdown before every race/round starts** — all players see the same countdown, driven by a shared server timestamp. (`RaceCountdown.tsx`)
- **Tap-to-open mode info tooltips** — an `(i)` icon next to every mode toggle and in-race badge opens a plain-language explanation. Built mobile-first (tap, not hover). (`ModeInfoButton.tsx`, `ModeBadge.tsx`)
- **In-race mode badges** — active modes and elimination count shown as chips in the race header during play, not just in the lobby.
- **Shareable invite link with clipboard copy + "Link copied!" feedback** — the BRD asks for "a shareable invitation link" as a lobby requirement, but the specific clipboard-copy UX is additive.
- **Live opponent progress bars** — colored dot, nickname, live progress %, live WPM, and a finish/elimination icon (🏁/💀) for every player during a race.
- **Mobile input correctness fixes** — `autoCorrect`/`autoCapitalize`/`autoComplete` disabled and spellcheck off on the typing input; tap-anywhere-on-passage to focus; refocus-trap on blur so the mobile keyboard doesn't dismiss unexpectedly. None of this is mentioned in either BRD.
- **Low-time warning color** — the round countdown turns red under 10 seconds remaining.
- **Dedicated "💀 Eliminated" full-screen state for Sudden Death** in standard (non-tournament) races, distinct from the tournament spectator view.

### Infrastructure / architecture additions

- **Supabase (Postgres + Realtime) as the concrete backend** — the BRD only lists "potential technology" abstractly (WebSockets/WebRTC/a real-time backend service); Supabase, the schema design, and RLS policies are all implementation decisions beyond the BRD's scope.
- **Room-scoped persistent leaderboard** — a `room_leaderboard` table that accumulates every race/tournament result tied to a room, separate from the BRD's "Session Scoreboard" concept (which describes cross-game point accumulation with streaks/comeback bonuses — not what's implemented).
- **Dual leaderboard systems** — solo attempts live in `localStorage`; multiplayer results live in Supabase. This split isn't discussed in either BRD.
- **Client-side routing via the History API** — real URLs (`/play/:gameId/solo`, `/play/:gameId/lobby?room=X`, `/play/:gameId/race?room=X`) with working browser back/forward. Neither BRD specifies a routing scheme.
- **Session-scoped player identity that survives refresh** — implements the BRD's reconnection requirement (§25) via `sessionStorage` keyed per room code, but only for same-tab/refresh reconnection, not cross-device.
- **Pluggable multi-game architecture** — a `GameDefinition` registry with 10 additional game slots already stubbed out (`available: false`) for future Party Arcade games, beyond what either BRD asked for as code architecture.
- **Throttled progress writes** — live WPM/progress updates are rate-limited to every 250ms to avoid flooding the database, a performance detail not specified anywhere.

### Solo-mode-specific additions

- **"Fewest Corrections" sort option** in solo history, beyond the BRD's listed sort options (fastest / most accurate / most recent).
- **Summary tiles (Avg WPM, Best WPM, Avg Accuracy)** above the sortable history list — a lightweight stand-in for the BRD's much larger §10 Statistics Dashboard spec (trend graphs, standard deviation, correction rate), which is not implemented.
- **Medal emoji ranking (🥇🥈🥉)** for top 3 results, in both solo history and multiplayer leaderboards/results.
- **"Retry Same Settings" button** on the solo results screen.

---

## Notable BRD Items Not Implemented

Listed for completeness, so this document also serves as a gap list.

**From `readme.md`:**
- Literal "don't look at the keyboard" blind-mode verification (current Blind Mode is honor-system only)
- Keystroke-level timestamp logging
- Error/key-confusion analysis (e.g. "i → o" mistake patterns)
- Certificates
- Anti-cheat (paste detection, script-input detection)
- Cryptographic result hash (current attempt IDs are short random strings, not verifiable hashes)
- Full Statistics Dashboard (WPM/accuracy trend over time, standard deviation, correction rate)
- Personal record categories beyond fastest WPM

**From `brd`:**
- Lobby host controls: "Remove player," "Restart game" (distinct from rematch), "End room"
- Room passwords, room expiration, enforced max player counts
- Cross-game session scoreboard with streaks and comeback bonuses
- Session finale with per-category awards (Fastest, Typing Champion, etc.)
- Custom passages/games
- All other 9 Party Arcade games besides Typing Wars
