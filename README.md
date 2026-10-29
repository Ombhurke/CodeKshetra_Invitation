# CODEKSHETRA — Aurora Invitation

Current design: Aurora Night only. Open `dist/index.html` (or `dist/aurora.html`). The opening screen includes the supplied 17-person guest dropdown and manual guest entry. Editing is available before opening the ribbon. The former Monochrome and Pearl pages have been removed; their original versions remain in Git history.

Three complete frontend invitation experiences:

- `dist/monochrome.html`: Concept 12, Monochrome Sculptural.
- `dist/aurora.html`: Concept 09, Aurora Night.
- `dist/pearl.html`: Concept 06, Pearl Glass.
- `dist/index.html`: visual collection linking to all three.

## Run

No dependencies or build step. Open `dist/index.html` in a browser, or serve the folder for consistent browser storage across pages:

```sh
python -m http.server 8080 --directory dist
```

Then visit `http://localhost:8080`. On Windows, `py -m http.server 8080 --directory dist` also works when Python is installed.

## Included

- Ribbon split with a cut line, two independently moving halves, unfolding card, and invitation reveal.
- Compact single-page invitation with a lower-right signature placeholder and replay.
- Full-screen signing view with a snapshot animation that returns the saved signature to its placeholder.
- Three responsive themes, including narrow phone layouts and reduced-motion behavior.
- Management/guest dropdown; add or edit guests and their designation.
- Editable event date, time, venue, and invitation message.
- Pointer-based signature canvas, Undo, Clear, typed alternative, save and restore.
- Separate signatures per stable guest ID. Unsaved drafts are retained in memory while switching guests.
- PNG downloads of the signature and a signed invitation keepsake.
- Focus states, keyboard controls, accessible dialog, skip links, and polite status announcements.

## Storage

This is a frontend implementation. Guest settings and saved signatures use localStorage in the current browser and origin. They are not uploaded or synchronized between devices. Clearing browser data removes them. Use downloads for durable copies. A failed save reports an error and retains the drawing for download.

The supplied inauguration wording, October 31, 2026 date, 1:15 PM time, and SVPCET auditorium venue are included. Guest names and designations remain editable in Guest settings. There is no public directory, authentication, cloud signature database, email sending, or automatic sharing.

## Files

`dist/styles.css` owns all visual themes and motion. `dist/app.js` owns invitation interactions, settings, canvas, persistence, and exports. `create-pages.py` generates the shared markup; rerun after changing that template. `bundle-source.py` updates the source ZIP linked from the collection. The runtime has no external script, font, API, or image requests.

## Checks

`npm run check` checks JavaScript syntax (Node is optional for running the website).

Browser verification: all three ribbon openings; responsive layouts at 390px iframe widths; pointer drawing; Undo; save and reload; guest switching and isolated signatures; typed signature; signed invitation PNG download. The responsive check is browser rendering at phone widths, not a test on physical mobile hardware.

## Before an actual event

Replace placeholders, test on the event tablet and stylus, and choose whether downloads/device storage are sufficient or a shared authenticated backend is required.

Latest validation: JavaScript syntax checks; browser ribbon opening, typed and pointer signatures, saving and reload restoration; portrait tablet at 768 × 1024 and landscape tablet at 1024 × 768. These are browser viewport checks, not physical tablet/stylus testing.
