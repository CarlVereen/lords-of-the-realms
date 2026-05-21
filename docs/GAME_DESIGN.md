# Game Design — Lords of the Realms (working title)

The full design. `CLAUDE.md` is the summary; this is the detail. When this document and a Design
Pillar conflict, the pillar wins (see `CLAUDE.md` §3).

Numbers in this document are **starting points for tuning**, not final balance. All of them live
in typed TS content modules (`CLAUDE.md` §11, "Data-driven content") so they can be changed
without touching logic.

---

## 1. Economy Loop

The economy is the heart of the strategic layer and must be fun on its own (designer gate, see
`docs/ROADMAP.md` M1).

### Seasons

A year is four turns: **Spring, Summer, Autumn, Winter**. The season changes what a turn is
about:

- **Spring** — sow crops; the harvest size is committed here.
- **Summer** — growth; livestock breed; building progresses.
- **Autumn** — harvest crops; the big food intake.
- **Winter** — food is consumed, little is produced; the lean season you must plan for.

### Land use

Each county has a fixed number of **land tiles** (or land units). Each turn you allocate them:

- **Crops** — produce grain at harvest. Yield depends on the tile's **fertility**.
- **Pasture** — feeds **livestock**, which provide food and breed slowly.
- **Fallow** — produces nothing but **restores fertility**. Over-farming a tile drops its
  fertility; this is the central land tradeoff.

This is a Pillar #1 decision: crops now vs. fertility later, food vs. pasture growth.

### Food

- Food comes from **grain** (harvest) and **livestock**.
- Every peasant consumes food each turn. A county's **food balance** = production − consumption.
- A **granary** stores surplus across seasons; running out in winter causes starvation
  (population loss + happiness hit).

### Population & happiness

- **Population** grows when peasants are well-fed and happy; shrinks when starving or unhappy.
- **Happiness / contentment** drivers: food security (+), low taxes (+), high taxes (−), war and
  losses (−), being conquered (−).
- **Revolt:** sustained low happiness causes peasants to leave or revolt, costing population and
  potentially destabilizing a county.

### Taxes & the market

- **Taxes** convert population into **coin** but cost happiness. The core money tradeoff.
- The **market** lets you buy/sell grain, livestock, wood, stone, iron for coin. Prices should
  move enough that hoarding vs. trading is a real decision.

---

## 2. Army System

Armies are expensive in a way that matters: **soldiers are drawn from the population.** Recruiting
a unit removes workers from your county's labor pool. A big army means a weaker economy — this is
deliberate and central.

### Units

Rough roles (stats are tuning placeholders):

| Unit | Source cost | Role |
|---|---|---|
| Peasants | Population only | Cheap, weak, expendable levy |
| Archers | Population + bows (wood) | Ranged; strong vs. unarmored |
| Pikemen | Population + iron/wood | Anti-cavalry; strong vs. knights |
| Macemen | Population + iron | Anti-armor infantry |
| Swordsmen | Population + iron | Solid all-round infantry |
| Knights | Population + iron + horses | Mounted; powerful; expensive |

### Weapons & upkeep

- Weapons are crafted from **iron + wood** (a blacksmith/workshop converts resources).
- Units have **upkeep** (food and/or coin) each turn — a standing army is a continuous cost, not
  a one-time purchase. This pressures players toward decisive wars over endless buildup.

### Counters

Units form a soft rock-paper-scissors (e.g. pikemen beat knights, archers soften infantry,
knights run down archers). Counters make army composition a real decision and make the M4
real-time battles tactical.

---

## 3. Combat

### Auto-resolve (MVP — used until M4)

For the MVP, all battles auto-resolve instantly. The formula must be **readable**: a player who
loses must see *why*, so a loss feels fair, not random.

- Each side gets a **combat score** from unit composition, counters, numbers, and modifiers
  (terrain, castle/siege defense bonus, attacker/defender).
- The seeded PRNG adds only **small variance** — it nudges outcomes, never dominates them.
- Output an **after-action report**: each side's score, the casualties, the deciding factors
  ("their pikemen broke your knights"). This report is part of the feature, not optional polish.

### Real-time tactical battles (M4)

In M4 the attacker may choose **Manual** instead of Auto-resolve. Manual battles are real-time:

- **Field battles** and **castle sieges**.
- Server-authoritative, simulated on a **fixed timestep**; the client renders interpolated state
  on the Pixi battle canvas.
- Because sessions are live, a manual battle is a shared moment — keep battles short (target a
  couple of minutes) so the other players' wait stays acceptable.

---

## 4. AI Opponent

Required from milestone M1.6 so single-player has a real opponent.

The MVP AI is **basic but competent** — not clever, just non-broken:

- Runs its own economy: allocates land, manages food, keeps happiness from collapsing.
- Recruits an army proportional to its resources.
- Attacks weak neighbors; defends when threatened.
- Uses the same order interface as a human player (no cheating with hidden information for v1).

Smarter AI (difficulty levels, planning) is post-v1.

---

## 5. Multiplayer Resilience

Games are 1–2 hours and live. A dropped connection must not end the game.

- **Reconnection:** Colyseus `allowReconnection` gives a disconnected player a grace window to
  rejoin. While they are gone, their turn either uses their submitted orders or a safe default
  (repeat last turn / hold).
- **Snapshots:** the server persists periodic authoritative state snapshots so a room can recover.
- **No save-format stability during development** — the state shape changes freely until v1; do
  not build migration code yet.

---

## 6. Modernized UX — Anti-Tedium Rules

Design Pillar #1 in practice. "Modernized" means *less clicking, clearer decisions* — not new
systems.

- **Sensible defaults** — a new turn starts from a reasonable allocation, not a blank slate.
- **"Repeat last turn"** — one click to carry forward last turn's land/labor allocation.
- **Projected outcomes** — tooltips show the expected result before you commit ("expected
  harvest: ~X grain", "this tax rate: −Y happiness").
- **Autosave** every turn; **in-turn undo** before you submit.
- **Group / percentage management** — never per-peasant micro. Allocate by share, not by unit.
- **Clear feedback** — the after-action report, happiness change reasons, food warnings are all
  surfaced plainly.

The test for any UX feature: does it remove a tedious click, or clarify a decision? If neither,
cut it.
