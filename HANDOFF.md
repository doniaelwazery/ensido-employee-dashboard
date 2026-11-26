# Handoff: Ensido Employee Dashboard

For the developer taking this to production. `README.md` has the file-by-file reference.

## 1. What it is

A **front-end prototype** of the Ensido employee dashboard, built 1:1 from the Figma design. It's React +
TypeScript + Tailwind v4, runs entirely in the browser on sample data, and has **no backend, auth or API calls**.

- **Live preview:** https://ensido-employee-dashboard.vercel.app
- **Figma:** [Employee Dashboard — Ensido Style](https://www.figma.com/design/JCH5SdrRowHjaWCvS93ser/Ensido-2025-2026?node-id=29211-17625): *Typical* `29211:17626`, *New Employee (empty states)* `29220:21367`

Use it as the **reference for layout, copy, states and motion**. The section components and design tokens can be
lifted into the product; the sample data and the prototype scaffolding can't (see section 4).

## 2. How to run it

**Node:** `^20.19.0 || >=22.12.0` (Vite 8 requirement; enforced via `engines`). `.nvmrc` pins **22** (current LTS).
Last verified with a clean clone on Node 24.19 / npm 11.17.

```bash
git clone https://github.com/doniaelwazery/ensido-employee-dashboard.git   # private: ask Donia for access
cd ensido-employee-dashboard
nvm use          # optional: picks Node 22 from .nvmrc
npm ci           # installs exactly what package-lock.json says
npm run dev      # → http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run lint` | oxlint |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Serve the `dist/` build locally |
| `npm run deploy` | Build + deploy to the live link (needs `npx vercel login` with access to the **ensido** Vercel team) |

To open a specific case directly:
- `http://localhost:5173/`: typical employee
- `http://localhost:5173/?scenario=new`: **new employee**, empty state in every section
- `http://localhost:5173/?scenario=busy`: heavy use (overflow, long names, many items)

There are no tests. `npm run lint` and `npm run build` must both pass, and they do today.

## 3. Where things are

```
src/App.tsx                    shell: Sidebar + TopBar + DashboardPage (hard-coded signed-in employee)
src/pages/DashboardPage.tsx    page: scenario + loading state, grid layout
src/pages/dashboard/*.tsx      one file per section + shared.tsx (Card, Empty, Ring, Bar, Icon…)
src/data/dashboard.ts          ALL data + TypeScript types (DashData = the shape an API should return)
src/index.css                  design tokens (@theme) + all animation CSS
src/motion.ts                  starts chart animations when they scroll into view
```

**Design tokens:** all colours, off-scale font sizes, radii and shadows are tokens in `src/index.css`, named after
the Figma variables. Use `bg-primary`, `text-2xs leading-3.5`, `rounded-tile` in classes, or `var(--color-primary)` in
inline styles and SVG. The extra font sizes set the size only, so always pair them with a `leading-*` class.

## 4. Prototype-only vs production-ready

| Production-ready (lift as-is or with light changes) | Prototype-only (replace or delete) |
|---|---|
| Section components in `src/pages/dashboard/*`: markup, layout, copy, all visual states | **Sample data** in `src/data/dashboard.ts`: replace with API calls; keep the `DashData` types as the contract |
| Design tokens in `src/index.css` | **Prototype panel** (`PrototypeControls.tsx`, the floating "Prototype · Scenarios" button) |
| Motion system (`src/motion.ts` + animation CSS), reduced-motion support | **`?scenario=` URL switch** and the `scenario` state in `DashboardPage.tsx` |
| Responsive grid (1 → 2 → 3 columns) | **Simulated loading** (fixed 700–1200 ms timers) and **simulated "Latest Updates failed"** |
| Accessible names on charts (`role="img"` + `aria-label` with the data), `aria-pressed` toggles, `aria-busy` while loading | **Frozen "today"** (`NOW` = 12 Oct 2026 09:30 in `FormsCard.tsx`) so the countdown matches Figma |
| App shell styling (`Sidebar`, `TopBar`, `PageTitle`) matches the Ensido shell | **Hard-coded user** "Ahmed Samy" (`EMPLOYEE_USER` in `src/App.tsx`); sidebar items other than Dashboard are placeholders |
| | `scripts/deploy.mjs` (prototype hosting only) |

## 5. Interaction states

Every section supports **loading** (skeletons, `aria-busy`) and **empty** (New Employee scenario). The table lists what else each one does.

| Section | Hover / click | Other states |
|---|---|---|
| **Hero** | Stat tiles: border glow follows the cursor, hover highlight, click scrolls to the section. Cursor spotlight + dot grid over the navy area. | Numbers count up. Tile dot is red/purple when action is needed, teal when all clear. |
| **Latest Result card** | 3D tilt + glare toward the cursor (mouse only). "See My Scores" scrolls to the competency card. | No result yet: dashed ring turning slowly + explainer. Ring fills to the score on scroll. |
| **Evaluation Forms to Fill** | "Continue Filling Forms" / "Fill Forms" / "Review Forms" buttons. Timeline markers are buttons with a tooltip. | Most urgent round is spotlighted. **Due Soon** (≤ 3 days) = red with a live countdown (ticks every second). All-submitted round = teal "All submitted" + Review. More than 3 other rounds are truncated. Empty: "No Open Evaluations". |
| **Latest Updates** | Click a row to mark it read (the hero "Unread" tile decrements). Grouped rows expand/collapse (`aria-expanded`). | "Needs Action" group first. Unread = tinted row + dot. Footer "x of y unread shown / View All" when truncated. **Error**: "Could Not Load Updates" + Try Again. Empty: "No updates Yet". |
| **My Goals** | Filter tiles All / Needs Attention / In Progress / Completed (`aria-pressed`). Rows link to the goal. | Overdue/rejected rows tinted red, sorted first. Per-filter empty messages + "Show All Goals". More than 4 → "View All n Goals". Empty: "No Goals Yet" + **Create Goal**. |
| **My Managers and Position** | Manager rows link to profile. "Show n More / Show Less" when there are more than 2 managers. | No manager: info notice. Org path breadcrumb. |
| **Policy Updates** | Rows link to the policy. "Browse All n Policies". | New / Updated chips. |
| **Competency Scores** | Radar ↔ Bars toggle (`aria-pressed`). Radar: hover a label to highlight its spoke. Bars: "Show All n Competencies" (`aria-expanded`). | More than 8 competencies or long names: numbered radar + scrollable legend. Bars show top 3 / bottom 3. Outline draws on scroll. |
| **Score History** | Hover a point → tooltip (round, %, category). "All Reports". | Line + dots build on scroll. List with category pills. |
| **Score Category Distribution** | n/a | Donut fills on scroll. |
| **Achievement Reports / Work Groups** | Rows link out. "View All" when there are more than 3 / 4. | Empty: one-line explainer each. |
| **No results yet** (new employee) | n/a | Competency / History / Distribution are replaced by a single "No Results Yet" card. |

**Motion rules:** charts animate **once**, when at least 40% is on screen. With `prefers-reduced-motion: reduce`, every
animation is off and final values show immediately. The tilt card and cursor effects are off on touch devices.

## 6. Known gaps & TODOs

**Must do for production**
- [ ] Replace `src/data/dashboard.ts` with real API data (one endpoint returning `DashData`, or one per section). Use real loading and error states instead of the timers.
- [ ] Use the real current date instead of `NOW`; decide time-zone handling for deadlines and the countdown.
- [ ] Wire every placeholder link (`href="#"`): View Evaluation Rounds, Continue Filling Forms, Fill/Review Forms, goal rows, Open Goals, View All Goals, Create Goal, manager/policy rows, View Hierarchy, Browse All Policies, View Full Report, All Reports, View All (achievements), See My Scores, and the sidebar items.
- [ ] Mark-as-read for Latest Updates is local state only; persist it via the API.
- [ ] Remove the prototype scaffolding listed in section 4.

**Accessibility**
- [ ] No custom `:focus-visible` styles: interactive elements rely on the browser default outline. Add the design-system focus ring (a `shadow-focus-ring` token exists).
- [ ] Chart hovers (Score History points, radar labels) are **mouse-only**. The data is still exposed via `aria-label`, but add keyboard focus + tooltip if it's required.
- [ ] Do a screen-reader pass (only the structure is in place: landmarks, labels, live regions for loading).

**Quality / platform**
- [ ] Verified in **Chrome/Edge (desktop)** only. Test Safari and Firefox, especially SVG `fill`/`stroke` set to `var(--color-*)` and `color-mix()` (supported in current versions, but not tested here).
- [ ] Responsive layout exists, but phone/tablet layouts weren't designed in Figma; review with design.
- [ ] RTL / Arabic is not supported or tested.
- [ ] No unit or e2e tests.
- [ ] Icons are inline SVG paths (`PATHS` in `shared.tsx`); swap for the product icon set. `public/assets/avatar-ahmed.png` is a 1122×1402 placeholder photo; use real, resized avatars.

**Design decisions to confirm**
- [ ] The third hero tile reads **"Unread latest updates"** (changed on request). The Figma *New Employee* frame still says "Unread notifications".
- [ ] Header role shows "Employee"; the Figma *New Employee* frame shows a job title ("Senior Mobile Engineer").
- [ ] Sidebar logo offsets were rounded from Figma's 21.47 px / 37.09 px to whole pixels (sub-pixel change).

## 7. Deploys

`npm run deploy` builds `dist/`, copies it to a temp folder **outside git**, links that folder to the Vercel project
`ensido-employee-dashboard`, deploys to production and deletes the temp folder (including any pulled `.env.local`).
Deploying from outside git matters: from inside the repo the Vercel CLI attaches the last commit's author, and Vercel
**blocks** the deploy if that email isn't a member of the ensido team (status "Blocked", CLI appears to hang). Use `npm run deploy -- --preview` for a throw-away
preview URL. The live link is public; ask the design owner before sharing further.

## Company Dashboard (Super Admin + Manager)

Finalized from the PM draft ("Ensido Dashboards › Company Dashboard"). Managers and Super Admins switch between
**My Dashboard** (the employee dashboard above, unchanged) and **Company Dashboard** with the DS underline tabs.
Employees never see the tabs.

- **Live:** `/?role=admin&view=company` · `/?role=manager&view=company` · add `&theme=dark` · `&scenario=…`
- **Code:** `src/pages/CompanyDashboardPage.tsx` (page, rules, dialogs) · `src/pages/company/*` (cards) ·
  `src/data/company.ts` (all sample data + types, `BANDS` = round-result score bands)

### Sections (top to bottom)
| Section | Super Admin | Manager |
|---|---|---|
| Account banner: free trial, cancellation scheduled, subscription expired, trial expired, suspended (PM texts) | ✓ | — |
| Welcome modal (first login on a trial: Subscribe Now / Maybe Later) | ✓ | — |
| Company header: name, status line, 4 tiles, key numbers band | whole company | "Your Teams", team numbers |
| Active Evaluation Rounds: spotlight + list, View All Rounds | Remind (End Round when all forms are in); ⋯ menu is the same on every running round: Edit Round / End Round / Cancel Round | Remind only; rounds without their teams are hidden |
| Needs Your Attention (rules in `items`) | overdue, closing <3 days & <80%, all submitted, low scores, seats ≥90%, setup, no people, idle | overdue, closing soon, low scores |
| ensidoMate Insights (Beta) | 1–3 insights, each links to a section | team insights |
| Latest Round Results: picker, published notice, chart views Bands / By Department / Distribution (actual line + normal curve) / Competencies (this vs previous round), Top Performers + Need Attention, See All → Performance Snapshot drawer (tabs) | company | team |
| Finish Setting Up (Hide for Now → "Continue Setup" link), Setup Gaps | ✓ | — |
| Recently Joined | company | their teams |
| Trends Across Rounds (needs ≥2 rounds) + Biggest Movers | ✓ | ✓ team |
| Evaluators With Most Pending Forms (Remind / Remind All) + Completion by Department/Team | ✓ | ✓ team |

### Cases (Prototype › Scenarios)
Typical (3 rounds, 1 overdue) · Heavy Use (8 rounds, long names, setup complete) · One Round · No Active Rounds ·
First Round (no results yet) · New Company (Super Admin only: empty states, setup 1/5, trial) · Loading ·
Sections that fail (key numbers / active rounds / results / recently joined / all, each with Try Again) · Account banner ·
Welcome modal · No permission ("You don’t have access…", also `&access=none`) · Light / Dark / System theme.
Every PM section is in the default (Proposed) layout; Arabic and the build-notes overlay were left out by PM decision.

### Score bands (same as evaluation round results)
Unsatisfactory 0–34 `#ed1d4e` · Developing 35–49 `#d97706` · Solid Performance 50–64 `#2563eb` · Strong 65–79 `#00b2a1` ·
Outstanding 80–100 `#06a700`. "Need attention" = below 50%.

### API needs beyond today's endpoints (PM marked as Phase 2)
New joiners (30 days) and active-employee delta · trends for the last 6 rounds (avg score + participation) ·
per-employee score change between rounds (Biggest Movers) · completion per department/team per round ·
pending forms per evaluator · setup-gap counts · AI insights.
