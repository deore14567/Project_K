/* Farmers page — list + profile view + add/edit modal */
(async function () {
  const user = await bootPage('residents', t('residents'), {
    subtitle: t('manage_residents'),
    actions: `
      <button onclick="openResidentForm()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        ${t('add_resident')}
      </button>
    `,
  });
  if (!user) return;
  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const main = document.getElementById('page-content');

  const editId = getQueryParam('id');
  if (editId) {
    return showProfile(parseInt(editId, 10));
  }

  // --- List view ---
  const state = {
    page: 1, per_page: 20, q: getQueryParam('q') || '',
    village: '', ward: '', category: '', gender: '', sort: 'created_at:desc',
    selectedIds: new Set(),   // tracks selected resident IDs across pages
  };

  main.innerHTML = `
    <!-- Filters -->
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <input id="f-q" type="search" placeholder="Search name, ID, mobile, PAN…" value="${escapeHtml(state.q)}"
          class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <input id="f-village" type="text" placeholder="Village"
          class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <select id="f-category" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Categories</option>
          <option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option>
        </select>
        <select id="f-gender" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">All Genders</option>
          <option>Male</option><option>Female</option><option>Other</option>
        </select>
      </div>
      <div class="mt-3 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <button id="btn-search" class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Search</button>
          <button id="btn-reset" class="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg">Reset</button>
          <select id="f-sort" class="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="first_name:asc">Name A→Z</option>
            <option value="first_name:desc">Name Z→A</option>
            <option value="age:desc">Age (high→low)</option>
          </select>
        </div>
        <div class="relative" id="download-menu-wrap">
          <button onclick="toggleDownloadMenu()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Download List
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
          <div id="download-menu" class="hidden absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 py-1">
            <button onclick="downloadReport('residents', 'xlsx')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📊 Excel (.xlsx)</button>
            <button onclick="downloadReport('residents', 'pdf')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📄 PDF (.pdf)</button>
            <button onclick="downloadReport('residents', 'docx')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📝 Word (.docx)</button>
            <button onclick="downloadReport('residents', 'csv')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">🗂️ CSV (.csv)</button>
            <button onclick="downloadReport('residents', 'txt')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📃 Text (.txt)</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Selection bar (hidden when nothing selected) -->
    <div id="selection-bar" class="hidden bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold" id="selection-count">0</span>
        <span class="text-sm font-medium text-indigo-700 dark:text-indigo-300">farmer<span id="selection-plural">s</span> selected</span>
        <button onclick="clearSelection()" class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline ml-2">Clear selection</button>
      </div>
      <div class="relative" id="custom-download-wrap">
        <button onclick="toggleCustomDownloadMenu()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Download Selected
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <div id="custom-download-menu" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-10 py-1">
          <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">List title (optional)</label>
            <input id="custom-title" type="text" placeholder="e.g. PM Awas Beneficiaries"
              class="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white" />
          </div>
          <button onclick="downloadSelected('xlsx')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📊 Excel (.xlsx)</button>
          <button onclick="downloadSelected('pdf')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📄 PDF (.pdf)</button>
          <button onclick="downloadSelected('docx')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📝 Word (.docx)</button>
          <button onclick="downloadSelected('csv')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">🗂️ CSV (.csv)</button>
          <button onclick="downloadSelected('txt')" class="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">📃 Text (.txt)</button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 w-10">
                <input id="select-all" type="checkbox" onclick="toggleSelectAll()"
                  class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-white dark:bg-slate-700 cursor-pointer" />
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Farmer</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Contact</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Village / Ward</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Category</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Age</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody id="res-tbody" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(8).fill(skeletonRow(7)).join('')}
          </tbody>
        </table>
      </div>
      <div id="pagination" class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm"></div>
    </div>
  `;

  document.getElementById('btn-search').addEventListener('click', () => {
    state.q = document.getElementById('f-q').value.trim();
    state.village = document.getElementById('f-village').value.trim();
    state.category = document.getElementById('f-category').value;
    state.gender = document.getElementById('f-gender').value;
    state.sort = document.getElementById('f-sort').value;
    state.page = 1;
    loadList();
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    document.getElementById('f-q').value = '';
    document.getElementById('f-village').value = '';
    document.getElementById('f-category').value = '';
    document.getElementById('f-gender').value = '';
    document.getElementById('f-sort').value = 'created_at:desc';
    Object.assign(state, { q: '', village: '', category: '', gender: '', sort: 'created_at:desc', page: 1 });
    loadList();
  });
  document.getElementById('f-q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
  });

  async function loadList() {
    const tbody = document.getElementById('res-tbody');
    tbody.innerHTML = Array(6).fill(skeletonRow(6)).join('');
    try {
      const res = await api.get('/residents', {
        page: state.page, per_page: state.per_page,
        q: state.q, village: state.village,
        category: state.category, gender: state.gender,
        sort: state.sort,
      });
      if (!res.items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-10 text-center text-slate-500">No residents found.</td></tr>`;
      } else {
        tbody.innerHTML = res.items.map(r => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer ${state.selectedIds.has(r.id) ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}" onclick="showProfile(${r.id})">
            <td class="px-4 py-3" onclick="event.stopPropagation()">
              <input type="checkbox" data-resident-id="${r.id}" ${state.selectedIds.has(r.id) ? 'checked' : ''}
                onchange="toggleSelectResident(${r.id}, this.checked)"
                class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-white dark:bg-slate-700 cursor-pointer" />
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-slate-800 dark:text-white">${escapeHtml(r.first_name)} ${escapeHtml(r.last_name || '')}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(r.resident_id)}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.mobile_number || '—')}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(r.email || '')}</div>
            </td>
            <td class="px-4 py-3">
              <div class="text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.village || '—')}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">Ward ${escapeHtml(r.ward_number || '—')}</div>
            </td>
            <td class="px-4 py-3"><span class="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">${escapeHtml(r.category || '—')}</span></td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${r.age ?? '—'}</td>
            <td class="px-4 py-3 text-right" onclick="event.stopPropagation()">
              <button onclick="showProfile(${r.id})" class="text-indigo-600 hover:underline text-sm mr-2">View</button>
              <button onclick="openResidentForm(${r.id})" class="text-slate-600 dark:text-slate-300 hover:underline text-sm mr-2">Edit</button>
              ${isAdmin ? `<button onclick="deleteResident(${r.id})" class="text-rose-600 hover:underline text-sm">Delete</button>` : ''}
            </td>
          </tr>
        `).join('');
      }
      updateSelectAllCheckbox(res.items);
      renderPagination(res);
      updateSelectionBar();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-10 text-center text-rose-600">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  // --- Selection helpers ---
  function updateSelectionBar() {
    const count = state.selectedIds.size;
    const bar = document.getElementById('selection-bar');
    if (!bar) return;
    if (count > 0) {
      bar.classList.remove('hidden');
      document.getElementById('selection-count').textContent = count;
      document.getElementById('selection-plural').textContent = count === 1 ? '' : 's';
    } else {
      bar.classList.add('hidden');
    }
  }

  function updateSelectAllCheckbox(items) {
    const cb = document.getElementById('select-all');
    if (!cb) return;
    if (!items.length) {
      cb.checked = false;
      cb.indeterminate = false;
      return;
    }
    const selectedCount = items.filter(i => state.selectedIds.has(i.id)).length;
    cb.checked = selectedCount === items.length;
    cb.indeterminate = selectedCount > 0 && selectedCount < items.length;
  }

  window.toggleSelectAll = () => {
    const cb = document.getElementById('select-all');
    const checkboxes = document.querySelectorAll('[data-resident-id]');
    checkboxes.forEach(c => {
      const id = parseInt(c.dataset.residentId, 10);
      if (cb.checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      c.checked = cb.checked;
    });
    updateSelectionBar();
    // Update row highlight
    document.querySelectorAll('#res-tbody tr').forEach(tr => {
      const cb = tr.querySelector('[data-resident-id]');
      if (cb) {
        tr.classList.toggle('bg-indigo-50', cb.checked);
        tr.classList.toggle('dark:bg-indigo-900/20', cb.checked);
      }
    });
  };

  window.toggleSelectResident = (id, checked) => {
    if (checked) state.selectedIds.add(id);
    else state.selectedIds.delete(id);
    updateSelectionBar();
    // Update select-all state
    const checkboxes = document.querySelectorAll('[data-resident-id]');
    const visibleIds = Array.from(checkboxes).map(c => parseInt(c.dataset.residentId, 10));
    const items = visibleIds.map(i => ({ id: i }));
    updateSelectAllCheckbox(items);
    // Highlight row
    const tr = document.querySelector(`[data-resident-id="${id}"]`)?.closest('tr');
    if (tr) {
      tr.classList.toggle('bg-indigo-50', checked);
      tr.classList.toggle('dark:bg-indigo-900/20', checked);
    }
  };

  window.clearSelection = () => {
    state.selectedIds.clear();
    document.querySelectorAll('[data-resident-id]').forEach(c => { c.checked = false; });
    const selectAll = document.getElementById('select-all');
    if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
    document.querySelectorAll('#res-tbody tr').forEach(tr => {
      tr.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20');
    });
    updateSelectionBar();
  };

  window.toggleCustomDownloadMenu = () => {
    const menu = document.getElementById('custom-download-menu');
    if (menu) menu.classList.toggle('hidden');
  };

  // Close custom download menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#custom-download-wrap') && !e.target.closest('#custom-download-menu')) {
      const menu = document.getElementById('custom-download-menu');
      if (menu) menu.classList.add('hidden');
    }
  });

  window.downloadSelected = async (fmt) => {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) { toast('No residents selected', 'warning'); return; }
    const titleInput = document.getElementById('custom-title');
    const title = titleInput ? titleInput.value.trim() : '';
    // Close menu
    const menu = document.getElementById('custom-download-menu');
    if (menu) menu.classList.add('hidden');
    try {
      const body = { ids };
      if (title) body.title = title;
      const blob = await window.api.post(`/reports/residents/custom.${fmt}`, body);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      a.download = `custom_residents_${ts}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast(`Downloaded ${ids.length} resident${ids.length === 1 ? '' : 's'} as ${fmt.toUpperCase()}`, 'success');
    } catch (e) {
      toast(`Download failed: ${e.message}`, 'error');
    }
  };

  function renderPagination(res) {
    const p = document.getElementById('pagination');
    const from = res.total === 0 ? 0 : (res.page - 1) * res.per_page + 1;
    const to = Math.min(res.page * res.per_page, res.total);
    p.innerHTML = `
      <div class="text-slate-500 dark:text-slate-400">Showing ${from}–${to} of ${res.total}</div>
      <div class="flex items-center gap-2">
        <button ${res.page <= 1 ? 'disabled' : ''} onclick="gotoPage(${res.page - 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">Prev</button>
        <span class="text-slate-600 dark:text-slate-300">Page ${res.page} / ${res.pages}</span>
        <button ${res.page >= res.pages ? 'disabled' : ''} onclick="gotoPage(${res.page + 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">Next</button>
      </div>
    `;
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadList(); } };

  // Expose hoisted functions to window so onclick="..." attributes can call them.
  window.showProfile = showProfile;
  window.deleteResident = deleteResident;

  await loadList();

  // --- Profile view ---
  async function showProfile(id) {
    document.getElementById('page-content').innerHTML = `
      <div class="mb-4">
        <button onclick="history.back()" class="text-sm text-slate-500 hover:text-indigo-600">&larr; Back to list</button>
      </div>
      <div id="profile-host" class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          ${Array(6).fill('<div class="h-4 w-1/2 skeleton rounded mb-3"></div>').join('')}
        </div>
      </div>
    `;
    try {
      const r = await api.get(`/residents/${id}`);
      renderProfile(r);
    } catch (e) {
      document.getElementById('profile-host').innerHTML = `<div class="p-6 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderProfile(r) {
    const host = document.getElementById('profile-host');
    const fullName = `${r.first_name} ${r.middle_name || ''} ${r.last_name || ''}`.trim();

    host.innerHTML = `
      <!-- Header card -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 no-print">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold uppercase">${(r.first_name || '?')[0]}</div>
            <div>
              <h2 class="text-xl font-bold text-slate-800 dark:text-white">${escapeHtml(fullName)}</h2>
              <p class="text-sm text-slate-500 dark:text-slate-400">${escapeHtml(r.resident_id)} · ${escapeHtml(r.gender || '—')} · Age ${r.age ?? '—'}</p>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${escapeHtml(r.village || '')} ${r.ward_number ? '· Ward ' + escapeHtml(r.ward_number) : ''}</p>
            </div>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="printProfile()" class="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm rounded-lg">Print</button>
            <button onclick="openResidentForm(${r.id})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Edit</button>
            ${isAdmin ? `<button onclick="deleteResident(${r.id})" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg">Delete</button>` : ''}
            <a href="/documents.html?resident_id=${r.id}" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg">Documents</a>
            <a href="/applications.html?resident_id=${r.id}" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg">Applications</a>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Personal -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Personal</h3>
          <dl class="space-y-2 text-sm">
            ${fieldRow('First Name', r.first_name)}
            ${fieldRow('Middle Name', r.middle_name)}
            ${fieldRow('Last Name', r.last_name)}
            ${fieldRow('Gender', r.gender)}
            ${fieldRow('DOB', r.dob ? fmtDate(r.dob) : null)}
            ${fieldRow('Age', r.age)}
            ${fieldRow('Religion', r.religion)}
            ${fieldRow('Category', r.category)}
            ${fieldRow('Caste', r.caste)}
            ${fieldRow('Occupation', r.occupation)}
            ${fieldRow('Annual Income', r.annual_income != null ? '₹' + Number(r.annual_income).toLocaleString('en-IN') : null)}
          </dl>
        </div>

        <!-- Contact & address -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">Contact & Address</h3>
          <dl class="space-y-2 text-sm">
            ${fieldRow('Mobile', r.mobile_number, true)}
            ${fieldRow('Alternate', r.alternate_number, true)}
            ${fieldRow('Email', r.email, true)}
            ${fieldRow('Address', r.address, true)}
            ${fieldRow('Village', r.village)}
            ${fieldRow('Taluka', r.taluka)}
            ${fieldRow('District', r.district)}
            ${fieldRow('State', r.state)}
            ${fieldRow('PIN', r.pin_code, true)}
            ${fieldRow('Ward', r.ward_number)}
          </dl>
        </div>

        <!-- Identity -->
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Identity</h3>
            ${r.aadhaar ? `
              <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input type="checkbox" id="aadhaar-mask-toggle" onchange="toggleAadhaarMask(${JSON.stringify(r.aadhaar)}, ${JSON.stringify(r.aadhaar_masked || '')})" class="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                Mask Aadhaar
              </label>
            ` : ''}
          </div>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between gap-2">
              <dt class="text-slate-500 dark:text-slate-400">Aadhaar</dt>
              <dd id="aadhaar-display" class="text-slate-800 dark:text-white font-mono text-right">
                ${escapeHtml(r.aadhaar_masked || '—')}
                ${r.aadhaar_masked ? copyButton(r.aadhaar_masked, 'Aadhaar (masked)') : ''}
              </dd>
            </div>
            ${fieldRow('Farmer ID', r.farmer_id, true)}
            ${fieldRow('गट नंबर', r.gat_number, true)}
          </dl>
        </div>
      </div>

      <!-- Print-only detailed view -->
      <div class="print-only bg-white text-slate-800 p-6">
        <h1 class="text-2xl font-bold mb-2">${escapeHtml(fullName)}</h1>
        <p class="text-sm">${escapeHtml(r.resident_id)} · ${escapeHtml(r.village || '')}</p>
        <hr class="my-4" />
        <table class="w-full text-sm">
          <tr><td class="py-1 font-medium w-1/3">Gender</td><td>${escapeHtml(r.gender || '—')}</td></tr>
          <tr><td class="py-1 font-medium">DOB / Age</td><td>${r.dob ? fmtDate(r.dob) : '—'} (${r.age ?? '—'})</td></tr>
          <tr><td class="py-1 font-medium">Mobile</td><td>${escapeHtml(r.mobile_number || '—')}</td></tr>
          <tr><td class="py-1 font-medium">Address</td><td>${escapeHtml(r.address || '—')}, ${escapeHtml(r.village || '')}, ${escapeHtml(r.district || '')} - ${escapeHtml(r.pin_code || '')}</td></tr>
          <tr><td class="py-1 font-medium">Aadhaar</td><td>${escapeHtml(r.aadhaar_masked || '—')}</td></tr>
          <tr><td class="py-1 font-medium">Farmer ID</td><td>${escapeHtml(r.farmer_id || '—')}</td></tr>
          <tr><td class="py-1 font-medium">गट नंबर</td><td>${escapeHtml(r.gat_number || '—')}</td></tr>
        </table>
        <p class="text-xs text-slate-500 mt-6">Generated on ${new Date().toLocaleString('en-IN')}</p>
      </div>
    `;

    window.printProfile = () => printContent(document.querySelector('.print-only').innerHTML, `Farmer ${fullName}`);
  }

  function fieldRow(label, value, withCopy = false) {
    const v = value == null || value === '' ? '—' : value;
    return `
      <div class="flex justify-between gap-2">
        <dt class="text-slate-500 dark:text-slate-400">${escapeHtml(label)}</dt>
        <dd class="text-slate-800 dark:text-white font-medium text-right break-all">
          ${escapeHtml(String(v))}
          ${withCopy && value ? copyButton(String(value), label) : ''}
        </dd>
      </div>
    `;
  }

  // Aadhaar masking toggle — admin can switch between masked and full view
  window.toggleAadhaarMask = (fullAadhaar, maskedAadhaar) => {
    const cb = document.getElementById('aadhaar-mask-toggle');
    const dd = document.getElementById('aadhaar-display');
    if (!dd) return;
    if (cb.checked) {
      // Masked
      dd.innerHTML = escapeHtml(maskedAadhaar || '—') + (maskedAadhaar ? copyButton(maskedAadhaar, 'Aadhaar (masked)') : '');
    } else {
      // Full
      const formatted = fullAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3');
      dd.innerHTML = escapeHtml(formatted) + copyButton(fullAadhaar, 'Aadhaar');
    }
  };

  // --- Add / Edit form ---
  window.openResidentForm = (id = null) => {
    const isEdit = !!id;
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
        <h3 class="font-semibold text-slate-800 dark:text-white">${isEdit ? t('edit') : t('add_resident')}</h3>
        <button onclick="closeModal()" class="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
      </div>
      <form id="resident-form" class="p-5 space-y-4">
        ${residentFormFields()}
        <div class="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">${isEdit ? t('save_changes') : t('create')}</button>
        </div>
      </form>
    `);

    const form = document.getElementById('resident-form');
    if (isEdit) {
      api.get(`/residents/${id}`).then(r => {
        Object.entries(r).forEach(([k, v]) => {
          const el = form.querySelector(`[name="${k}"]`);
          if (el && v != null) {
            if (el.type === 'date' && v) el.value = v.substring(0, 10);
            else el.value = v;
          }
        });
      }).catch(e => toast(e.message, 'error'));
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const body = {};
      fd.forEach((v, k) => {
        if (v !== '' && v != null) {
          if (['annual_income', 'age'].includes(k)) body[k] = parseFloat(v);
          else if (k === 'is_head_of_family') body[k] = v === 'on' || v === true;
          else body[k] = v;
        }
      });
      try {
        if (isEdit) {
          await api.put(`/residents/${id}`, body);
          toast('Farmer updated', 'success');
          closeModal();
          showProfile(id);
        } else {
          const created = await api.post('/residents', body);
          toast('Farmer added', 'success');
          closeModal();
          showProfile(created.id);
        }
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  };

  function residentFormFields() {
    return `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${input('first_name', t('first_name'), 'text', true)}
        ${input('middle_name', t('middle_name'))}
        ${input('last_name', t('last_name'))}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${select('gender', t('gender'), [t('male'), t('female'), t('other')])}
        ${input('dob', t('dob'), 'date')}
        ${input('mobile_number', t('mobile'), 'tel', false, '10-digit mobile')}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        ${input('alternate_number', t('alternate_no'), 'tel')}
        ${input('village', t('village'))}
        ${input('pin_code', t('pin'), 'text', false, '6 digits')}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${input('address', t('address'), 'text')}
        ${input('aadhaar', t('aadhaar'), 'text', false, '12 digits')}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        ${input('farmer_id', t('farmer_id'), 'text', false, 'शेतकरी आयडी')}
        ${input('gat_number', t('gat_number'), 'text', false, 'गट नंबर')}
      </div>
    `;
  }

  function input(name, label, type = 'text', required = false, placeholder = '') {
    return `
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">${label}${required ? ' <span class="text-rose-500">*</span>' : ''}</label>
        <input name="${name}" type="${type}" ${required ? 'required' : ''} placeholder="${placeholder}"
          class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
    `;
  }
  function select(name, label, options) {
    return `
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">${label}</label>
        <select name="${name}" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">— Select —</option>
          ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>
    `;
  }

  // --- Delete ---
  async function deleteResident(id) {
    if (!confirm('Delete this farmer? This will also delete their documents and applications.')) return;
    try {
      await api.del(`/residents/${id}`);
      toast('Farmer deleted', 'success');
      if (getQueryParam('id')) window.location.href = '/residents.html';
      else loadList();
    } catch (e) { toast(e.message, 'error'); }
  }
})();
