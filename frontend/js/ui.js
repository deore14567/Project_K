/**
 * UI helpers: theme toggle, toast, sidebar, copy-to-clipboard,
 * loading skeletons, modal, badge helpers.
 */

// --- Theme ---------------------------------------------------------------
function applyStoredTheme() {
  const t = localStorage.getItem('vs_theme') || 'light';
  document.documentElement.classList.toggle('dark', t === 'dark');
}
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('vs_theme', isDark ? 'dark' : 'light');
}
applyStoredTheme();
window.toggleTheme = toggleTheme;

// --- Toast ---------------------------------------------------------------
function toast(message, type = 'info', timeout = 3500) {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'fixed top-4 right-4 z-[100] flex flex-col gap-2';
    document.body.appendChild(host);
  }
  const colors = {
    info:    'bg-slate-800 text-white',
    success: 'bg-emerald-600 text-white',
    error:   'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
  };
  const el = document.createElement('div');
  el.className = `px-4 py-3 rounded-lg shadow-lg text-sm max-w-sm animate-toast-in ${colors[type] || colors.info}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => {
    el.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => el.remove(), 300);
  }, timeout);
}
window.toast = toast;

// --- Copy to clipboard ---------------------------------------------------
async function copyToClipboard(text, label = 'Value') {
  // Ensure text is a string (numbers, etc. get coerced)
  if (text !== null && text !== undefined) text = String(text);
  if (!text) { toast(`${label} is empty`, 'warning'); return; }
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} copied to clipboard`, 'success', 2000);
  } catch (e) {
    // Fallback for non-HTTPS contexts (e.g. localhost without TLS)
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); toast(`${label} copied`, 'success', 2000); }
    catch (_) { toast('Clipboard not available — copy manually', 'error'); }
    ta.remove();
  }
}
window.copyToClipboard = copyToClipboard;

// --- Loading skeleton ----------------------------------------------------
function skeletonRow(cols = 5) {
  return `<tr>${Array(cols).fill('<td><div class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div></td>').join('')}</tr>`;
}
window.skeletonRow = skeletonRow;

// --- Status badge --------------------------------------------------------
function statusBadge(status) {
  const map = {
    applied:    'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
    pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
    approved:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    rejected:   'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200',
    active:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    closed:     'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200',
    draft:      'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  };
  const cls = map[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}">${status}</span>`;
}
window.statusBadge = statusBadge;

function eligibilityBadge(status) {
  const map = {
    eligible:           'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200',
    possibly_eligible: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
    not_eligible:      'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200',
  };
  const label = status.replace(/_/g, ' ');
  const cls = map[status] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}">${label}</span>`;
}
window.eligibilityBadge = eligibilityBadge;

// --- Date formatting -----------------------------------------------------
function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateTime(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
window.fmtDate = fmtDate;
window.fmtDateTime = fmtDateTime;

// --- Modal helper --------------------------------------------------------
function openModal(html) {
  let host = document.getElementById('modal-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'modal-host';
    host.className = 'fixed inset-0 z-[90] flex items-center justify-center p-4';
    host.style.display = 'none';
    document.body.appendChild(host);
  }
  host.style.display = 'flex';
  host.innerHTML = `
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" data-modal-close></div>
    <div class="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-modal-in">
      ${html}
    </div>
  `;
  host.querySelectorAll('[data-modal-close]').forEach(el =>
    el.addEventListener('click', () => closeModal())
  );
}
function closeModal() {
  const host = document.getElementById('modal-host');
  if (host) {
    host.innerHTML = '';
    host.style.display = 'none';
  }
}
window.openModal = openModal;
window.closeModal = closeModal;

// --- Sidebar / auth gate -------------------------------------------------
function renderSidebar(activeKey) {
  const user = window.auth.getUser();
  if (!user) return '';
  const isAdmin = user.role === 'admin';
  const links = [
    { key: 'dashboard', href: '/dashboard.html',    label: 'डॅशबोर्ड',     i18n: 'dashboard',  icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: 'residents', href: '/residents.html',    label: 'शेतकरी',       i18n: 'residents',  icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0zm6-3a4 4 0 10-8 0 4 4 0 008 0z' },
    { key: 'farmer-card', href: '/farmer-card.html', label: 'शेतकरी कार्ड',  i18n: 'farmer_card', icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0L6 7m6 4l3 1m0 0l-3 9a5.002 5.002 0 006.001 0L18 7m-6 4l6-3m-6 3l-6-3' },
    { key: 'documents', href: '/documents.html',    label: 'कागदपत्रे',     i18n: 'documents',  icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'reports',   href: '/reports.html',      label: 'अहवाल',        i18n: 'reports',    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'audit',     href: '/audit.html',        label: 'ऑडिट लॉग',     i18n: 'audit_logs', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z', adminOnly: true },
    { key: 'users',     href: '/users.html',        label: 'वापरकर्ते',     i18n: 'users',      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', adminOnly: true },
  ];

  return `
    <aside id="sidebar" class="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transform -translate-x-full lg:translate-x-0 transition-transform duration-200 flex flex-col">
      <div class="px-4 py-4 border-b border-slate-200 dark:border-slate-700">
        <a href="/dashboard.html" class="flex items-center gap-2">
          <img src="/assets/logo.jpeg" alt="Logo" class="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
          <div class="min-w-0">
            <div class="font-bold text-slate-800 dark:text-white text-sm leading-tight">आशापुरी कॉम्प्युटर</div>
            <div class="font-bold text-slate-800 dark:text-white text-sm leading-tight">सर्विस कर्ले 💻</div>
          </div>
        </a>
      </div>
      <nav class="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        ${links.filter(l => !l.adminOnly || isAdmin).map(l => `
          <a href="${l.href}" data-i18n="${l.i18n}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${l.key === activeKey ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'}">
            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${l.icon}"/></svg>
            <span>${l.label}</span>
          </a>
        `).join('')}
      </nav>
      <div class="px-3 py-4 border-t border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
          <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold uppercase">${(user.full_name || user.email || '?')[0]}</div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-slate-800 dark:text-white truncate">${user.full_name}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 capitalize">${user.role}</div>
          </div>
          <button onclick="doLogout()" title="Logout" class="text-slate-400 hover:text-rose-500">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </div>
    </aside>
    <div id="sidebar-backdrop" class="fixed inset-0 bg-black/40 z-30 lg:hidden hidden" onclick="toggleSidebar(false)"></div>
  `;
}
window.renderSidebar = renderSidebar;

function toggleSidebar(open) {
  const sb = document.getElementById('sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  if (!sb) return;
  if (open === undefined) open = sb.classList.contains('-translate-x-full');
  sb.classList.toggle('-translate-x-full', !open);
  if (bd) bd.classList.toggle('hidden', !open);
}
window.toggleSidebar = toggleSidebar;

// --- Topbar --------------------------------------------------------------
function renderTopbar(title, opts = {}) {
  const user = window.auth.getUser();
  const isAdmin = user && user.role === 'admin';
  const lang = window.getLang ? window.getLang() : 'en';
  return `
    <header class="sticky top-0 z-20 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div class="flex items-center gap-3 px-4 lg:px-6 py-3">
        <button onclick="toggleSidebar()" class="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-base lg:text-lg font-bold text-slate-800 dark:text-white truncate">${title}</h1>
          ${opts.subtitle ? `<p class="text-xs text-slate-500 dark:text-slate-400 truncate">${opts.subtitle}</p>` : ''}
        </div>
        <!-- Language toggle -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
          <button onclick="changeLang('en')" class="px-2 py-1 text-xs font-medium rounded ${lang === 'en' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}">EN</button>
          <button onclick="changeLang('mr')" class="px-2 py-1 text-xs font-medium rounded ${lang === 'mr' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}">मराठी</button>
        </div>
        <button onclick="toggleTheme()" class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300" title="Toggle theme">
          <svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
          <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </button>
        ${opts.actions || ''}
      </div>
    </header>
  `;
}
window.renderTopbar = renderTopbar;

// --- Language change handler ---------------------------------------------
window.changeLang = (lang) => {
  window.setLang(lang);
  // Re-render the current page by reloading — simplest reliable approach
  window.location.reload();
};

// --- Page bootstrap ------------------------------------------------------
async function bootPage(activeKey, title, opts = {}) {
  // Auth gate
  const user = window.auth.getUser();
  if (!user || !window.auth.getToken()) {
    window.location.href = '/login.html';
    return null;
  }
  // Role gate
  if (opts.adminOnly && user.role !== 'admin') {
    document.body.innerHTML = `<div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div class="text-center"><h1 class="text-2xl font-bold text-rose-600">Access Denied</h1><p class="mt-2 text-slate-600 dark:text-slate-400">You need administrator privileges to view this page.</p><a href="/dashboard.html" class="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg">Go to Dashboard</a></div></div>`;
    return null;
  }
  const root = document.getElementById('app');
  if (root) {
    root.innerHTML = `
      <div class="min-h-screen flex bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        ${renderSidebar(activeKey)}
        <div class="flex-1 flex flex-col min-w-0">
          ${renderTopbar(title, opts)}
          <main class="flex-1 p-4 lg:p-6" id="page-content">
            ${opts.placeholder || '<div class="text-slate-500">Loading...</div>'}
          </main>
          <footer class="px-6 py-3 text-center text-xs text-slate-400 border-t border-slate-200 dark:border-slate-700">
            आशापुरी कॉम्प्युटर सर्विस कर्ले 💻 &copy; ${new Date().getFullYear()}
          </footer>
        </div>
      </div>
    `;
    // Translate static sidebar/topbar elements
    if (window.applyTranslations) window.applyTranslations();
  }
  return user;
}
window.bootPage = bootPage;

async function doLogout() {
  try { await window.api.post('/auth/logout', {}); } catch (e) { /* ignore */ }
  window.auth.clearSession();
  window.location.href = '/login.html';
}
window.doLogout = doLogout;

// --- Copy button helper --------------------------------------------------
// Uses data attributes + event delegation to avoid HTML-escaping issues
// with inline onclick handlers (double quotes in JSON.stringify broke
// the onclick attribute).
function copyButton(value, label) {
  // Encode value & label as base64 to survive HTML attribute parsing unscathed
  const encodedValue = btoa(unescape(encodeURIComponent(String(value || ''))));
  const encodedLabel = btoa(unescape(encodeURIComponent(String(label || 'Value'))));
  return `<button data-copy-value="${encodedValue}" data-copy-label="${encodedLabel}" class="copy-btn ml-1 inline-flex items-center text-slate-400 hover:text-indigo-600" title="Copy ${label || 'value'}">
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
  </button>`;
}
window.copyButton = copyButton;

// Event delegation: any element with class "copy-btn" triggers copy
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  const value = decodeURIComponent(escape(atob(btn.dataset.copyValue || '')));
  const label = decodeURIComponent(escape(atob(btn.dataset.copyLabel || 'Value')));
  copyToClipboard(value, label);
});

// --- HTML escape ---------------------------------------------------------
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
window.escapeHtml = escapeHtml;

// --- Query param helper --------------------------------------------------
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}
window.getQueryParam = getQueryParam;

// --- Download menu toggle ------------------------------------------------
function toggleDownloadMenu() {
  const menu = document.getElementById('download-menu');
  if (!menu) return;
  menu.classList.toggle('hidden');
}
window.toggleDownloadMenu = toggleDownloadMenu;

// Close any open download menu when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('#download-menu-wrap') && !e.target.closest('#download-menu')) {
    const menu = document.getElementById('download-menu');
    if (menu) menu.classList.add('hidden');
  }
});

// --- Generic report download helper --------------------------------------
async function downloadReport(entity, fmt, params = '') {
  try {
    // NOTE: api.get() already prepends API_BASE ('/api'), so the path
    // here must NOT include the /api prefix.
    const path = `/reports/${entity}.${fmt}${params ? '?' + params : ''}`;
    const blob = await window.api.get(path);
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    a.download = `${entity}_${ts}.${fmt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    toast(`${entity} report downloaded as ${fmt.toUpperCase()}`, 'success');
    const menu = document.getElementById('download-menu');
    if (menu) menu.classList.add('hidden');
  } catch (e) {
    toast(`Download failed: ${e.message}`, 'error');
  }
}
window.downloadReport = downloadReport;

// --- Print ---------------------------------------------------------------
function printContent(html, title = 'Village Setu') {
  const w = window.open('', '_blank', 'width=900,height=650');
  if (!w) { toast('Pop-up blocked. Please allow pop-ups.', 'error'); return; }
  w.document.write(`<!doctype html><html><head><title>${title}</title>
    <link rel="stylesheet" href="/css/tailwind.css" />
    <style>@media print { .no-print { display: none; } body { padding: 24px; } }</style>
  </head><body class="bg-white text-slate-800">${html}
  <div class="no-print mt-6"><button onclick="window.print()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg">Print</button>
  <button onclick="window.close()" class="px-4 py-2 bg-slate-200 rounded-lg ml-2">Close</button></div>
  </body></html>`);
  w.document.close();
}
window.printContent = printContent;
