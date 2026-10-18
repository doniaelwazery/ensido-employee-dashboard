# Ensido Employee Dashboard (prototype)

A clickable React prototype of the Ensido **employee dashboard**, built from the Figma design. It runs fully in the
browser on sample data, with no backend or API calls.

- **Live:** https://ensido-employee-dashboard.vercel.app
- **Figma:** [Employee Dashboard — Ensido Style](https://www.figma.com/design/JCH5SdrRowHjaWCvS93ser/Ensido-2025-2026?node-id=29211-17625): frames *Typical* `29211:17626` and *New Employee (empty states)* `29220:21367`
- **Taking this to production?** Read **[HANDOFF.md](HANDOFF.md)** first.

## Stack

- React 19, TypeScript, Vite 8
- Tailwind CSS v4. Design tokens are in `src/index.css` (`@theme`), taken from the Ensido Figma variables.
- No UI, router or state library. Poppins font; icons are inline SVG or files in `public/assets/`.

## Getting started

Node `^20.19.0 || >=22.12.0` (`.nvmrc` → 22).

```bash
npm ci
npm run dev        # → http://localhost:5173
npm run lint       # oxlint
npm run build      # type-check + production build → dist/
npm run preview    # serve dist/ locally
npm run deploy     # build + deploy to the live link (see HANDOFF.md §7)
```

## Files

```
src/main.tsx                       entry: global CSS + motion observer
src/App.tsx                        app shell: Sidebar + TopBar + page (signed-in employee is set here)
src/components/                    Sidebar (employee menu), TopBar, PageTitle
src/pages/DashboardPage.tsx        page: scenario + loading state, grid layout
src/pages/dashboard/
  shared.tsx                       tones, goal statuses, icons + small building blocks (Card, Empty, Ring, Bar, Skel…)
  Hero.tsx                         navy hero: greeting, stat tiles, Latest Result card (tilt), cursor light, count-up
  FormsCard.tsx                    Evaluation Forms to Fill: countdown, 30-day deadline timeline, other open rounds
  NotificationsCard.tsx            Latest Updates (needs-action first, unread state, grouped items)
  GoalsCard.tsx                    My Goals: progress ring, filter tiles, goal rows
  PeopleCards.tsx                  My Managers and Position + Policy Updates
  CompetencyCard.tsx               Latest Round Competency Scores (Radar / Bars toggle)
  HistoryCard.tsx                  Score History line chart + list
  DistributionCard.tsx             Score Category Distribution donut
  PrototypeControls.tsx            floating "Prototype · Scenarios" panel (prototype only)
src/data/dashboard.ts              all sample data + types (DashData) + the 4 score categories
src/index.css                      design tokens + all animation CSS
src/motion.ts                      starts chart animations when they scroll into view
scripts/deploy.mjs                 build + Vercel deploy
```

## Data and scenarios

All content comes from `DASHBOARD[scenario]` in `src/data/dashboard.ts`. `DashData` describes the shape, so it maps
1:1 to what an API would return.

| Scenario | URL | Shows |
|---|---|---|
| Typical | `/` | The Figma *Typical* frame |
| New employee | `/?scenario=new` | Empty states for every section (Figma *New Employee* frame) |
| Heavy use | `/?scenario=busy` | Lots of data: overflow, "View all", long names |

The Prototype panel (bottom-right) also switches scenarios and simulates loading skeletons, a failed
"Latest Updates" request and 22 competencies. **It is not part of the product UI.**

## Design tokens

All colours, off-scale font sizes, radii and shadows are tokens in `src/index.css` (`@theme static`). Spacing uses
Tailwind's 4px scale.

- **In classes:** `bg-primary`, `text-danger-dark`, `text-2xs leading-3.5`, `rounded-tile`, `shadow-focus-card`, `w-55.5` (= 222px).
- **In inline styles / SVG / CSS:** `var(--color-primary)`; for opacity, `color-mix(in srgb, var(--color-primary) 8%, transparent)`.
- The extra font sizes (`text-4xs`…`text-display-lg`) set the size only, so always pair them with a `leading-*` class.

## Motion

Everything respects `prefers-reduced-motion`.

| Where | Behaviour | Code |
|---|---|---|
| Progress bars / rings / charts | Start only when **scrolled into view** (≥40% visible, above the bottom 15% of the window) | `src/motion.ts` + CSS |
| Bars | Fill from 0 to the value, then ease to new values | `.fill-x` |
| Rings & donut | Draw round to the value | `.dash-ring` |
| Score History | Line draws, each dot pops as the line reaches it, area rises | `.reveal` + `.hist-*` |
| Competency radar | Dots are static; the outline traces through them, then the fill fades in | `.reveal` + `.rd-trace` / `.rd-fill` |
| Hero | Cursor spotlight + dot-grid reveal, tile border glow, drifting aurora, ring ripples, parallax, staggered entrance, count-up | `Hero.tsx`, `.hero-*`, `.glow-tile`, `.rise` |
| Latest Result card | 3D tilt toward the cursor with glare (mouse only) | `TiltCard` in `Hero.tsx`, `.tilt*` |
| Empty states | Icon floats with a soft halo; "waiting" ring turns slowly | `.empty-icon`, `.empty-spin` |

**To animate on scroll**, give an element the class `fill-x` or `dash-ring`, or wrap it in a `.reveal` container and give
the animated children the `rv` class. `src/motion.ts` sets `data-inview` once the element is on screen.
