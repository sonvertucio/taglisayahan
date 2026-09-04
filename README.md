# TAGLISAYAHAN 2026

Production-ready championship management platform for **ST. ANTHONY COLLEGE CALAPAN CITY, INC.**

> Tagisan, Talino, Saya at Paligsahan

## What is included

- Premium animated SACCI championship arena
- Original cinematic fantasy-esports arena backdrop and upgraded MOBA-inspired visual effects
- Enhanced official-family crest stages; Lakambakod is mirrored through display styling without modifying the supplied source logo
- Official five-family live leaderboard
- Broadcast-style animated podium with rank-lock sweeps and family crest spotlights
- Double-Elimination Bracket Intelligence with winner/loser lanes, two-life tracking, live opponent probabilities, and grand-final reset logic
- Family War Room profiles, achievements, power ratings, and momentum
- Sports, academic, and cultural analytics
- Scenario-based championship projection engine
- Student strategy portal with overtake targets and high-value opportunities
- Admin Command Center with automatic official-point calculations
- Admin Data Hub with validated JSON/CSV import plus manual JSON entry and state export for results, brackets, families, announcements, schedule, and settings
- Automatic result announcements and live cross-screen updates
- Fullscreen LED mode with champion reveals, gold particles, and fireworks
- Official guidelines and searchable 2026 point table
- Netlify Functions + Netlify Blobs live persistence, with safe device-only fallback
- Responsive mobile, tablet, desktop, and gym-display layouts

## Developer

**DR. EMELSON C. VERTUCIO, LPT**  
**MANAGEMENT INFORMATION SYSTEM OFFICER**

## Demo admin credentials

- Username: `sacci.admin`
- Password: `SACCI2026!`

Change these values in Netlify before using the system for official results.

## Deploy with GitHub and Netlify

1. Create a new empty GitHub repository.
2. Upload every file and folder in this project to the repository root.
3. In Netlify, select **Add new project → Import an existing project → GitHub**.
4. Choose the repository. Netlify detects `netlify.toml`; keep these settings:
   - Build command: `node scripts/build.mjs`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
5. Add the environment variables listed below under **Project configuration → Environment variables**.
6. Deploy the project.
7. Open `/admin/` on the deployed domain and sign in.

## Required production environment variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `TAGLISAYAHAN_ADMIN_USERNAME` | `sacci.admin` | Official admin username |
| `TAGLISAYAHAN_ADMIN_PASSWORD` | Use a new strong password | Official admin password |
| `TAGLISAYAHAN_SESSION_SECRET` | A random 32+ character value | Signs admin sessions |

Netlify automatically provisions the Blobs store when the first verified state is saved. Public pages read the shared live state; only an authenticated admin can write results.

## First-use checklist

1. Sign in to the Admin Command Center.
2. Open **Arena Settings** and set the correct championship countdown date and status.
3. Confirm the five family profiles and starting points.
4. Test one result, then verify the public leaderboard and LED mode.
5. Replace the demo password through Netlify environment variables before official use.

## Result workflow

`Select Category → Select Event → Select Placements → Review → Confirm & Publish`

The point engine reads the official values from `data/events.json`. If a result is corrected, submitting the same event again removes its old points before applying the replacement, preventing duplicate scoring.

## Local preview

Use the Netlify CLI so functions and live persistence are available:

```bash
npm install
npm run serve
```

For a static-only preview, any local web server can serve the repository root. In static-only mode, changes are saved to the current browser and synchronized between open tabs on the same device.

## Project structure

```text
index.html                 Championship arena
assets/images/             SACCI, TAGLISAYAHAN, and family logos
css/styles.css             Responsive visual system and animation
js/core.js                 Shared data, scoring, sync, and UI utilities
js/app.js                  Public-page experiences
js/admin.js                Admin Command Center
js/led.js                  Fullscreen LED arena
data/events.json           Official event and point configuration
data/sample-data.json      Packaged SACCI sample data
admin/index.html           Admin interface
pages/                     Leaderboard, bracket intelligence, families, analytics, strategy, rules
led-mode/index.html        Gymnasium display
netlify/functions/         Authentication and live data API
netlify.toml               Netlify build, routing, and security headers
scripts/build.mjs          Production build
USER_GUIDE.md              Operator instructions
```

## Data and security notes

- The bundled credentials are for first deployment only. Replace them before official use.
- The public leaderboard is read-only. Result writes require a valid signed admin session.
- The content security policy, no-index admin metadata, payload validation, and security headers are included.
- Netlify Blobs uses last-write-wins behavior. Keep result entry under the control of one authorized tournament desk during live operations.
- Back up official standings periodically by downloading the state from the browser developer console or maintaining a parallel signed score sheet.

## Keyboard controls in LED mode

- `F` — enter or exit fullscreen
- `C` — show the latest champion reveal
- `R` or `Esc` — return to live rankings

## Source references

- TAGLISAYAHAN 2026 Master System Prompt
- TAGLISAYAHAN Guidelines 2026
- [Netlify Functions documentation](https://docs.netlify.com/build/functions/overview/)
- [Netlify Blobs documentation](https://docs.netlify.com/build/data-and-storage/netlify-blobs/)
