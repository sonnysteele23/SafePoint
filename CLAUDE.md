# SafePoint — project guide

Union-owned, real-time safety-incident reporting and bargaining-intelligence
tool for K-12 educators. Single-page React prototype; no backend (auth and data
are mocked).

## Where things live
- **Canonical local repo:** `~/Documents/GitHub/SafePoint`
- **GitHub:** https://github.com/sonnysteele23/SafePoint
- **Live preview (GitHub Pages):** https://sonnysteele23.github.io/SafePoint/

## Layout
- `dev/src/App.jsx` — the entire app (one big file). **Edit here.**
- `dev/` — Vite + React source (`npm run dev` for a live dev server on this folder).
- `index.html` (repo root) — the **built, self-contained** preview with JS+CSS
  inlined. This is what GitHub Pages serves. **Do not hand-edit it** — it's generated.
- `favicon.svg` (root) — copied from the build.
- `docs/` — IDD and supporting docs.

## The one workflow rule
After editing `dev/src/App.jsx`, always rebuild the root `index.html`:

```bash
cd ~/Documents/GitHub/SafePoint
./rebuild.sh                 # installs deps if needed, builds Vite, inlines into root index.html
git add -A && git commit -m "…" && git push   # Pages redeploys in ~30–90s
```

Skipping `rebuild.sh` means the live site won't reflect source changes.

## App structure notes
- Stack: React 18, Vite 5, `recharts` (charts), `lucide-react` (icons).
- Role-based dashboards from the login screen's demo accounts:
  - **Instructional Assistant** (Sarah Chen) — report/submit view.
  - **Building Rep** (Marcus Johnson).
  - **Local President** (Dr. Aisha Patel) — district-wide aggregate, incl. the
    `GeoHeatMap` (Geographic Incident Map · Massachusetts).
- Light/dark theme toggle in the header; colors come from the `C` palette object.
- `GeoHeatMap` (in `App.jsx`) draws the MA outline by projecting real lon/lat
  coordinates (`mainland`, `marthasVineyard`, `nantucket` arrays + `project()`),
  and places city markers from `BUILDING_GEO` (each entry has `lon`/`lat`).

## Gotchas
- The home directory `~` is itself a git repo (remote `portfolio.git`). Always
  run git commands from inside `~/Documents/GitHub/SafePoint`, not a parent dir.
- `SafePoint-MTA-Proposal_1.key` is a local Keynote proposal; it's gitignored
  (binary, not part of the app).
