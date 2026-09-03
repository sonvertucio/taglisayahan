# TAGLISAYAHAN 2026 — V4 Final Production

A GitHub + Netlify ready intramurals management system inspired by esports interfaces.

## Included Features
- Public home portal
- Automatic leaderboard and points engine
- Admin Command Center
- Family War Room pages
- Event management page
- Analytics engine
- Strategy portal
- Bracket page
- LED / projector fullscreen mode
- Fireworks and champion reveal
- Sound effects (Web Audio API)
- QR code student access
- PWA installable app
- Offline caching via service worker
- Firebase-ready placeholder config (optional)

## Default Demo Admin Password
`SACCI2026`

Change this in `js/app.js` before deployment.

## Deployment (GitHub → Netlify)
1. Upload this project to a GitHub repository.
2. In Netlify, click **Add new site** → **Import from Git**.
3. Select the repository.
4. Publish directory: `.`
5. Deploy.

## Notes
- The current version uses **localStorage** so it works immediately with no backend.
- If you want true real-time sync and secure authentication, wire the project to Firebase using `js/firebase-adapter.js`.
- Student-facing pages do not require login.

## Recommended Next Production Upgrade
- Replace demo admin login with Firebase Authentication.
- Replace local storage with Firestore listeners.
- Add real team/participant registration forms.
- Add printable reports and export tools.
