# Crossword Gallery

A compact date gallery for The Seattle Times Modern Midi and Mini crosswords. Choose a date, mark puzzles complete on this device, or jump to the latest or a random puzzle. Puzzle links open on The Seattle Times.

## Run locally

This is a static site with no build step. From this directory:

```sh
python3 -m http.server 8765 --directory docs
```

Then open <http://localhost:8765/>. The service worker and installable app features require HTTPS or localhost.

## Install on Android

Open the [hosted gallery](https://crosswords.narsale.com/) in Firefox for Android and choose **⋮ → Install**. Firefox adds a home screen entry. The gallery shell works offline after an online visit; playing a crossword still requires access to The Seattle Times.

## Site structure

- `docs/index.html`, `docs/styles.css`, `docs/app.js`: gallery UI and puzzle URL generation
- `docs/manifest.webmanifest`, `docs/sw.js`, `docs/icon*`: installable app metadata, offline shell, and icons
- `docs/CNAME`: GitHub Pages custom domain
- `.openai/hosting.json`: configuration for the earlier Sites deployment

Puzzle dates are generated from the date patterns in shared PuzzleMe links. The publisher may not have a puzzle for every date. Completion marks are stored in this browser's local storage, so they do not sync between devices.
