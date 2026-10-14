# Working on the Art Walk guide

## Project and source of truth

This is an independent, mobile-first guide to the 2026 Ch/Art Art Walk in Chevy Chase, MD and Washington, DC. The live app is https://ch-art-walk-2026.netlify.app.

- Keep all 35 numbered stops and 86 artist listings complete. Preserve the pamphlet's stop numbers, artist names, original art media, contacts, and the six accessibility markers (2, 8, 10, 11, 13, 32).
- `public/stops.json` is the published dataset. `docs/content.md` describes its provenance and how to re-extract it with `scripts/extract.py`.
- Do not include advertisements, sponsors, prize promotion, the original PDF, downloaded KML, or temporary preview files in the site or repository. The original PDF is supplied locally and is ignored by Git.
- Use the organizer's map coordinates, not guessed positions. Keep full street addresses and city/state in external walking-direction links.
- This is not an official Ch/Art product. Keep the organizer attribution and link to event updates.

## Architecture

The app is buildless HTML/CSS/JavaScript, with no npm dependencies, backend, account system, or API keys. Node 20+ runs the preview and checks.

- `public/index.html`: page structure, dialogs, installation metadata.
- `public/styles.css`: responsive layout and visual design.
- `public/app.js`: list/map interactions, dialogs, search, location, and device-local progress.
- `public/domain.js`: filtering, medium grouping, directions, distances, and progress validation.
- `public/sw.js`: local app asset caching and offline fallback.
- `public/vendor/`: Leaflet 1.9.4 and its license; preserve the license when updating it.
- `tests/guide.test.mjs`: dataset, search, direction links, storage recovery, and offline-asset checks.

Prefer small changes within this structure. Do not add a framework, build pipeline, remote service, or runtime dependency unless the task needs one.

## UX and privacy

- Prioritize phone use while walking: readable text, easy-to-tap controls, safe-area spacing, and clear navigation between list, map, and saved stops.
- Maintain keyboard support, dialog focus behavior, accessible labels, visible focus states, and reduced-motion support.
- Saved and visited progress is stored in this browser on this device. Handle unavailable or corrupt storage without breaking the guide.
- Location is optional, requested only when the user chooses Near me, and held in memory. Do not store, transmit to an app backend, or log it.
- Distances are straight-line estimates, not walking routes. Actual directions open Apple Maps by default; Google Maps is a user-selectable alternative.
- A wheelchair symbol means marked accessible in the pamphlet. Do not imply other stops are inaccessible or invent access arrangements.
- Personal visited checkmarks do not replace physical event passport stickers.

## Validation

Run `npm run check` after code or dataset changes. It checks JavaScript syntax and runs the meaningful domain/data tests.

Use `npm run dev` for http://localhost:4173. The server serves only `public/`. If listening sockets are unavailable, `node scripts/preview.mjs` creates a temporary file preview in `tmp/`; use it only for layout and interaction checks. A file preview cannot validate service workers or reliable map tile loading.

For UI changes, check a narrow phone viewport and desktop layout. For map or offline changes, verify the hosted HTTPS version: numbered pins, list-to-map details, saved/visited persistence, and offline reload including a `?stop=8` deep link. Confirm all external walking links retain the full destination and walking mode. Do not claim actual iPhone or walking-route validation unless it was performed.

## Offline and map behavior

- Increment the cache version in `public/sw.js` whenever cached application assets change. Include new local assets in its precache list.
- Preserve the online stop-data refresh with a cached fallback. List/detail content works offline only after its first successful download.
- Map tiles, artist websites, and directions require a connection. Keep that limitation clear in the UI.
- OpenStreetMap tiles use normal browser HTTP caching. Do not bulk download, prefetch, proxy, or precache them for offline use. Keep visible attribution and a referrer policy that allows the browser's Referer header.

## Hosting and repository hygiene

`netlify.toml` declares `npm run check` and the `public` publish directory. `public/_headers` provides the equivalent headers for manual uploads. There are no deployment secrets in this repository.

The existing Netlify project is `ch-art-walk-2026`, site ID `5426fb72-db6d-41e4-8d57-2e32a99b5a55`, under team `adam-witwer`. See `docs/deployment.json`. Preserve this project and its public URL when updating the deployed app; do not create a replacement site unnecessarily.

Run `npm run package` to create `dist/art-walk-netlify.zip`. Only the curated `public/` contents belong in that deployment archive. Keep `dist/`, `tmp/`, PDFs, credentials, and local hosting state out of commits. Source-only documentation changes do not need a site redeployment.

Keep README setup/deployment instructions and `docs/progress.md` current. Report actual verification and any publishing blockers accurately.
