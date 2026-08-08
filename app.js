const $ = (query) => document.querySelector(query);
const $$ = (query) => [...document.querySelectorAll(query)];
const store = {
  get(key, fallback) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const defaultHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>My RohanOS App</title>
  <style>body{font-family:system-ui;margin:0;padding:32px;background:#111827;color:white}</style>
</head>
<body>
  <h1>Hello from RohanOS Studio</h1>
  <p>This HTML app was created entirely in the browser.</p>
</body>
</html>`;

const settingGroups = [
  'Appearance', 'Wallpaper', 'Accent color', 'Dock', 'Taskbar', 'Desktop icons', 'Window manager', 'Startup',
  'Accounts', 'Privacy', 'Security', 'Notifications', 'Sound', 'Display', 'Keyboard', 'Mouse', 'Trackpad',
  'Network', 'Bluetooth', 'Storage', 'Power', 'Accessibility', 'Developer mode', 'App Store', 'Backups'
];

function tick() {
  const now = new Date();
  $$('[data-clock]').forEach((node) => { node.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); });
  $$('[data-date]').forEach((node) => { node.textContent = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); });
}

function initShell() {
  tick();
  setInterval(tick, 1000);
  renderSettings();
  renderNotes();
  loadStudio();
  loadStore();
}

function renderSettings() {
  const target = $('#settingsGrid');
  if (!target) return;
  const settings = Array.from({ length: 1000 }, (_, index) => {
    const group = settingGroups[index % settingGroups.length];
    return `<article class="item setting"><strong>${String(index + 1).padStart(4, '0')} · ${group}</strong><p class="muted">Fine tune ${group.toLowerCase()} option ${index + 1}.</p></article>`;
  });
  target.innerHTML = settings.join('');
}

function renderNotes() {
  const list = $('#notesList');
  if (!list) return;
  const notes = store.get('notes', []);
  list.innerHTML = notes.map((note, index) => `<article class="item"><strong>${note.title}</strong><p class="muted">${note.body}</p><button class="button secondary" onclick="deleteNote(${index})">Delete</button></article>`).join('') || '<p class="muted">No notes yet. Create your first document.</p>';
}

function addNote() {
  const title = $('#noteTitle').value || 'Untitled note';
  const body = $('#noteBody').value || '';
  store.set('notes', [{ title, body, createdAt: new Date().toISOString() }, ...store.get('notes', [])]);
  $('#noteTitle').value = '';
  $('#noteBody').value = '';
  renderNotes();
}

function deleteNote(index) {
  const notes = store.get('notes', []);
  notes.splice(index, 1);
  store.set('notes', notes);
  renderNotes();
}

function downloadNote() {
  const title = ($('#noteTitle').value || 'rohanos-note').replace(/[^a-z0-9-]/gi, '-');
  const blob = new Blob([$('#noteBody').value || ''], { type: 'text/plain' });
  downloadBlob(blob, `${title}.txt`);
}

function calc(value) {
  if (!/^[\d\s+\-*/().%]+$/.test(value)) {
    $('#calcDisplay').value = 'Only math symbols allowed';
    return;
  }
  $('#calcDisplay').value = Function(`"use strict"; return (${value})`)();
}

function loadStudio() {
  if (!$('#htmlCode')) return;
  const draft = store.get('studioDraft', { name: 'My HTML App', author: 'Rohan', description: 'A browser-made HTML app.', html: defaultHtml });
  $('#appName').value = draft.name;
  $('#appAuthor').value = draft.author;
  $('#appDescription').value = draft.description;
  $('#htmlCode').value = draft.html;
  updatePreview();
}

function saveStudio() {
  store.set('studioDraft', studioPayload());
  alert('HTML app draft saved in this browser.');
}

function studioPayload() {
  return {
    name: $('#appName').value || 'Untitled HTML App',
    author: $('#appAuthor').value || 'RohanOS Creator',
    description: $('#appDescription').value || 'Created in RohanOS Studio',
    html: $('#htmlCode').value || defaultHtml
  };
}

function updatePreview() {
  const preview = $('#preview');
  if (preview) preview.srcdoc = $('#htmlCode').value;
}

function downloadHtml() {
  const payload = studioPayload();
  const filename = `${payload.name.replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'rohanos-app'}.html`;
  downloadBlob(new Blob([payload.html], { type: 'text/html' }), filename);
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function publishApp() {
  const payload = { ...studioPayload(), id: Date.now().toString(36), createdAt: new Date().toISOString() };
  try {
    const response = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (response.ok) {
      alert('Published to the RohanOS server App Store.');
      return;
    }
  } catch (error) {
    console.info('Server publishing unavailable; using browser-only GitHub Pages mode.', error);
  }
  store.set('publishedApps', [payload, ...store.get('publishedApps', [])]);
  alert('Published in browser-only mode. On GitHub Pages this app is saved to this browser.');
}

async function loadStore() {
  const target = $('#storeList');
  if (!target) return;
  const localApps = store.get('publishedApps', []);
  let serverApps = [];
  try {
    const response = await fetch('/api/apps');
    if (response.ok) serverApps = await response.json();
  } catch (error) {
    console.info('Server app store unavailable; showing browser-only apps.', error);
  }
  const apps = [...serverApps, ...localApps];
  target.innerHTML = apps.map((app) => `<article class="app-card"><h3>${app.name}</h3><p class="muted">${app.description}</p><small>By ${app.author}</small></article>`).join('') || '<p class="muted">No published apps yet. Use Studio to publish one.</p>';
}

function saveSetting() {
  store.set('profile', { owner: $('#owner').value, theme: $('#theme').value });
  alert('Desktop setup saved.');
}

function loadSettings() {
  const profile = store.get('profile', { owner: 'Rohan', theme: 'Nebula Desktop' });
  if ($('#owner')) $('#owner').value = profile.owner;
  if ($('#theme')) $('#theme').value = profile.theme;
}

document.addEventListener('DOMContentLoaded', initShell);
