/* Dashboard page logic */
(async function () {
  const user = await bootPage('dashboard', t('dashboard'), { subtitle: t('overview') });
  if (!user) return;
  const main = document.getElementById('page-content');

  main.innerHTML = `
    <!-- Stat cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      ${[
        ['documents', 'documents', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'from-emerald-500 to-emerald-600'],
      ].map(([key, labelKey, icon, grad]) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">${t(labelKey)}</p>
              <p class="text-2xl font-bold text-slate-800 dark:text-white mt-1" id="stat-${key}">—</p>
            </div>
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"/></svg>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Quick search -->
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">${t('quick_search')}</label>
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input id="global-search" type="search" data-i18n-placeholder="quick_search_placeholder" placeholder="${t('quick_search_placeholder')}"
          class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        <div id="search-suggest" class="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden max-h-80 overflow-y-auto"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent activity -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="font-semibold text-slate-800 dark:text-white">${t('recent_activity')}</h2>
        </div>
        <div id="recent-activity" class="divide-y divide-slate-100 dark:divide-slate-700">
          ${Array(5).fill('<div class="px-5 py-3"><div class="h-4 w-2/3 skeleton rounded"></div><div class="h-3 w-1/3 skeleton rounded mt-2"></div></div>').join('')}
        </div>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-white">${t('new_residents')}</h2>
            <a href="/residents.html" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">${t('view_all')}</a>
          </div>
          <div id="recent-residents" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(4).fill('<div class="px-5 py-3"><div class="h-4 w-2/3 skeleton rounded"></div><div class="h-3 w-1/3 skeleton rounded mt-2"></div></div>').join('')}
          </div>
        </div>
      </div>
    </div>
  `;

  // --- Quick search with suggestions ---
  const searchInput = document.getElementById('global-search');
  const suggestBox = document.getElementById('search-suggest');
  let debounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounce);
    const q = searchInput.value.trim();
    if (q.length < 2) { suggestBox.classList.add('hidden'); return; }
    debounce = setTimeout(async () => {
      try {
        const res = await api.get('/residents/suggest', { q, limit: 8 });
        if (!res.items || !res.items.length) {
          suggestBox.innerHTML = `<div class="px-4 py-3 text-sm text-slate-500">${t('no_residents_found')}</div>`;
        } else {
          suggestBox.innerHTML = res.items.map(it => `
            <a href="/residents.html?id=${it.id}" class="block px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <div class="text-sm font-medium text-slate-800 dark:text-white">${escapeHtml(it.name || '(no name)')}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(it.resident_id)}${it.village ? ' · ' + escapeHtml(it.village) : ''}${it.mobile ? ' · ' + escapeHtml(it.mobile) : ''}</div>
            </a>
          `).join('');
        }
        suggestBox.classList.remove('hidden');
      } catch (e) { /* ignore */ }
    }, 250);
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim();
      if (q) window.location.href = `/residents.html?q=${encodeURIComponent(q)}`;
    }
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#global-search') && !e.target.closest('#search-suggest')) {
      suggestBox.classList.add('hidden');
    }
  });

  // --- Load stats ---
  try {
    const s = await api.get('/dashboard/stats');
    document.getElementById('stat-documents').textContent = s.total_documents;

    const actEl = document.getElementById('recent-activity');
    if (!s.recent_activity.length) {
      actEl.innerHTML = `<div class="px-5 py-8 text-center text-sm text-slate-500">${t('no_activity')}</div>`;
    } else {
      actEl.innerHTML = s.recent_activity.map(a => `
        <div class="px-5 py-3 flex items-start gap-3">
          <div class="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-slate-800 dark:text-white">${escapeHtml(a.description || a.action)}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(a.user_email || 'system')} · ${fmtDateTime(a.created_at)}</p>
          </div>
        </div>
      `).join('');
    }

    const resEl = document.getElementById('recent-residents');
    if (!s.recent_residents.length) {
      resEl.innerHTML = `<div class="px-5 py-8 text-center text-sm text-slate-500">${t('no_residents')}</div>`;
    } else {
      resEl.innerHTML = s.recent_residents.map(r => `
        <a href="/residents.html?id=${r.id}" class="block px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <div class="text-sm font-medium text-slate-800 dark:text-white">${escapeHtml(r.name || '(no name)')}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(r.resident_id)}${r.village ? ' · ' + escapeHtml(r.village) : ''} · ${fmtDate(r.created_at)}</div>
        </a>
      `).join('');
    }
  } catch (e) {
    toast(e.message, 'error');
  }
})();

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
