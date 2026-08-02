/* Applications page — list, create, status updates, timeline */
(async function () {
  const user = await bootPage('applications', 'Applications', {
    subtitle: 'Track scheme applications & statuses',
    actions: `
      <button onclick="openApplicationForm()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        New Application
      </button>
    `,
  });
  if (!user) return;
  const main = document.getElementById('page-content');

  const state = {
    page: 1, per_page: 20,
    status: '', resident_id: getQueryParam('resident_id') || '',
    scheme_id: '', q: '',
  };

  main.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input id="f-q" type="search" placeholder="Application number…" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        <select id="f-status" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
          <option value="">All Statuses</option>
          <option value="applied">Applied</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <input id="f-resident" type="number" placeholder="Resident ID" value="${state.resident_id}" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        <input id="f-scheme" type="number" placeholder="Scheme ID" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
      </div>
      <div class="mt-3 flex items-center justify-between flex-wrap gap-2">
        <button id="btn-search" class="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg">Apply Filters</button>
        <div class="flex gap-2 text-sm">
          <a href="/api/reports/applications.csv?status_filter=pending" class="text-indigo-600 hover:underline">Pending CSV</a>
          <a href="/api/reports/applications.csv?status_filter=approved" class="text-emerald-600 hover:underline">Approved CSV</a>
          <a href="/api/reports/applications.csv" class="text-slate-600 dark:text-slate-300 hover:underline">All CSV</a>
        </div>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Application #</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Resident</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scheme</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Applied</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody id="app-tbody" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(6).fill(skeletonRow(6)).join('')}
          </tbody>
        </table>
      </div>
      <div id="pagination" class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm"></div>
    </div>
  `;

  document.getElementById('btn-search').addEventListener('click', () => {
    state.q = document.getElementById('f-q').value.trim();
    state.status = document.getElementById('f-status').value;
    state.resident_id = document.getElementById('f-resident').value.trim();
    state.scheme_id = document.getElementById('f-scheme').value.trim();
    state.page = 1;
    loadList();
  });

  async function loadList() {
    const tbody = document.getElementById('app-tbody');
    tbody.innerHTML = Array(5).fill(skeletonRow(6)).join('');
    try {
      const res = await api.get('/applications', {
        page: state.page, per_page: state.per_page,
        status_filter: state.status, resident_id: state.resident_id,
        scheme_id: state.scheme_id, q: state.q,
      });
      if (!res.items.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-10 text-center text-slate-500">No applications found.</td></tr>`;
      } else {
        tbody.innerHTML = res.items.map(a => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onclick="showApp(${a.id})">
            <td class="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">${escapeHtml(a.application_number)} ${copyButton(a.application_number, 'Application No')}</td>
            <td class="px-4 py-3 text-slate-800 dark:text-white text-sm">${escapeHtml(a.resident_name || '—')}</td>
            <td class="px-4 py-3 text-slate-700 dark:text-slate-300 text-sm">${escapeHtml(a.scheme_name || '—')}</td>
            <td class="px-4 py-3">${statusBadge(a.status)}</td>
            <td class="px-4 py-3 text-xs text-slate-500">${fmtDate(a.created_at)}</td>
            <td class="px-4 py-3 text-right" onclick="event.stopPropagation()">
              <button onclick="showApp(${a.id})" class="text-indigo-600 hover:underline text-sm mr-2">View</button>
              <button onclick="openStatusModal(${a.id}, '${escapeHtml(a.status)}')" class="text-amber-600 hover:underline text-sm">Update</button>
            </td>
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
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-10 text-center text-rose-600">${escapeHtml(e.message)}</td></tr>`;
    }
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadList(); } };

  window.showApp = async (id) => {
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">Application Details</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <div id="app-detail" class="p-5">
        <div class="h-24 skeleton rounded"></div>
      </div>
    `);
    try {
      const a = await api.get(`/applications/${id}`);
      document.getElementById('app-detail').innerHTML = `
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div><p class="text-xs text-slate-500">Application #</p><p class="font-mono text-sm text-indigo-600">${escapeHtml(a.application_number)} ${copyButton(a.application_number, 'Application No')}</p></div>
          <div><p class="text-xs text-slate-500">Status</p>${statusBadge(a.status)}</div>
          <div><p class="text-xs text-slate-500">Resident</p><p class="text-sm"><a href="/residents.html?id=${a.resident_id}" class="text-indigo-600 hover:underline">${escapeHtml(a.resident_name || '—')}</a></p></div>
          <div><p class="text-xs text-slate-500">Scheme</p><p class="text-sm"><a href="/schemes.html?id=${a.scheme_id}" class="text-indigo-600 hover:underline">${escapeHtml(a.scheme_name || '—')}</a></p></div>
          <div><p class="text-xs text-slate-500">Applied</p><p class="text-sm">${fmtDateTime(a.created_at)}</p></div>
          <div><p class="text-xs text-slate-500">Last Updated</p><p class="text-sm">${fmtDateTime(a.updated_at)}</p></div>
        </div>
        ${a.remarks ? `<div class="mb-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded text-sm"><p class="text-xs text-slate-500 mb-1">Remarks</p>${escapeHtml(a.remarks)}</div>` : ''}
        <div>
          <p class="text-xs text-slate-500 uppercase mb-2">Timeline</p>
          <ol class="relative border-l border-slate-200 dark:border-slate-700 ml-2">
            ${(a.timeline || []).map(t => `
              <li class="ml-4 pb-4">
                <div class="absolute -left-1.5 w-3 h-3 bg-indigo-500 rounded-full"></div>
                <div class="flex items-center gap-2">
                  ${statusBadge(t.status)}
                  <span class="text-xs text-slate-500">${fmtDateTime(t.created_at)}</span>
                </div>
                <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${escapeHtml(t.remarks || '')}</p>
                <p class="text-xs text-slate-400">by ${escapeHtml(t.actor_name || 'system')}</p>
              </li>
            `).join('')}
          </ol>
        </div>
        <div class="mt-4 flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onclick="printApp(${a.id})" class="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-sm rounded-lg">Print</button>
          <button onclick="openStatusModal(${a.id}, '${escapeHtml(a.status)}')" class="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg">Update Status</button>
        </div>
      `;
    } catch (e) {
      document.getElementById('app-detail').innerHTML = `<div class="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 rounded text-sm">${escapeHtml(e.message)}</div>`;
    }
  };

  window.printApp = async (id) => {
    try {
      const a = await api.get(`/applications/${id}`);
      const html = `
        <h1 class="text-xl font-bold">Application ${escapeHtml(a.application_number)}</h1>
        <table class="w-full text-sm mt-4">
          <tr><td class="py-1 font-medium w-1/3">Resident</td><td>${escapeHtml(a.resident_name || '—')}</td></tr>
          <tr><td class="py-1 font-medium">Scheme</td><td>${escapeHtml(a.scheme_name || '—')}</td></tr>
          <tr><td class="py-1 font-medium">Status</td><td>${escapeHtml(a.status)}</td></tr>
          <tr><td class="py-1 font-medium">Applied</td><td>${fmtDate(a.created_at)}</td></tr>
          <tr><td class="py-1 font-medium">Remarks</td><td>${escapeHtml(a.remarks || '—')}</td></tr>
        </table>
        <h3 class="font-semibold mt-4 mb-2">Timeline</h3>
        <table class="w-full text-sm"><thead><tr class="text-left"><th class="py-1">Date</th><th>Status</th><th>By</th></tr></thead>
        <tbody>${(a.timeline || []).map(t => `<tr><td class="py-1">${fmtDateTime(t.created_at)}</td><td>${escapeHtml(t.status)}</td><td>${escapeHtml(t.actor_name || 'system')}</td></tr>`).join('')}</tbody></table>
      `;
      printContent(html, `Application ${a.application_number}`);
    } catch (e) { toast(e.message, 'error'); }
  };

  window.openStatusModal = (id, currentStatus) => {
    closeModal();
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">Update Status</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="status-form" class="p-5 space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Status</label>
          <select name="status" required class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
            ${['applied', 'pending', 'processing', 'approved', 'rejected'].map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
          <textarea name="remarks" rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">Update</button>
        </div>
      </form>
    `);
    document.getElementById('status-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = { status: fd.get('status'), remarks: fd.get('remarks') };
      try {
        await api.put(`/applications/${id}/status`, body);
        toast('Status updated', 'success');
        closeModal();
        loadList();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  window.openApplicationForm = () => {
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">New Application</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="app-form" class="p-5 space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resident ID <span class="text-rose-500">*</span></label>
          <input name="resident_id" type="number" required value="${state.resident_id}" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Scheme <span class="text-rose-500">*</span></label>
          <select name="scheme_id" required class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
            <option value="">— Select scheme —</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
          <textarea name="remarks" rows="3" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"></textarea>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">Submit</button>
        </div>
      </form>
    `);
    // Populate schemes dropdown
    api.get('/schemes', { page: 1, per_page: 100, status_filter: 'active' }).then(res => {
      const sel = document.querySelector('#app-form [name="scheme_id"]');
      res.items.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id; opt.textContent = s.name;
        sel.appendChild(opt);
      });
    }).catch(() => {});
    document.getElementById('app-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = {
        resident_id: parseInt(fd.get('resident_id'), 10),
        scheme_id: parseInt(fd.get('scheme_id'), 10),
        remarks: fd.get('remarks'),
      };
      try {
        await api.post('/applications', body);
        toast('Application submitted', 'success');
        closeModal();
        loadList();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  await loadList();
})();
