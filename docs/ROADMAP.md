# Roadmap — Lords of the Realms (working title)

Milestone ladder for the project. Work in small, independently verifiable increments. **Every
milestone has a Definition of Done (DoD)** — do not call a milestone complete until its DoD is
met and this file's status line is updated.

---

## Status

**M0 and M1.1 complete. Current milestone: M1.2 — economy turn resolution.**

Update this line whenever a milestone or sub-step completes.

---

## MoSCoW Scope (v1)

**Must have**
- Strategic layer: counties, economy loop (seasons, land use, food), population & happiness.
- Army recruitment (from population) and movement on the county map.
- Readable auto-resolve battles.
- Both win conditions (conquest + economic) and the turn-cap backstop.
- A basic AI opponent.
- 2–4 player live multiplayer with reconnection.

**Should have**
- Real-time tactical battles (attacker's Manual option).
- Lobby + matchmaking.
- The market (buy/sell resources).

**Could have**
- More counties / larger maps.
- Smarter AI with difficulty levels.
- Spectating live battles.

**Won't have (v1)**
- Mobile, 3D, campaign/story mode, modding, ranked matchmaking, 6–8 player lobbies.

---

## Milestones

### M0 — Repo scaffold ✅ DONE

Monorepo and toolchain so every later milestone has a foundation.

- [x] pnpm workspaces monorepo: `packages/shared`, `packages/client`, `packages/server`.
- [x] Client: Vite + React + Zustand + Pixi.js.
- [x] Server: Colyseus hello-world room (`@colyseus/core` + `@colyseus/ws-transport`).
- [x] `@lor/shared` wired up and importable by both client and server.
- [x] ESLint configured, including the determinism rule banning `Math.random` / `Date.now` /
  `new Date()` in `packages/shared/src/sim/**`.
- [x] Vitest configured and running.
- [x] The seeded PRNG utility exists in `@lor/shared` (`createRng`, mulberry32).

**DoD met:** `pnpm dev` serves the client (Vite :5173) which connects to a Colyseus room
(:2567); `pnpm test` passes (3 tests); `pnpm lint` passes; `pnpm build` type-checks all
packages and bundles the client. `CLAUDE.md` §10 updated with the real commands.

> Note: the `colyseus` meta-package was avoided because it pulls in `uWebSockets.js` from a git
> repo, which pnpm 11 blocks as an exotic subdependency. We use `@colyseus/core` directly.

### M1 — Single-player strategic vertical slice

A complete, polished 1–2h solo game with no real-time battles. Built in verifiable sub-steps.

- **M1.1 — Map & county data.** ✅ DONE — counties as typed TS modules in `@lor/shared`; a
  polygon map rendered on the Pixi canvas with `pixi-viewport` pan/zoom; hover highlight and
  click-to-select wired to a county-detail panel.
  *DoD met: the county map renders and is selectable — verified in-browser (Playwright).*
  Expanded post-M1.1: two **procedurally generated** (Voronoi) maps — a 12-county Small Realm
  and a 30-county Realm of England — chosen via a map-size match setting.
- **M1.2 — Economy turn resolution.** Seasons, land use (crops/pasture/fallow), fertility, food
  production/consumption in `shared/sim` as pure functions.
  *DoD: turn resolution has unit + snapshot tests; the determinism test passes.*
- **M1.3 — Population, happiness, taxes.** Population growth/decline, happiness drivers, taxes
  → coin, revolts.
  *DoD: tested; a player can run several turns and see population/happiness respond.*
- **M1.4 — Army recruitment & movement.** Recruit units (drawn from population), upkeep, move
  armies between counties on the map.
  *DoD: tested; armies recruit, cost population, and move.*
- **M1.5 — Auto-resolve battles & win conditions.** Readable auto-resolve with after-action
  report; conquest + economic win checks; turn-cap backstop.
  *DoD: tested; a game can be won both ways and ended by turn cap.*
- **M1.6 — Basic AI opponent.** AI runs its economy, recruits, and attacks via the normal order
  interface.
  *DoD: a full human-vs-AI game is playable start to finish in 1–2 hours.*

**Designer gate:** before starting M2, confirm the strategic loop is genuinely fun on its own.

### M2 — 2-player multiplayer

- Colyseus room holding the plain-TS authoritative state; Schema projection for sync.
- Simultaneous-turn submission; deterministic resolution of all players' orders.
- Live session with `allowReconnection` and state snapshots.

**DoD:** two browsers play a full game together; a mid-game disconnect/reconnect does not end
the game.

### M3 — 2–4 players + lobby

- Scale rooms to 2–4 players free-for-all.
- Lobby and matchmaking; create/join a game via a shareable link.

**DoD:** four players complete a free-for-all game from a shared link.

### M4 — Real-time tactical battles

- Attacker may choose **Manual** instead of Auto-resolve.
- Real-time field battles and castle sieges; server-authoritative, fixed timestep; Pixi battle
  canvas with interpolated rendering.

**DoD:** a manual battle can be fought to a result and its outcome feeds back into the strategic
game.

### M5+ — Polish & content

Polish, more counties, smarter AI, the market, spectating — pulled from "Should/Could have"
above as priorities allow.
