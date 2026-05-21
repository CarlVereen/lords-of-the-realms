# CLAUDE.md — Lords of the Realms (working title)

This file is the project constitution. Read it at the start of every session. Keep it concise —
if a line wouldn't change what you do, cut it. Detail lives in `docs/`.

---

# Part A — The Game (the north star)

Build the *game*, not a tech demo. When a technical choice and a design pillar conflict, the
pillar wins.

## 1. Pitch

A browser-based, medieval strategy game for 2–4 players, inspired by *Lords of the Realms*
(Impressions Games, 1994). One complete game lasts 1–2 hours. Simple, flat graphics. Faithful to
the original's spirit, with modernized UX. Link-shareable — no installs.

## 2. Player Fantasy

You are a medieval English lord. You steward your county's land and people, grow a population
into a trained army, and dominate rival lords — by the sword *or* by prosperity.

## 3. Design Pillars

Every feature is judged against these. If a feature serves none of them, it probably doesn't
belong.

1. **Meaningful decisions, not busywork.** Every interaction is a choice with a tradeoff.
   "Modernized UX" exists specifically to cut the 1994 original's tedious micromanagement.
2. **The county is alive.** Population, land, and seasons visibly react to how you rule.
3. **Two roads to victory.** The warlord and the prosperous lord are both valid ways to win.
4. **One good evening.** A complete, satisfying game finishes in 1–2 hours.

## 4. Core Gameplay Loop

One strategic turn:

assess county → allocate land use & labor → manage population (taxes / food / happiness) →
recruit & equip armies → move armies on the county map → submit turn → **server resolves all
players simultaneously** → battles auto-resolve or open as real-time → repeat.

## 5. Win Conditions

A game can be won two ways:

- **Conquest** — eliminate all rival lords / hold the map.
- **Economic** — reach a prosperity threshold (population + wealth + developed counties).

**Turn-cap backstop:** if no one has won by the turn limit (sized to the 1–2h target), the
highest composite score wins.

## 6. Match Shape

2–4 players, free-for-all. 1–2 hours per game. Live, synchronized sessions (all players online
together). Map of ~6–12 counties, sized to the time target. MVP supports 2 players including
human-vs-AI.

---

# Part B — How We Build It

## 7. Current Status

See [docs/ROADMAP.md](docs/ROADMAP.md) for the active milestone. **M0 (repo scaffold) is
complete. Milestone M1.1 — map & county data — is next.**

## 8. Tech Stack

| Layer | Choice |
|---|---|
| Language | TypeScript everywhere |
| Client UI | React + Zustand (UI/view state) |
| Client rendering | Pixi.js (strategic map + battle canvas) |
| Multiplayer server | Colyseus (Node.js, authoritative rooms) |
| Shared | `@lor/shared` — types + deterministic simulation + content data |
| Tooling | Vite, pnpm workspaces (monorepo), Vitest, ESLint + Prettier |

## 9. Repository Layout

```
packages/
  shared/   @lor/shared — types, deterministic sim, content data
  client/   React + Zustand + Pixi.js, built with Vite
  server/   Colyseus authoritative rooms
docs/       GAME_DESIGN.md, ROADMAP.md
```

**Dependency direction (hard rule):** `@lor/shared` imports nothing internal. `client` and
`server` both depend on `shared`, and **never import each other**.

## 10. Commands

Run from the repo root (pnpm workspace):

| Command | What it does |
|---|---|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Start client (Vite, http://localhost:5173) + server (Colyseus, ws://localhost:2567) |
| `pnpm build` | Type-check every package and bundle the client |
| `pnpm test` | Run the Vitest suite |
| `pnpm lint` | Run ESLint across the workspace |
| `pnpm format` | Format with Prettier |

Requires Node ≥ 20 and pnpm (install via `npm install -g pnpm` if missing).

## 11. Architecture — Core Principles

Never violate these.

- **Server-authoritative.** The server owns game state and **validates every incoming order**.
  Client-side prevention of illegal moves is UX only — never a security boundary.
- **Deterministic shared simulation.** All turn and battle logic lives in `@lor/shared`. Use a
  single **seeded PRNG, passed in as a parameter** — never module-level randomness. ESLint bans
  `Math.random`, `Date.now`, and `new Date()` inside `packages/shared/src/sim/**`. A determinism
  test asserts: same seed + same orders → identical state hash across two runs.
- **Netcode boundary.** The authoritative game state is **plain TypeScript** in `@lor/shared`.
  The Colyseus room *holds* that state and *projects* a `@colyseus/schema` view for network sync
  only. **Sim code never imports Colyseus.**
- **Data-driven content.** Unit stats, county data, costs, and balance numbers are **typed TS
  modules** (compiler-validated) — never hardcoded inside logic.
- **Fixed timestep** for the real-time battle loop.
- **Separation.** Pixi and React never mutate game state directly; they emit player intents.

## 12. Testing (mandatory)

Vitest. Every pure function in `shared/sim` has unit tests. Turn resolution has snapshot/golden
tests. **No sim logic is considered done without tests.**

## 13. Definition of Done

A change is done only when: `pnpm test` is green, `pnpm dev` shows the feature working,
determinism still holds, and the status line in `docs/ROADMAP.md` is updated.

## 14. Coding Conventions

- TypeScript `strict` mode; no `any`.
- Named exports (no default exports).
- Pure functions in `shared/sim` — no side effects, no I/O.
- Keep files small and focused.

## 15. Game Domain Glossary

Vocabulary from *Lords of the Realms* you cannot infer from code:

- **County** — a territory a lord controls; the unit of the strategic map.
- **Peasants** — your population. They work the land and are the source of soldiers.
- **Happiness / contentment** — peasant morale; driven by food, taxes, and war. Low happiness
  shrinks population and can trigger revolts.
- **Resources** — grain, livestock, wood, stone, iron, and coin.
- **Seasons & land use** — each county's land is allocated to **crops**, **pasture**
  (livestock), or left **fallow** (restores fertility). Sow in spring, harvest in autumn.
- **Army units** — peasants (cheap, weak), archers, pikemen, macemen, swordsmen, knights
  (mounted, strong). Soldiers are drawn *from* the population; weapons need iron + wood.
- **Castle** — a county's fortification; upgraded over time; defends in a **siege**.
- **Market** — buy and sell resources for coin.

## 16. Scope Discipline

MVP = the strategic layer. Battles auto-resolve until milestone M4. **Won't have in v1:** mobile,
3D, campaign/story mode, modding, ranked matchmaking, 6–8 player lobbies. Confirm with the user
before adding any system not already in `docs/ROADMAP.md`.

## 17. Do / Don't

**Do:** keep graphics simple and flat; prefer interesting decisions over extra clicks; work in
small, independently verifiable increments.

**Don't:** put game logic in the client; break determinism; entangle the sim with Colyseus; add
tedium; expand scope without asking.

## 18. More Docs

- [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) — full design: economy, army, combat, AI, UX.
- [docs/ROADMAP.md](docs/ROADMAP.md) — MoSCoW scope, milestones, Definition of Done per step.
