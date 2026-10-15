# Build progress

- [x] Visually inspect both PDF pages and extract artist-only columns.
- [x] Validate all 35 stops and 86 artist contacts.
- [x] Import all 35 pins from the organizer's public map.
- [x] Build mobile and desktop views, search, medium/access filters, map, saved stops, and visits.
- [x] Add Apple/Google walking directions, optional proximity sorting, and deep links.
- [x] Add offline list/detail storage and installation metadata.
- [x] Complete automated checks and browser QA (desktop and iPhone 16 viewport).
- [x] Publish to Netlify and verify https://ch-art-walk-2026.netlify.app, live map tiles, service-worker offline reload, saved progress, and a shared stop deep link.
- [x] Publish the application assets, README, initial AGENTS.md, scripts, and tests to the public repository https://github.com/adamwitwer/art-walk.
- [x] Commit the final provenance/deployment notes and SSH workflow updates (`c267ff4`); SSH fetch/push is now available in the session.
- [x] Add Info → Text size with Default, Larger (+20%), and Largest (+40%) options, immediate application, device-local persistence, and cross-tab updates. Preserve existing progress and the default visual scale. Increment the offline app cache to v2.
- [x] Pass all seven automated checks, including preference validation and compatibility with existing saved/visited progress; verify the local preview returns HTTP 200.
- [ ] Visually verify the text-size change at phone and desktop widths, then deploy the update to the existing Netlify site. The computer-use service currently fails to start, so browser QA and the signed-in Netlify dashboard are unavailable. No Netlify CLI or local CLI authentication is configured. The previous deployed version remains live.

The Netlify project is `ch-art-walk-2026`, ID `5426fb72-db6d-41e4-8d57-2e32a99b5a55`, in the `adam-witwer` team. Deployment was via the curated ZIP; the hosting promotional badge is disabled. The PDF and temporary map/library downloads were not uploaded.

Browser QA: artist search narrowed both list and map; saving, visit toggles, and list-to-map details worked; all 35 map pins appeared over real street tiles. With DevTools set to Offline, the app reloaded with all 86 artists, retained saved progress, and opened `?stop=8` directly. Test-only saved progress was cleared and normal networking restored. No actual iPhone device or walking-route handoff was available for validation; the phone layout was checked in Chrome emulation.

Repository publishing used the authenticated GitHub browser session because the shell could not connect to GitHub or write workspace Git metadata. The source repository is separate from the existing Netlify Drop deployment; continuous deployment has not been connected.

At the user's request, further Git publishing uses SSH (`git@github.com:adamwitwer/art-walk.git`). The original sandbox restrictions were resolved after the user changed session permissions. SSH fetch and a push dry run succeeded. No further browser-based commits were made after the SSH request.
