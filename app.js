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

const readyMadeApps = [
  { id: 'paint-lite', name: 'Paint Lite', icon: 'PT', description: 'Sketch colorful ideas on a simple canvas.', html: '<!doctype html><html><body style="font-family:system-ui;background:#111;color:white"><h1>Paint Lite</h1><canvas width="420" height="260" style="background:white;border-radius:16px"></canvas><script>const c=document.querySelector("canvas"),x=c.getContext("2d");let d=false;c.onpointerdown=e=>{d=true;x.moveTo(e.offsetX,e.offsetY)};c.onpointerup=()=>d=false;c.onpointermove=e=>{if(d){x.lineTo(e.offsetX,e.offsetY);x.stroke()}}<\/script></body></html>' },
  { id: 'tasks-pro', name: 'Tasks Pro', icon: 'TS', description: 'A tiny checklist for daily focus.', html: '<!doctype html><html><body style="font-family:system-ui;padding:24px"><h1>Tasks Pro</h1><input id="i"><button onclick="l.innerHTML+=`<li>${i.value}</li>`;i.value=``">Add</button><ul id="l"></ul></body></html>' },
  { id: 'weather-card', name: 'Weather Card', icon: 'WX', description: 'A beautiful offline weather mockup.', html: '<!doctype html><html><body style="font-family:system-ui;background:linear-gradient(135deg,#38bdf8,#6366f1);color:white;padding:32px"><h1>24° Sunny</h1><p>Perfect day to build with RohanOS.</p></body></html>' },
  { id: 'markdown-pad', name: 'Markdown Pad', icon: 'MD', description: 'Write markdown-style notes in a clean editor.', html: '<!doctype html><html><body style="font-family:system-ui;margin:0;padding:24px"><h1>Markdown Pad</h1><textarea style="width:100%;height:280px"># Hello RohanOS</textarea></body></html>' }
];

function installedApps() {
  return store.get('installedApps', []);
}

function installApp(id) {
  const app = readyMadeApps.find((item) => item.id === id);
  if (!app) return;
  const installed = installedApps().filter((item) => item.id !== id);
  store.set('installedApps', [app, ...installed]);
  renderAppStore();
  renderInstalledApps();
  alert(`${app.name} installed.`);
}

function uninstallApp(id) {
  store.set('installedApps', installedApps().filter((item) => item.id !== id));
  renderAppStore();
  renderInstalledApps();
}

function openInstalledApp(id) {
  const app = installedApps().find((item) => item.id === id);
  if (!app) return;
  const desktop = $('#storeDesktop');
  const viewer = $('#installedPreview');
  if (desktop) {
    desktop.innerHTML = `<section class="window app-window"><div class="window-title"><span class="dot red"></span><span class="dot green"></span><span class="dot yellow"></span><strong>${app.name}</strong><button class="button secondary" onclick="closeAppWindow()">Close</button></div><iframe class="preview" title="${app.name}"></iframe></section>`;
    desktop.querySelector('iframe').srcdoc = app.html;
    return;
  }
  if (viewer) viewer.srcdoc = app.html;
}

function closeAppWindow() {
  const desktop = $('#storeDesktop');
  if (desktop) desktop.innerHTML = '<p class="muted">Select an installed app to open it in a RohanOS window.</p>';
}

function renderAppStore() {
  const target = $('#readyApps');
  if (!target) return;
  const installed = new Set(installedApps().map((app) => app.id));
  target.innerHTML = readyMadeApps.map((app) => `<article class="app-card"><h3><span class="app-mark">${app.icon}</span> ${app.name}</h3><p class="muted">${app.description}</p><button class="button" onclick="installApp('${app.id}')">${installed.has(app.id) ? 'Reinstall' : 'Install'}</button></article>`).join('');
}

function renderInstalledApps() {
  const target = $('#installedApps');
  if (!target) return;
  const apps = installedApps();
  target.innerHTML = apps.map((app) => `<article class="app-card"><h3><span class="app-mark">${app.icon}</span> ${app.name}</h3><p class="muted">${app.description}</p><p class="row"><button class="button" onclick="openInstalledApp('${app.id}')">Open</button><button class="button secondary" onclick="uninstallApp('${app.id}')">Remove</button></p></article>`).join('') || '<p class="muted">No apps installed yet. Install one from the Ready Made Apps section.</p>';
}

const fileReaders = {
  image(file, dataUrl) {
    return `<img src="${dataUrl}" alt="${file.name}" style="max-width:100%;border-radius:18px">`;
  },
  html(file, text) {
    return `<iframe class="preview" title="${file.name}" srcdoc="${text.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"></iframe>`;
  },
  text(file, text) {
    return `<textarea id="textEditor" spellcheck="false">${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</textarea><p class="row"><button class="button" onclick="downloadBlob(new Blob([textEditor.value],{type:'text/plain'}),'${file.name}')">Save text file</button></p>`;
  },
  pdf(file, dataUrl) {
    return `<iframe class="preview" title="${file.name}" src="${dataUrl}"></iframe><div class="item"><strong>PDF editor tools</strong><p class="muted">Browser-native PDF editing is limited, so RohanOS adds editable annotation notes you can export beside the PDF.</p><textarea id="pdfNotes" placeholder="Add PDF notes, corrections, signatures, or revision comments..."></textarea><p><button class="button" onclick="downloadBlob(new Blob([pdfNotes.value],{type:'text/plain'}),'${file.name}.notes.txt')">Export PDF notes</button></p></div>`;
  }
};

function handleFileUpload(event) {
  const file = event.target.files[0];
  const target = $('#fileViewer');
  if (!file || !target) return;
  const reader = new FileReader();
  reader.onload = () => {
    const value = reader.result;
    if (file.type.startsWith('image/')) target.innerHTML = fileReaders.image(file, value);
    else if (file.type === 'application/pdf') target.innerHTML = fileReaders.pdf(file, value);
    else if (file.type === 'text/html' || file.name.endsWith('.html')) target.innerHTML = fileReaders.html(file, String(value));
    else target.innerHTML = fileReaders.text(file, String(value));
  };
  if (file.type.startsWith('image/') || file.type === 'application/pdf') reader.readAsDataURL(file);
  else reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', () => {
  renderAppStore();
  renderInstalledApps();
});

const defaultProfile = {
  owner: 'Rohan',
  theme: 'Nebula Desktop',
  accent: '#ff8a00',
  accent2: '#00c8ff',
  wallpaper: 'swirl',
  density: 'comfortable',
  dock: 'center',
  font: 'system',
  password: '',
  highContrast: false,
  reduceMotion: false,
  setupComplete: false
};

function profile() {
  return { ...defaultProfile, ...store.get('profile', {}) };
}

function applySettings() {
  const current = profile();
  document.documentElement.style.setProperty('--accent', current.accent);
  document.documentElement.style.setProperty('--accent-2', current.accent2);
  document.body.dataset.wallpaper = current.wallpaper;
  document.body.dataset.density = current.density;
  document.body.dataset.font = current.font;
  document.body.dataset.contrast = current.highContrast ? 'high' : 'normal';
  document.body.dataset.reduceMotion = current.reduceMotion ? 'true' : 'false';
  const taskbar = $('.taskbar');
  if (taskbar) taskbar.style.justifyContent = current.dock;
  $$('[data-owner]').forEach((node) => { node.textContent = current.owner; });
}

function saveFullSettings() {
  const current = profile();
  const next = {
    ...current,
    owner: $('#owner')?.value || current.owner,
    theme: $('#theme')?.value || current.theme,
    accent: $('#accent')?.value || current.accent,
    accent2: $('#accent2')?.value || current.accent2,
    wallpaper: $('#wallpaper')?.value || current.wallpaper,
    density: $('#density')?.value || current.density,
    dock: $('#dock')?.value || current.dock,
    font: $('#font')?.value || current.font,
    password: $('#password')?.value || current.password,
    highContrast: $('#highContrast')?.checked ?? current.highContrast,
    reduceMotion: $('#reduceMotion')?.checked ?? current.reduceMotion,
    setupComplete: true
  };
  store.set('profile', next);
  applySettings();
  alert('RohanOS settings applied.');
}

function hydrateSettingsForm() {
  const current = profile();
  if ($('#owner')) $('#owner').value = current.owner;
  if ($('#theme')) $('#theme').value = current.theme;
  if ($('#accent')) $('#accent').value = current.accent;
  if ($('#accent2')) $('#accent2').value = current.accent2;
  if ($('#wallpaper')) $('#wallpaper').value = current.wallpaper;
  if ($('#density')) $('#density').value = current.density;
  if ($('#dock')) $('#dock').value = current.dock;
  if ($('#font')) $('#font').value = current.font;
  if ($('#password')) $('#password').value = current.password;
  if ($('#highContrast')) $('#highContrast').checked = current.highContrast;
  if ($('#reduceMotion')) $('#reduceMotion').checked = current.reduceMotion;
}


function openSetupWizard(force = false) {
  const overlay = $('#setupWizard');
  if (!overlay) return;
  if (force || !profile().setupComplete) overlay.classList.add('show');
}

function completeSetupWizard() {
  saveFullSettings();
  $('#setupWizard')?.classList.remove('show');
}

function renderAppBucket() {
  const target = $('#appBucket');
  if (!target) return;
  const systemApps = [
    ['ST', 'HTML Studio', 'studio.html', 'Build and publish browser apps'],
    ['AS', 'App Store', 'appstore.html', 'Install ready made apps'],
    ['FL', 'Files', 'files.html', 'Open HTML, images, PDFs, and text'],
    ['SE', 'Settings', 'settings.html', 'Customize the desktop'],
    ['NP', 'Notepad', 'notes.html', 'Write and export notes'],
    ['CA', 'Calculator', 'calculator.html', 'Calculate quickly'],
    ['WB', 'Browser', 'browser.html', 'Search the web'],
    ['MU', 'Music', 'music.html', 'Play focus tracks'],
    ['GA', 'Gallery', 'gallery.html', 'Browse visuals'],
    ['CL', 'Calendar', 'calendar.html', 'See your day']
  ];
  const installed = installedApps().map((app) => [app.icon, app.name, 'appstore.html', app.description]);
  target.innerHTML = [...systemApps, ...installed].map(([icon, name, href, desc]) => `<a class="app-card" href="${href}"><span class="app-mark">${icon}</span><strong>${name}</strong><span class="muted">${desc}</span></a>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  applySettings();
  hydrateSettingsForm();
  renderAppBucket();
  openSetupWizard(false);
});

function saveSetting() {
  saveFullSettings();
}

function loadSettings() {
  hydrateSettingsForm();
  applySettings();
}

let setupStep = 1;
function showSetupStep(step) {
  setupStep = Math.max(1, Math.min(4, step));
  document.documentElement.style.setProperty('--setup-step', setupStep);
  $$('.setup-step').forEach((node) => node.classList.toggle('active', Number(node.dataset.step) === setupStep));
  const label = $('#setupStepLabel');
  if (label) label.textContent = `Step ${setupStep} of 4`;
  refreshSetupPreview();
}

function nextSetupStep() {
  if (setupStep < 4) showSetupStep(setupStep + 1);
}

function previousSetupStep() {
  if (setupStep > 1) showSetupStep(setupStep - 1);
}

function refreshSetupPreview() {
  const preview = $('#setupPreview');
  if (!preview) return;
  const font = $('#font')?.value || profile().font;
  const accent = $('#accent')?.value || profile().accent;
  const accent2 = $('#accent2')?.value || profile().accent2;
  const owner = $('#owner')?.value || profile().owner;
  preview.style.fontFamily = font === 'serif' ? 'Georgia, serif' : font === 'mono' ? 'Consolas, monospace' : font === 'rounded' ? 'ui-rounded, Arial, sans-serif' : 'system-ui, sans-serif';
  preview.innerHTML = `<div class="window-title"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span><strong>${owner}'s RohanOS</strong></div><h2 style="margin-bottom:6px">Live setup preview</h2><p class="muted">Font, accent, wallpaper, spacing, and password setup are previewed before you finish.</p><button class="button" style="background:linear-gradient(135deg,${accent},${accent2})">Sample action</button>`;
}

function showSettingsPage(name) {
  $$('.settings-page').forEach((page) => page.classList.toggle('active', page.id === `settings-${name}`));
  $$('.settings-nav button').forEach((button) => button.classList.toggle('active', button.dataset.page === name));
}

document.addEventListener('DOMContentLoaded', () => {
  showSetupStep(1);
  showSettingsPage('appearance');
  ['owner', 'theme', 'accent', 'accent2', 'wallpaper', 'density', 'dock', 'font', 'password', 'highContrast', 'reduceMotion'].forEach((id) => {
    const input = $(`#${id}`);
    if (input) input.addEventListener('input', refreshSetupPreview);
  });
});

function resetSetup() {
  const current = profile();
  store.set('profile', { ...current, setupComplete: false });
  alert('Setup reset. The wizard will show on the desktop again.');
}
