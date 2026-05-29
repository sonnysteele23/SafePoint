# SafePoint

**Union-owned real-time safety incident reporting and bargaining-intelligence platform for K–12 educators.**

SafePoint is a working software prototype that inverts the safety-reporting paradigm: instead of the employer owning the incident-management system, the labor organization (teachers' union or education association) does. Members file incidents from a phone or web client; reports route in real time to the affected member's building rep AND the local union president; analytics surface patterns useful at the bargaining table — sick-leave correlation, OSHA-threshold proximity, FERPA-compliant student pattern tracking, and research-grounded causation overlays.

## Live preview

**Click `index.html` in this folder.** It works as a standalone file — no build step required.

If this folder is published to GitHub Pages, the preview is live at:
`https://<your-github-username>.github.io/SafePoint/`

(See `PUSH-TO-GITHUB.md` for one-time setup.)

## What's in this folder

```
SafePoint/
├── index.html              ← The clickable preview (self-contained, ~670KB)
├── favicon.svg
├── docs/
│   └── SafePoint-IDD.pdf   ← 25-page Invention Disclosure Document
├── dev/                    ← Source code + dev environment
│   ├── src/App.jsx         ← The full React application (~3,700 lines)
│   ├── src/main.jsx
│   ├── src/index.css
│   ├── public/
│   ├── index.html          ← Vite entry (for `npm run dev`)
│   ├── package.json
│   └── vite.config.js
├── rebuild.sh              ← One-command rebuild of the preview
├── README.md               ← You are here
├── PUSH-TO-GITHUB.md       ← Push + GitHub Pages enablement steps
├── LICENSE                 ← MIT
└── .gitignore
```

The root `index.html` is a **single self-contained file** — all JavaScript and CSS are inlined into it. That's deliberate: it makes the preview work from `file://` URLs (double-click on macOS / Windows / Linux) AND from GitHub Pages. No build step required to view it.

## To preview locally

Just double-click `index.html`. The whole app — three user roles, dashboards, charts, geographic visualization, simulated notifications — runs in your browser using bundled JS. Persistence is via `localStorage`.

Demo accounts (no real auth):
- **Sarah Chen** — instructional assistant (union member)
- **Marcus Johnson** — building rep
- **Dr. Aisha Patel** — local union president

The login screen has a "Demo accounts" toggle at the bottom — click any account to enter as that role.

## To modify the code

```bash
cd dev
npm install
npm run dev          # starts dev server at http://localhost:5173
```

When you're happy with changes, rebuild the preview in one shot from the repo root:

```bash
./rebuild.sh         # builds Vite output, inlines JS+CSS, writes root index.html
```

That single command produces an updated, self-contained `index.html` at the repo root, ready to commit and push.

## Architecture, high-level

| Component | Role |
|-----------|------|
| `App` | Root with role-based routing |
| `LoginScreen` | Mock SSO (NEA / Google / Microsoft Entra) and demo accounts |
| `MemberHome` + `ReportForm` | Member-side filing flow |
| `RepDashboard` | Building-rep view: open incidents, action items, building patterns |
| `PresidentDashboard` | Local-president view: district-wide rollup, OSHA threshold, geographic heat map |
| `IncidentDetail` | Single-incident view: thread, status, policy assignment, student panel |
| `NotificationCenter` | Bell dropdown, role + importance filtering |
| `SickLeaveCallout` | The "ground truth" signal — sick days correlated with incidents |
| `TrendCausationPanel` | Research-grounded "why the trend?" overlay |
| `GeoHeatMap` | Massachusetts incident heat map (president only) |
| `StudentPatterns` | FERPA-compliant anonymized student pattern tracking |
| `PolicyAssign` | Suggests workers' comp filing, OSHA 300 entry, BIP review, etc. based on incident attributes |

## Intellectual property

This project is the subject of an Invention Disclosure Document (`docs/SafePoint-IDD.pdf`) covering the system architecture, ten claim-style novel features, prior-art comparison, and trademark / copyright / trade-secret considerations. The IDD is the input document to professional patent counsel — it is **not** itself a patent or any other registered IP right.

Joint inventors: **Sonny Steele** and **Nick Sireci**.

## License

MIT — see `LICENSE`. The MIT license covers the source code only; it does not waive trademark rights in the name SafePoint or patent rights in the underlying invention.

## Research grounding

The causation-analysis module in the dashboards cites:

- American Psychological Association × NEA (2025). *Violence Against Educators: Policy Brief.*
- Reddy, L. A., et al. (2024). 'Student Violence Against Paraprofessionals in Schools.' *Behavioral Sciences* 14(12).
- National Center for Education Statistics (2024). *School Survey on Crime and Safety 2021-22.*
- Federal Bureau of Investigation (2025). *Crime in Schools, 2020–2024.*
- Resilient Futures (2026). *The Spring Spiral.*
- Massachusetts Department of Labor Standards. *Workplace Violence Prevention Program for K-12.*

Full bibliography in Appendix B of the IDD.
