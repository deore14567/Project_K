/* Dashboard page logic */
(async function () {
  const user = await bootPage('dashboard', 'Dashboard', { subtitle: 'Overview of residents, schemes & applications' });
  if (!user) return;
  const main = document.getElementById('page-content');

  main.innerHTML = `
    <!-- Stat cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
      ${[
        ['Total Residents', 'residents', 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0z', 'from-blue-500 to-blue-600'],
        ['Total Families', 'families', 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', 'from-purple-500 to-purple-600'],
        ['Documents', 'documents', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', 'from-emerald-500 to-emerald-600'],
        ['Active Schemes', 'schemes', 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1', 'from-amber-500 to-amber-600'],
        ['Pending Apps', 'pending', 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', 'from-orange-500 to-orange-600'],
        ['Approved', 'approved', 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', 'from-green-500 to-green-600'],
        ['Rejected', 'rejected', 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z', 'from-rose-500 to-rose-600'],
      ].map(([label, key, icon, grad]) => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">${label}</p>
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
      <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Quick Global Search</label>
      <div class="relative">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        <input id="global-search" type="search" placeholder="Search residents, schemes, applications, families…"
          class="w-full pl-11 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
        <div id="search-suggest" class="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden max-h-80 overflow-y-auto"></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Recent activity -->
      <div class="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 class="font-semibold text-slate-800 dark:text-white">Recent Activity</h2>
          <a href="/audit.html" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">View all</a>
        </div>
        <div id="recent-activity" class="divide-y divide-slate-100 dark:divide-slate-700">
          ${Array(5).fill('<div class="px-5 py-3"><div class="h-4 w-2/3 skeleton rounded"></div><div class="h-3 w-1/3 skeleton rounded mt-2"></div></div>').join('')}
        </div>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-white">New Residents</h2>
            <a href="/residents.html" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">All</a>
          </div>
          <div id="recent-residents" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(4).fill('<div class="px-5 py-3"><div class="h-4 w-2/3 skeleton rounded"></div><div class="h-3 w-1/3 skeleton rounded mt-2"></div></div>').join('')}
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 class="font-semibold text-slate-800 dark:text-white">Latest Schemes</h2>
            <a href="/schemes.html" class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">All</a>
          </div>
          <div id="latest-schemes" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(3).fill('<div class="px-5 py-3"><div class="h-4 w-2/3 skeleton rounded"></div><div class="h-3 w-1/3 skeleton rounded mt-2"></div></div>').join('')}
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
          suggestBox.innerHTML = `<div class="px-4 py-3 text-sm text-slate-500">No residents matched. Press Enter for full search.</div>`;
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
    document.getElementById('stat-residents').textContent = s.total_residents;
    document.getElementById('stat-families').textContent  = s.total_families;
    document.getElementById('stat-documents').textContent = s.total_documents;
    document.getElementById('stat-schemes').textContent   = s.total_schemes;
    document.getElementById('stat-pending').textContent   = s.pending_applications;
    document.getElementById('stat-approved').textContent  = s.approved_applications;
    document.getElementById('stat-rejected').textContent  = s.rejected_applications;

    const actEl = document.getElementById('recent-activity');
    if (!s.recent_activity.length) {
      actEl.innerHTML = `<div class="px-5 py-8 text-center text-sm text-slate-500">No activity yet.</div>`;
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
      resEl.innerHTML = `<div class="px-5 py-8 text-center text-sm text-slate-500">No residents yet.</div>`;
    } else {
      resEl.innerHTML = s.recent_residents.map(r => `
        <a href="/residents.html?id=${r.id}" class="block px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <div class="text-sm font-medium text-slate-800 dark:text-white">${escapeHtml(r.name || '(no name)')}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${escapeHtml(r.resident_id)}${r.village ? ' · ' + escapeHtml(r.village) : ''} · ${fmtDate(r.created_at)}</div>
        </a>
      `).join('');
    }

    const schEl = document.getElementById('latest-schemes');
    if (!s.latest_schemes.length) {
      schEl.innerHTML = `<div class="px-5 py-8 text-center text-sm text-slate-500">No schemes yet.</div>`;
    } else {
      schEl.innerHTML = s.latest_schemes.map(sc => `
        <a href="/schemes.html?id=${sc.id}" class="block px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50">
          <div class="flex items-center justify-between gap-2">
            <div class="text-sm font-medium text-slate-800 dark:text-white truncate">${escapeHtml(sc.name)}</div>
            ${statusBadge(sc.status)}
          </div>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Added ${fmtDate(sc.created_at)}</div>
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
