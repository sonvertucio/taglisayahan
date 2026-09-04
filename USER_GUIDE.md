# TAGLISAYAHAN 2026 — Operator Guide

## 1. Open the public arena

The home page presents the championship leader, live leaderboard, featured battles, family cards, key metrics, and automatic announcements. Public visitors cannot change scores.

## 2. Sign in to the Command Center

Open `/admin/` on the deployed website.

- Default username: `sacci.admin`
- Default password: `SACCI2026!`

The site administrator should replace both values in Netlify before the official tournament begins.

## 3. Record an official result

1. Select **Record Result**.
2. Select the event category: Sports, Academic, or Cultural.
3. Select the official event.
4. Assign each family to one placement. The same family cannot occupy two placements.
5. Add any configured individual award recipient when applicable.
6. Review the automatic point preview.
7. Select **Review & submit result**.
8. Verify the final summary and select **Confirm & publish**.

The system applies the official points, updates category totals and momentum, recalculates the leaderboard, and creates a breaking-news announcement.

### Correcting a result

Select the same event and submit the corrected placements. The system first reverses the previous result, then applies the replacement. This prevents duplicate points.

## 4. Publish an announcement

Open **Announcements**, enter a short headline and message, select the update type, and publish. The newest announcement appears in the public news strip and LED ticker.

## 5. Follow a double-elimination bracket

Open **Brackets** from the public navigation. Choose a team-format event, then select a family crest. The board follows the five-team winner’s bracket / loser’s bracket guide, highlights the family’s remaining lives, shows the live or next opponent, and estimates which other families can still enter its route. Select any match card for its exact bracket consequence. A conditional **Bracket Reset** card is shown for the second grand-final match when required.

## 6. Configure the arena

Open **Arena Settings** to change:

- Championship countdown date and time
- Public championship status

Use **Restore sample dataset** only during testing. It replaces the current standings.

## 7. Import or manually enter arena data

Open **Data Hub** in the Admin Command Center. Every area has its own validated import card:

- **Results** — JSON or CSV placements, with official points applied automatically
- **Brackets** — live match cards, scores, status, and routes
- **Families** — points, records, momentum, and category totals (official crest paths are protected)
- **Announcements** — public ticker and activity feed messages
- **Schedule** — time, event, venue, and status
- **Settings** — countdown target and championship status

If a file is not available, choose an area and paste JSON into **Manual entry fallback**. Use **Export current state** before editing a full snapshot so there is always a recoverable backup.

## 8. Run LED mode

1. Open **LED Mode** from the public header or Admin Command Center.
2. Connect the computer to the gymnasium display.
3. Press `F` for fullscreen.
4. Keep the tab open while results are entered in another tab or authorized device.
5. New results trigger an automatic champion reveal when the tabs are on the same browser. Use `C` to replay the latest reveal.
6. Press `R` or `Esc` to return to rankings.

## 9. Read analytics and strategy

- **Analytics** compares category totals, win rate, momentum, and projected championship paths.
- **Strategy** lets students select a family and view the next rank target, remaining opportunities, and suggested focus area.
- Projections are directional estimates and are not official final outcomes.

## 10. Live-operation safeguards

- Assign one authorized result encoder and one verifier.
- Compare the confirmation screen with the signed result sheet before publishing.
- Keep the official paper or spreadsheet record as a parallel backup.
- Change the demo password before live use.
- Do not share the admin account with spectators or family representatives.
