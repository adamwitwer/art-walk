# Content provenance

The source is `AW26_Pamphlet_27JUL26.pdf`, supplied locally by the user. The original PDF is ignored by Git and is never deployed, because it contains sponsor and advertising material.

`public/stops.json` includes all 35 numbered stops and 86 artist listings, including the original art media and contacts. The six wheelchair symbols were visually checked on the PDF: stops 2, 8, 10, 11, 13, and 32. Other stops are not described as inaccessible.

Event: October 17–18, 2026, noon–5 pm both days, America/New_York. The organizer's event page also confirms free admission and rain-or-shine operation: https://www.chevychaseart.org/art-walk-info

All 35 pin coordinates come from the organizer's public Google My Maps export, in the same order as the pamphlet: https://www.google.com/maps/d/viewer?mid=1rI_Hlm5UGMQWi1DlbaBmodLwz2h4F5M

The app adds city/state to addresses: stops 1–10 are in Maryland; 11–35 are in Washington, DC. PDF typography is normalized to title case; artist spelling and contacts are retained. The website and PDF have a few contact differences; this app uses the user's PDF (e.g. Bruce Abrams: `@bruceabrams.art`).

## Re-extract

With Poppler installed and the organizer's KML downloaded:

```sh
python3 scripts/extract.py AW26_Pamphlet_27JUL26.pdf path/to/organizer-map.kml
npm run check
```

The extraction uses bounded PDF columns to exclude the map's sponsor key and the prize panel. The script validates stop numbering, address numbers against the map, and the 35/86 totals. Accessibility symbols require visual verification if the PDF changes.

The screen's medium filters group related art forms, while the original medium is displayed in each listing. Saved/visited states are device-local notes, not a substitute for physical event passport stickers.

## Map dependencies

Leaflet 1.9.4 is vendored from the official npm package; its BSD license is included. `leaflet.js` SHA-256: `db49d009c841f5ca34a888c96511ae936fd9f5533e90d8b2c4d57596f4e5641a`; `leaflet.css`: `a7837102824184820dfa198d1ebcd109ff6d0ff9a2672a074b9a1b4d147d04c6`.

The live basemap is OpenStreetMap, attributed on-screen. No tiles are bulk downloaded or precached for offline use; they use normal browser caching. Apple Maps directions use its documented unified URLs (`/directions?destination=…&mode=walking`). Google Maps is an optional user-selected alternative.
