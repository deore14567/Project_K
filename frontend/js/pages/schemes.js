/* Schemes page — list + detail view + create/edit */
(async function () {
  const user = await bootPage('schemes', 'Government Schemes', {
    subtitle: 'Manage welfare schemes & eligibility criteria',
    actions: `
      <button onclick="openSchemeForm()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add Scheme
      </button>
    `,
  });
  if (!user) return;
  const isAdmin = user.role === 'admin';
  const main = document.getElementById('page-content');

  const sid = getQueryParam('id');
  if (sid) return showScheme(parseInt(sid, 10));

  const state = { page: 1, per_page: 20, q: '', status: '' };

  main.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div class="flex flex-wrap gap-3">
        <input id="f-q" type="search" placeholder="Search schemes…" class="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <select id="f-status" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="draft">Draft</option>
        </select>
        <button id="btn-search" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Search</button>
        <a href="/api/reports/schemes.csv" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm rounded-lg">Export</a>
      </div>
    </div>
    <div id="schemes-list" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${Array(6).fill('<div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 h-40"><div class="h-4 w-2/3 skeleton rounded mb-2"></div><div class="h-3 w-1/3 skeleton rounded"></div></div>').join('')}
    </div>
    <div id="pagination" class="mt-4 flex items-center justify-between text-sm"></div>
  `;

  document.getElementById('btn-search').addEventListener('click', () => {
    state.q = document.getElementById('f-q').value.trim();
    state.status = document.getElementById('f-status').value;
    state.page = 1;
    loadList();
  });

  async function loadList() {
    const grid = document.getElementById('schemes-list');
    grid.innerHTML = Array(4).fill('<div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 h-40"><div class="h-4 w-2/3 skeleton rounded mb-2"></div><div class="h-3 w-1/3 skeleton rounded"></div></div>').join('');
    try {
      const res = await api.get('/schemes', { page: state.page, per_page: state.per_page, q: state.q, status_filter: state.status });
      if (!res.items.length) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-12">No schemes found.</div>`;
      } else {
        grid.innerHTML = res.items.map(s => `
          <div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer" onclick="showScheme(${s.id})">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-slate-800 dark:text-white">${escapeHtml(s.name)}</h3>
              ${statusBadge(s.status)}
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">${escapeHtml(s.description || 'No description')}</p>
            <div class="mt-3 flex flex-wrap gap-2 text-xs">
              ${s.age_min != null || s.age_max != null ? `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Age ${s.age_min ?? 0}-${s.age_max ?? 130}</span>` : ''}
              ${s.gender && s.gender !== 'Any' ? `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">${escapeHtml(s.gender)}</span>` : ''}
              ${s.category && s.category !== 'Any' ? `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">${escapeHtml(s.category)}</span>` : ''}
              ${s.income_limit != null ? `<span class="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Income ≤ ₹${Number(s.income_limit).toLocaleString('en-IN')}</span>` : ''}
            </div>
          </div>
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
      grid.innerHTML = `<div class="col-span-full text-center text-rose-600 py-12">${escapeHtml(e.message)}</div>`;
    }
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadList(); } };

  // Expose hoisted functions to window so onclick="..." attributes can call them.
  // (openSchemeForm is assigned later as an arrow function.)
  window.showScheme = showScheme;
  window.deleteScheme = deleteScheme;

  await loadList();

  async function showScheme(id) {
    main.innerHTML = `
      <div class="mb-4">
        <button onclick="window.location.href='/schemes.html'" class="text-sm text-slate-500 hover:text-indigo-600">&larr; Back to list</button>
      </div>
      <div id="scheme-host" class="space-y-4">
        <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          ${Array(6).fill('<div class="h-4 w-1/2 skeleton rounded mb-3"></div>').join('')}
        </div>
      </div>
    `;
    try {
      const s = await api.get(`/schemes/${id}`);
      renderScheme(s);
    } catch (e) {
      document.getElementById('scheme-host').innerHTML = `<div class="p-6 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded-xl">${escapeHtml(e.message)}</div>`;
    }
  }

  function renderScheme(s) {
    document.getElementById('scheme-host').innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <h2 class="text-xl font-bold text-slate-800 dark:text-white">${escapeHtml(s.name)}</h2>
              ${statusBadge(s.status)}
            </div>
            <p class="text-xs text-slate-500">Created ${fmtDate(s.created_at)}</p>
          </div>
          <div class="flex gap-2">
            <button onclick="printScheme()" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-sm rounded-lg">Print</button>
            <button onclick="openSchemeForm(${s.id})" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Edit</button>
            ${isAdmin ? `<button onclick="deleteScheme(${s.id})" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg">Delete</button>` : ''}
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</h4><p class="text-slate-600 dark:text-slate-400">${escapeHtml(s.description || '—')}</p></div>
          <div><h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-1">Benefits</h4><p class="text-slate-600 dark:text-slate-400">${escapeHtml(s.benefits || '—')}</p></div>
          <div><h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-1">Eligibility</h4><p class="text-slate-600 dark:text-slate-400">${escapeHtml(s.eligibility || '—')}</p></div>
          <div><h4 class="font-semibold text-slate-700 dark:text-slate-300 mb-1">Required Documents</h4><p class="text-slate-600 dark:text-slate-400">${(s.required_documents || []).map(d => `<span class="inline-block px-2 py-0.5 mr-1 mb-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">${escapeHtml(d)}</span>`).join('') || '—'}</p></div>
        </div>
        <div class="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div><p class="text-xs text-slate-500 uppercase">Age</p><p class="text-sm text-slate-800 dark:text-white">${s.age_min ?? '—'} to ${s.age_max ?? '—'}</p></div>
          <div><p class="text-xs text-slate-500 uppercase">Gender</p><p class="text-sm text-slate-800 dark:text-white">${escapeHtml(s.gender || 'Any')}</p></div>
          <div><p class="text-xs text-slate-500 uppercase">Category</p><p class="text-sm text-slate-800 dark:text-white">${escapeHtml(s.category || 'Any')}</p></div>
          <div><p class="text-xs text-slate-500 uppercase">Income Limit</p><p class="text-sm text-slate-800 dark:text-white">${s.income_limit != null ? '₹' + Number(s.income_limit).toLocaleString('en-IN') : '—'}</p></div>
          <div><p class="text-xs text-slate-500 uppercase">Deadline</p><p class="text-sm text-slate-800 dark:text-white">${s.application_deadline ? fmtDate(s.application_deadline) : '—'}</p></div>
        </div>
      </div>

      <div class="print-only bg-white p-6">
        <h1 class="text-xl font-bold">${escapeHtml(s.name)}</h1>
        <p class="text-sm mt-1">${escapeHtml(s.description || '')}</p>
        <hr class="my-3" />
        <table class="w-full text-sm">
          <tr><td class="py-1 font-medium w-1/3">Benefits</td><td>${escapeHtml(s.benefits || '—')}</td></tr>
          <tr><td class="py-1 font-medium">Eligibility</td><td>${escapeHtml(s.eligibility || '—')}</td></tr>
          <tr><td class="py-1 font-medium">Age</td><td>${s.age_min ?? '—'} to ${s.age_max ?? '—'}</td></tr>
          <tr><td class="py-1 font-medium">Gender</td><td>${escapeHtml(s.gender || 'Any')}</td></tr>
          <tr><td class="py-1 font-medium">Category</td><td>${escapeHtml(s.category || 'Any')}</td></tr>
          <tr><td class="py-1 font-medium">Income Limit</td><td>${s.income_limit != null ? '₹' + Number(s.income_limit).toLocaleString('en-IN') : '—'}</td></tr>
          <tr><td class="py-1 font-medium">Deadline</td><td>${s.application_deadline ? fmtDate(s.application_deadline) : '—'}</td></tr>
        </table>
      </div>
    `;
    window.printScheme = () => printContent(document.querySelector('.print-only').innerHTML, `Scheme ${s.name}`);
  }

  window.openSchemeForm = (id = null) => {
    const isEdit = !!id;
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">${isEdit ? 'Edit' : 'Add'} Scheme</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="scheme-form" class="p-5 space-y-3">
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name <span class="text-rose-500">*</span></label><input name="name" required class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label><textarea name="description" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"></textarea></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Benefits</label><textarea name="benefits" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"></textarea></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Eligibility</label><textarea name="eligibility" rows="2" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"></textarea></div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age Min</label><input name="age_min" type="number" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Age Max</label><input name="age_max" type="number" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gender</label><select name="gender" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"><option value="Any">Any</option><option>Male</option><option>Female</option></select></div>
          <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label><select name="category" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"><option value="Any">Any</option><option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option></select></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Income Limit (₹)</label><input name="income_limit" type="number" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
          <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Application Deadline</label><input name="application_deadline" type="date" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
        </div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Required Documents (comma-separated)</label><input name="required_documents" placeholder="Aadhaar, PAN, Income Certificate" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label><select name="status" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"><option value="active">Active</option><option value="draft">Draft</option><option value="closed">Closed</option></select></div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `);

    if (isEdit) {
      api.get(`/schemes/${id}`).then(s => {
        const form = document.getElementById('scheme-form');
        ['name', 'description', 'benefits', 'eligibility', 'gender', 'category', 'status'].forEach(k => { if (s[k] != null) form[k].value = s[k]; });
        ['age_min', 'age_max', 'income_limit'].forEach(k => { if (s[k] != null) form[k].value = s[k]; });
        if (s.application_deadline) form.application_deadline.value = s.application_deadline.substring(0, 10);
        if (Array.isArray(s.required_documents)) form.required_documents.value = s.required_documents.join(', ');
      });
    }

    document.getElementById('scheme-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {};
      fd.forEach((v, k) => {
        if (v === '' || v == null) return;
        if (['age_min', 'age_max', 'income_limit'].includes(k)) body[k] = parseInt(v, 10);
        else if (k === 'required_documents') body[k] = v.split(',').map(s => s.trim()).filter(Boolean);
        else body[k] = v;
      });
      try {
        if (isEdit) {
          await api.put(`/schemes/${id}`, body);
          toast('Scheme updated', 'success');
        } else {
          const created = await api.post('/schemes', body);
          toast('Scheme created', 'success');
          showScheme(created.id);
          closeModal();
          return;
        }
        closeModal();
        loadList();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  async function deleteScheme(id) {
    if (!confirm('Delete this scheme?')) return;
    try {
      await api.del(`/schemes/${id}`);
      toast('Scheme deleted', 'success');
      window.location.href = '/schemes.html';
    } catch (e) { toast(e.message, 'error'); }
  }
})();
