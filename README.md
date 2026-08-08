# RohanOS Desktop

RohanOS is a desktop-style browser operating system prototype built with plain HTML, CSS, JavaScript, and an optional Node.js publishing server.

## Features

- Desktop workspace with menu bar, window chrome, taskbar, widgets, and launch icons
- First-run setup plus a generated 1000-setting control center
- Whole Notepad app with local saves and `.txt` export
- HTML Studio for creating browser-only HTML files, live previewing them, downloading them, and publishing them
- Local App Store page backed by the optional publishing server
- Existing utility apps for calculator, browser launcher, music, gallery, calendar, and files

## Run the desktop

Open `index.html` directly in a browser for local-only mode.

## Run with publishing server

```bash
npm start
```

Then visit `http://localhost:8000`. Publishing from HTML Studio writes app listings to `data/app-store.json` through the local server API.

## Server API

- `GET /api/apps` lists published apps.
- `POST /api/publish` accepts `{ "name", "author", "description", "html" }` and stores an HTML-only app listing.
