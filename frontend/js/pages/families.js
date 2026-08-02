/* Families page — list, tree view, add/edit */
(async function () {
  const user = await bootPage('families', 'Families', {
    subtitle: 'Group residents into family units',
    actions: `
      <button onclick="openFamilyForm()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Family
      </button>
    `,
  });
  if (!user) return;
  const isAdmin = user.role === 'admin';
  const main = document.getElementById('page-content');

  const state = { page: 1, per_page: 20, q: '' };
  const fid = getQueryParam('id');

  if (fid) return showFamily(fid);

  main.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4 flex gap-3">
      <input id="f-q" type="search" placeholder="Search by family ID, head name, village…" class="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      <button id="btn-search" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Search</button>
      <a href="/api/reports/families.csv" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg">Export</a>
    </div>
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Family ID</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Head</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Village / Ward</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Members</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Created</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody id="fam-tbody" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(6).fill(skeletonRow(6)).join('')}
          </tbody>
        </table>
      </div>
      <div id="pagination" class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm"></div>
    </div>
  `;

  document.getElementById('btn-search').addEventListener('click', () => {
    state.q = document.getElementById('f-q').value.trim();
    state.page = 1;
    loadList();
  });
  document.getElementById('f-q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
  });

  async function loadList() {
    const tbody = document.getElementById('fam-tbody');
    tbody.innerHTML = Array(4).fill(skeletonRow(6)).join('');
    try {
      const res = await api.get('/families', { page: state.page, per_page: state.per_page, q: state.q });
      if (!res.items.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-10 text-center text-slate-500">No families found.</td></tr>`;
      } else {
        tbody.innerHTML = res.items.map(f => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onclick="showFamily('${escapeHtml(f.family_id)}')">
            <td class="px-4 py-3 font-mono text-sm text-indigo-600 dark:text-indigo-400">${escapeHtml(f.family_id)} ${copyButton(f.family_id, 'Family ID')}</td>
            <td class="px-4 py-3 text-slate-800 dark:text-white">${escapeHtml(f.head_name || '—')}</td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${escapeHtml(f.village || '—')} / ${escapeHtml(f.ward_number || '—')}</td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300">${f.member_count}</td>
            <td class="px-4 py-3 text-slate-500 text-sm">${fmtDate(f.created_at)}</td>
            <td class="px-4 py-3 text-right" onclick="event.stopPropagation()">
              <button onclick="showFamily('${escapeHtml(f.family_id)}')" class="text-indigo-600 hover:underline text-sm mr-2">View</button>
              <button onclick="openFamilyForm(${f.id})" class="text-slate-600 dark:text-slate-300 hover:underline text-sm mr-2">Edit</button>
              ${isAdmin ? `<button onclick="deleteFamily(${f.id})" class="text-rose-600 hover:underline text-sm">Delete</button>` : ''}
            </td>
          </tr>
        `).join('');
      }
      renderPagination(res);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-10 text-center text-rose-600">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  function renderPagination(res) {
    const p = document.getElementById('pagination');
    const from = res.total === 0 ? 0 : (res.page - 1) * res.per_page + 1;
    const to = Math.min(res.page * res.per_page, res.total);
    p.innerHTML = `
      <div class="text-slate-500">Showing ${from}–${to} of ${res.total}</div>
      <div class="flex items-center gap-2">
        <button ${res.page <= 1 ? 'disabled' : ''} onclick="gotoPage(${res.page - 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">Prev</button>
        <span class="text-slate-600 dark:text-slate-300">Page ${res.page} / ${res.pages}</span>
        <button ${res.page >= res.pages ? 'disabled' : ''} onclick="gotoPage(${res.page + 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">Next</button>
      </div>
    `;
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadList(); } };

  // Expose hoisted functions to window so onclick="..." attributes can call them.
  // (openFamilyForm is assigned later as an arrow function.)
  window.showFamily = showFamily;
  window.deleteFamily = deleteFamily;

  await loadList();

  async function showFamily(familyId) {
    main.innerHTML = `
      <div class="mb-4">
        <button onclick="window.location.href='/families.html'" class="text-sm text-slate-500 hover:text-indigo-600">&larr; Back to list</button>
      </div>
      <div id="fam-host" class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          ${Array(4).fill('<div class="h-4 w-1/2 skeleton rounded mb-3"></div>').join('')}
        </div>
      </div>
    `;
    try {
      const f = await api.get(`/families/${familyId}`);
      renderFamily(f);
    } catch (e) {
      document.getElementById('fam-host').innerHTML = `<div class="p-6 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderFamily(f) {
    const host = document.getElementById('fam-host');
    host.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-white">${escapeHtml(f.family_id)}</h2>
            <p class="text-sm text-slate-500 mt-1">Head: <span class="text-slate-800 dark:text-white font-medium">${escapeHtml(f.head_name || '—')}</span></p>
            <p class="text-sm text-slate-500">${escapeHtml(f.address || '—')}, ${escapeHtml(f.village || '')} · Ward ${escapeHtml(f.ward_number || '—')}</p>
            <p class="text-xs text-slate-400 mt-1">${f.member_count} member${f.member_count === 1 ? '' : 's'}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="openFamilyForm(${f.id})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Edit</button>
            ${isAdmin ? `<button onclick="deleteFamily(${f.id})" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg">Delete</button>` : ''}
            <button onclick="printFamily()" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-sm rounded-lg">Print</button>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3 class="font-semibold text-slate-800 dark:text-white">Family Members</h3>
        </div>
        <div class="divide-y divide-slate-100 dark:divide-slate-700">
          ${f.members && f.members.length ? f.members.map(m => `
            <a href="/residents.html?id=${m.id}" class="block px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold uppercase">${escapeHtml((m.name || '?')[0])}</div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-slate-800 dark:text-white">${escapeHtml(m.name)} ${m.relation === 'Head' ? '<span class="text-xs ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200 rounded">Head</span>' : ''}</div>
                <div class="text-xs text-slate-500">${escapeHtml(m.resident_id)} · ${escapeHtml(m.gender || '—')} · ${m.age != null ? m.age + ' yrs' : ''}</div>
              </div>
              ${m.mobile ? `<div class="text-xs text-slate-500">${escapeHtml(m.mobile)} ${copyButton(m.mobile, 'Mobile')}</div>` : ''}
            </a>
          `).join('') : `<div class="px-5 py-8 text-center text-sm text-slate-500">No members linked yet.</div>`}
        </div>
      </div>

      <div class="print-only bg-white p-6">
        <h1 class="text-xl font-bold">Family: ${escapeHtml(f.family_id)}</h1>
        <p class="text-sm">Head: ${escapeHtml(f.head_name || '—')}</p>
        <p class="text-sm">${escapeHtml(f.address || '—')}, ${escapeHtml(f.village || '')}</p>
        <hr class="my-3" />
        <table class="w-full text-sm">
          <thead><tr class="text-left"><th class="py-1">Member</th><th class="py-1">Gender</th><th class="py-1">Age</th><th class="py-1">Mobile</th></tr></thead>
          <tbody>
            ${(f.members || []).map(m => `<tr><td class="py-1">${escapeHtml(m.name)}</td><td>${escapeHtml(m.gender || '—')}</td><td>${m.age ?? '—'}</td><td>${escapeHtml(m.mobile || '—')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
    window.printFamily = () => printContent(document.querySelector('.print-only').innerHTML, `Family ${f.family_id}`);
  }

  window.openFamilyForm = (id = null) => {
    const isEdit = !!id;
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">${isEdit ? 'Edit' : 'Add'} Family</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="family-form" class="p-5 space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Head Name</label>
          <input name="head_name" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Village</label>
            <input name="village" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ward</label>
            <input name="ward_number" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address</label>
          <textarea name="address" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `);
    if (isEdit) {
      api.get('/families').then(res => {
        const f = res.items.find(x => x.id === id);
        if (f) {
          const form = document.getElementById('family-form');
          form.head_name.value = f.head_name || '';
          form.village.value = f.village || '';
          form.ward_number.value = f.ward_number || '';
          form.address.value = f.address || '';
        }
      });
    }
    document.getElementById('family-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {};
      fd.forEach((v, k) => { if (v) body[k] = v; });
      try {
        if (isEdit) {
          await api.put(`/families/${id}`, body);
          toast('Family updated', 'success');
        } else {
          await api.post('/families', body);
          toast('Family created', 'success');
        }
        closeModal();
        loadList();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  async function deleteFamily(id) {
    if (!confirm('Delete this family? Members will be unlinked but not deleted.')) return;
    try {
      await api.del(`/families/${id}`);
      toast('Family deleted', 'success');
      if (getQueryParam('id')) window.location.href = '/families.html';
      else loadList();
    } catch (e) { toast(e.message, 'error'); }
  }
})();
