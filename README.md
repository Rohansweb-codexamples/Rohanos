# RohanOS Desktop

RohanOS is a desktop-style browser operating system prototype built with plain HTML, CSS, JavaScript, and an optional Node.js publishing server.

## Features

- Desktop workspace with menu bar, window chrome, taskbar, widgets, and launch icons
- First-run setup plus a generated 1000-setting control center
- Whole Notepad app with local saves and `.txt` export
- HTML Studio for creating browser-only HTML files, live previewing them, downloading them, and publishing them
- App Store with ready made installable apps, installed app launching, and server/browser publishing modes
- Files app that uploads and opens HTML, images, PDFs, and text files in the browser
- Text editing/export and PDF annotation-note export from the Files app
- Existing utility apps for calculator, browser launcher, music, gallery, calendar, and files

## Run the desktop locally

Open `index.html` directly in a browser for local-only mode.

## Run with the local publishing server

```bash
npm start
```

Then visit `http://localhost:8000`. Publishing from HTML Studio writes app listings to `data/app-store.json` through the local server API.

## Put RohanOS online with GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/pages.yml` that deploys the static desktop to GitHub Pages.

1. Push the repo to GitHub.
2. In GitHub, open **Settings → Pages**.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push to `main` or `master`, or manually run the **Deploy RohanOS to GitHub Pages** workflow.
5. Open the Pages URL shown by the workflow, usually `https://OWNER.github.io/REPOSITORY/`.

GitHub Pages is static hosting, so it cannot run `server.js`. On GitHub Pages, HTML Studio still creates, previews, downloads, and publishes apps in browser-only mode using `localStorage`. For a shared multi-user app store, deploy `server.js` to a Node host such as Render, Railway, Fly.io, or a VPS.

## Server API

- `GET /api/apps` lists published apps.
- `POST /api/publish` accepts `{ "name", "author", "description", "html" }` and stores an HTML-only app listing.
