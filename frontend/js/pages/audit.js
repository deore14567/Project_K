/* Audit logs page */
(async function () {
  const user = await bootPage('audit', 'Audit Logs', { subtitle: 'System activity trail' });
  if (!user) return;
  const main = document.getElementById('page-content');

  const state = { page: 1, per_page: 30, q: '', action: '' };
  const isAdmin = user.role === 'admin';

  main.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="f-q" type="search" placeholder="Search description, email, entity…" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        <select id="f-action" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
          <option value="">All Actions</option>
          ${['login', 'logout', 'login_failed', 'create_user', 'update_user', 'delete_user',
             'create_resident', 'update_resident', 'delete_resident',
             'create_family', 'update_family', 'delete_family',
             'upload_document', 'download_document', 'delete_document',
             'create_scheme', 'update_scheme', 'delete_scheme',
             'create_application', 'update_application', 'delete_application'].map(a => `<option value="${a}">${a}</option>`).join('')}
        </select>
        <button id="btn-search" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Apply</button>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">When</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">IP</th>
            </tr>
          </thead>
          <tbody id="audit-tbody" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(8).fill(skeletonRow(5)).join('')}
          </tbody>
        </table>
      </div>
      <div id="pagination" class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm"></div>
    </div>
    ${!isAdmin ? `<p class="mt-4 text-xs text-slate-500">You are viewing only your own activity. Administrators can see all entries.</p>` : ''}
  `;

  document.getElementById('btn-search').addEventListener('click', () => {
    state.q = document.getElementById('f-q').value.trim();
    state.action = document.getElementById('f-action').value;
    state.page = 1;
    loadList();
  });

  async function loadList() {
    const tbody = document.getElementById('audit-tbody');
    tbody.innerHTML = Array(5).fill(skeletonRow(5)).join('');
    try {
      const res = await api.get('/audit', { page: state.page, per_page: state.per_page, q: state.q, action: state.action });
      if (!res.items.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-10 text-center text-slate-500">No activity yet.</td></tr>`;
      } else {
        tbody.innerHTML = res.items.map(a => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <td class="px-4 py-3 text-xs text-slate-500">${fmtDateTime(a.created_at)}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(a.user_email || '—')}</td>
            <td class="px-4 py-3"><code class="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">${escapeHtml(a.action)}</code></td>
            <td class="px-4 py-3 text-sm text-slate-800 dark:text-white">${escapeHtml(a.description || '—')}</td>
            <td class="px-4 py-3 text-xs text-slate-500 font-mono">${escapeHtml(a.ip_address || '—')}</td>
          </tr>
        `).join('');
      }
      const p = document.getElementById('pagination');
      const from = res.total === 0 ? 0 : (res.page - 1) * res.per_page + 1;
      const to = Math.min(res.page * res.per_page, res.total);
      p.innerHTML = `
        <div class="text-slate-500">Showing ${from}–${to} of ${res.total}</div>
        <div class="flex items-center gap-2">
          <button ${res.page <= 1 ? 'disabled' : ''} onclick="gotoPage(${res.page - 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">Prev</button>
          <span>Page ${res.page} / ${res.pages}</span>
          <button ${res.page >= res.pages ? 'disabled' : ''} onclick="gotoPage(${res.page + 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">Next</button>
        </div>
      `;
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-10 text-center text-rose-600">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadList(); } };
  await loadList();
})();
