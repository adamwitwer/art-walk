# Ch/Art Art Walk 2026

Live guide: **https://ch-art-walk-2026.netlify.app**

A mobile pocket guide to the October 17–18, 2026 Chevy Chase art walk: **35 homes and studios, 86 artists, noon–5 pm both days**. Artist information is extracted from the supplied PDF; advertisements, sponsorships, and prize promotion are excluded.

- Search by artist, art form, street, or stop number (use `#8` for an exact stop).
- Tap numbered pins or “On map” to open a stop's artist details.
- Open walking directions in Apple Maps, or choose Google Maps in Info.
- Save stops to My walk and track visits on this device.
- Optionally sort by proximity with Near me; location is held only in memory.
- Filter the six stops marked accessible in the pamphlet.
- After the first successful load, use the list and details offline. Map tiles, directions, and external artist links need internet.
- Install from Safari's Share → Add to Home Screen on iPhone.

## Local preview

Node 20+; no install or build step required.

```sh
npm run dev
```

Open http://localhost:4173. The static server exposes only `public/`. Geolocation and service workers require HTTPS or localhost; a plain HTTP LAN preview does not support offline installation on iPhone.

```sh
npm run check
npm run package
```

The package command creates `dist/art-walk-netlify.zip`, with `index.html` at the archive root.

## Netlify

The live app is already deployed as **`ch-art-walk-2026`** in the `adam-witwer` Netlify team. See [deployment details](docs/deployment.json). It was published with Netlify Drop; pushing to this repository does not automatically redeploy it until Git-based deployment is connected.

To enable continuous deployment, connect this repository to that existing Netlify project, use `npm run check` as the build command and `public` as the publish directory (declared in `netlify.toml`). There are no secrets, environment variables, API keys, accounts, or database requirements. For a manual update, upload `dist/art-walk-netlify.zip` to the existing project's deployment area.

## Updating the guide

Edit `public/stops.json` and run the checks. If application assets change, increment the cache version in `public/sw.js` before deployment. The stop data refreshes online with a cached fallback. See [content provenance and re-extraction](docs/content.md).

Contributor and coding-agent guidance: [AGENTS.md](AGENTS.md). Implementation and validation status: [build progress](docs/progress.md).

## Git over SSH

Use `git@github.com:adamwitwer/art-walk.git` as the Git remote. `gh` authentication is not required for Git operations with the computer's configured SSH key.

If the local project does not yet have Git metadata, or the initial documentation still needs publishing, run from Terminal:

```sh
bash scripts/publish-ssh.sh
```

The script preserves the existing remote history and local working files, runs the checks, commits the curated source, and pushes to `main`. It does not force-push. It leaves the PDF, temporary downloads, and deployment ZIPs ignored.

This is an independent guide, not an official Ch/Art product. Event updates: https://www.chevychaseart.org/art-walk-info
