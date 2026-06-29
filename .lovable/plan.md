# Author Manager (Boss Panel) — Build Plan

Enterprise Author Control Center inside Software Vala's Boss Panel. 21 top-bar Walls, each a standalone route with enterprise UI, filters, tables, empty/loading/error states, right action panel, and audit/activity hooks. No mock data — empty states only until backend is wired.

## Scope guardrails

- **Frontend-first scaffold.** This turn lays down the routing shell, top-bar shell, design tokens, shared enterprise primitives (DataTable, FilterBar, RightActionPanel, EmptyState, StatusBadge, KpiCard, AuditTimeline, CommandPalette), and Wall 1 (Dashboard) + Wall 2 (Applications) + Wall 3 (Authors) end-to-end with empty states.
- **Backend wiring deferred.** Lovable Cloud is NOT enabled in this project yet. Every Wall exposes typed data hooks (`useAuthors`, `useApplications`, …) that currently return `[]` with `status: 'empty'`. When Cloud is enabled later, only the hook bodies change — UI stays.
- **Subsequent turns** complete Walls 4–21 in the same pattern, two to four Walls per turn, so each Wall ships fully finished (no half-built screens).

## Architecture

```
src/routes/boss/author-manager/
  route.tsx              top-bar shell + <Outlet/>
  index.tsx              redirects to /boss/author-manager/dashboard
  dashboard.tsx          Wall 1
  applications.tsx       Wall 2
  authors.tsx            Wall 3
  products.tsx           Wall 4
  source-code.tsx        Wall 5
  templates.tsx          ...
  plugins.tsx
  themes.tsx
  ai-models.tsx
  reviews.tsx
  approvals.tsx
  royalties.tsx
  revenue.tsx
  licenses.tsx
  versions.tsx
  downloads.tsx
  support.tsx
  documents.tsx
  analytics.tsx
  reports.tsx
  settings.tsx

src/features/author-manager/
  components/            DataTable, FilterBar, KpiCard, StatusBadge,
                         RightActionPanel, EmptyState, AuditTimeline,
                         CommandPalette, BulkActionBar, TopBar
  hooks/                 useAuthors, useApplications, … (return empty)
  types/                 Author, Application, Product, License, …
  lib/                   formatters, filters, csv export
```

## Design system

- Software Vala brand tokens added to `src/styles.css` (oklch). Neutral enterprise palette: deep slate surfaces, single brand accent, semantic success/warning/danger/info. No glass, no neon, no blur.
- Typography: Inter via `<link>` in `__root.tsx`.
- Density: compact rows (36–40px), 12–13px table text, 14px body, sticky headers, keyboard focus rings.
- Shared primitives use shadcn under the hood but expose enterprise variants only.

## Per-Wall checklist (applied to every Wall)

Header (title + count + primary action) · KPI strip (where relevant) · FilterBar (search, status, date, advanced) · DataTable (sortable, multi-select, sticky header, column visibility, pagination) · Row → RightActionPanel (details, timeline, audit, quick actions) · BulkActionBar · EmptyState · LoadingState (skeleton rows) · ErrorState (retry) · Keyboard shortcuts (`/` search, `c` create, `?` help) · Export menu (CSV/Excel/PDF stubs) · Audit + Activity hooks.

## Global features wired this turn

- Universal Search inside top bar (filters current Wall + global ⌘K Command Palette).
- Notification Center bell with empty state.
- Role gate placeholder (`useBossRole()` returns `'owner'` until Cloud is wired).
- Top bar is horizontally scrollable on narrow screens, sticky, no sidebar.

## What this turn delivers

1. Brand tokens + Inter font.
2. `/boss/author-manager` route shell with top bar (all 21 items) and Outlet.
3. Shared enterprise component library listed above.
4. Walls 1, 2, 3 fully built with empty states.
5. Stub routes for Walls 4–21 that render the shared Wall shell + EmptyState ("Coming online in next phase") so navigation never 404s and the top bar is fully functional.

## Next turns (already queued mentally)

- Turn 2: Walls 4 Products, 5 Source Code, 6 Reviews, 7 Approvals.
- Turn 3: Walls 8 Royalties, 9 Revenue, 10 Licenses, 11 Versions.
- Turn 4: Walls 12 Downloads, 13 Support, 14 Documents.
- Turn 5: Walls 15 Analytics, 16 Reports.
- Turn 6: Wall 17 Settings (deep, multi-tab).
- Final turn: Enable Lovable Cloud, create schema (authors, applications, products, licenses, royalties, downloads, tickets, documents, audit_logs, user_roles), RLS + grants, swap hook bodies to real queries, wire realtime, audit logging, exports.

## Technical notes (for engineers)

- TanStack Router file-based routes under `src/routes/boss/author-manager/`.
- All data hooks typed against `src/features/author-manager/types/*`.
- DataTable is virtualization-ready (TanStack Table) to scale to 100k authors — server-side pagination contract baked into hook signatures (`{ page, pageSize, sort, filters }` → `{ rows, total }`).
- No `mock`, no seed users, no fake KPIs — every numeric tile reads from the hook; with no data it renders `—` and an empty state.
- Audit/activity components accept an `entity` + `entityId` and will POST to `audit_logs` once Cloud is enabled.

Confirm and I'll execute Phase 1 (this turn's deliverables) in one shot.
