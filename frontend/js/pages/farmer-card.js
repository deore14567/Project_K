/* Farmer Card page — select farmers, generate single/bulk cards */
(async function () {
  const user = await bootPage('farmer-card', t('farmer_card'), {
    subtitle: t('farmer_card_subtitle'),
  });
  if (!user) return;
  const main = document.getElementById('page-content');

  const state = {
    page: 1, per_page: 50, q: '',
    village: '',
    selectedIds: new Set(),
  };

  main.innerHTML = `
    <!-- Info banner -->
    <div class="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-5 mb-6 border border-emerald-200 dark:border-emerald-800/40">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0L6 7m6 4l3 1m0 0l-3 9a5.002 5.002 0 006.001 0L18 7m-6 4l6-3m-6 3l-6-3"/></svg>
        </div>
        <div class="flex-1">
          <h2 class="font-bold text-slate-800 dark:text-white">${t('farmer_card_title')}</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${t('select_farmers_desc')}</p>
        </div>
      </div>
    </div>

    <!-- Search + filters -->
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="f-q" type="search" placeholder="${t('search_placeholder')}"
          class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <input id="f-village" type="text" placeholder="${t('village')}"
          class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <button id="btn-search" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">${t('search')}</button>
      </div>
    </div>

    <!-- Selection bar -->
    <div id="selection-bar" class="hidden bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-4 flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold" id="selection-count">0</span>
        <span class="text-sm font-medium text-emerald-700 dark:text-emerald-300"><span id="sel-count-text">0</span> ${t('cards_ready')}</span>
        <button onclick="clearCardSelection()" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline ml-2">${t('clear')}</button>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="downloadBulkCards('pdf')" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg">
          📄 ${t('download_pdf')}
        </button>
      </div>
    </div>

    <!-- Farmers table -->
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 w-10">
                <input id="select-all" type="checkbox" onclick="toggleSelectAll()"
                  class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-white dark:bg-slate-700 cursor-pointer" />
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">${t('farmer_name')}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">${t('farmer_id')}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">${t('gat_number')}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">${t('village')}</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">${t('mobile')}</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">${t('actions')}</th>
            </tr>
          </thead>
          <tbody id="farmer-tbody" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(6).fill(skeletonRow(7)).join('')}
          </tbody>
        </table>
      </div>
      <div id="pagination" class="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-sm"></div>
    </div>

    <!-- Card preview info -->
    <div class="mt-6 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 class="font-semibold text-slate-800 dark:text-white mb-3">${t('card_layout')}</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <h4 class="font-medium text-emerald-700 dark:text-emerald-400 mb-2">${t('card_front')}:</h4>
          <ul class="text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>${t('farmer_name')} / ${t('aadhaar')} / ${t('farmer_id')}</li>
            <li>${t('gat_number')} / ${t('mobile')}</li>
            <li>${t('qr_code')} (${t('optional')})</li>
            <li>3 ${t('logos')} (${t('top_left')}, ${t('top_middle')}, ${t('top_right')})</li>
          </ul>
        </div>
        <div>
          <h4 class="font-medium text-emerald-700 dark:text-emerald-400 mb-2">${t('card_back')}:</h4>
          <ul class="text-slate-600 dark:text-slate-400 space-y-1 list-disc list-inside">
            <li>${t('name')} / ${t('dob')} / ${t('gender')}</li>
            <li>${t('address')}</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // --- Search handlers ---
  document.getElementById('btn-search').addEventListener('click', () => {
    state.q = document.getElementById('f-q').value.trim();
    state.village = document.getElementById('f-village').value.trim();
    state.page = 1;
    loadFarmers();
  });
  document.getElementById('f-q').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('btn-search').click();
  });

  // --- Load farmers list ---
  async function loadFarmers() {
    const tbody = document.getElementById('farmer-tbody');
    tbody.innerHTML = Array(5).fill(skeletonRow(7)).join('');
    try {
      const res = await api.get('/residents', {
        page: state.page, per_page: state.per_page,
        q: state.q, village: state.village,
        sort: 'created_at:desc',
      });
      if (!res.items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-10 text-center text-slate-500">${t('no_residents_found')}</td></tr>`;
      } else {
        tbody.innerHTML = res.items.map(r => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 ${state.selectedIds.has(r.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}">
            <td class="px-4 py-3">
              <input type="checkbox" data-farmer-id="${r.id}" ${state.selectedIds.has(r.id) ? 'checked' : ''}
                onchange="toggleSelectFarmer(${r.id}, this.checked)"
                class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-white dark:bg-slate-700 cursor-pointer" />
            </td>
            <td class="px-4 py-3">
              <div class="font-medium text-slate-800 dark:text-white">${escapeHtml(r.first_name)} ${escapeHtml(r.last_name || '')}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(r.resident_id)}</div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-mono">${escapeHtml(r.farmer_id || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.gat_number || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.village || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.mobile_number || '—')}</td>
            <td class="px-4 py-3 text-center">
              <div class="flex items-center justify-center gap-1">
                <button onclick="downloadSingleCard(${r.id}, 'pdf')" title="${t('download_pdf')}" class="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </button>
                <button onclick="downloadSingleCard(${r.id}, 'jpg')" title="${t('download_jpg')}" class="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </button>
                <button onclick="printCard(${r.id})" title="${t('print_card')}" class="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                </button>
              </div>
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

  function renderPagination(res) {
    const p = document.getElementById('pagination');
    const from = res.total === 0 ? 0 : (res.page - 1) * res.per_page + 1;
    const to = Math.min(res.page * res.per_page, res.total);
    p.innerHTML = `
      <div class="text-slate-500 dark:text-slate-400">${t('showing')} ${from}–${to} ${t('of')} ${res.total}</div>
      <div class="flex items-center gap-2">
        <button ${res.page <= 1 ? 'disabled' : ''} onclick="gotoPage(${res.page - 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">${t('prev')}</button>
        <span class="text-slate-600 dark:text-slate-300">${t('page')} ${res.page} / ${res.pages}</span>
        <button ${res.page >= res.pages ? 'disabled' : ''} onclick="gotoPage(${res.page + 1})" class="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-40">${t('next')}</button>
      </div>
    `;
  }

  // --- Selection helpers ---
  function updateSelectionBar() {
    const count = state.selectedIds.size;
    const bar = document.getElementById('selection-bar');
    if (!bar) return;
    if (count > 0) {
      bar.classList.remove('hidden');
      document.getElementById('selection-count').textContent = count;
      document.getElementById('sel-count-text').textContent = count;
    } else {
      bar.classList.add('hidden');
    }
  }

  function updateSelectAllCheckbox(items) {
    const cb = document.getElementById('select-all');
    if (!cb) return;
    if (!items.length) { cb.checked = false; cb.indeterminate = false; return; }
    const selectedCount = items.filter(i => state.selectedIds.has(i.id)).length;
    cb.checked = selectedCount === items.length;
    cb.indeterminate = selectedCount > 0 && selectedCount < items.length;
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadFarmers(); } };

  window.toggleSelectAll = () => {
    const cb = document.getElementById('select-all');
    document.querySelectorAll('[data-farmer-id]').forEach(c => {
      const id = parseInt(c.dataset.farmerId, 10);
      if (cb.checked) state.selectedIds.add(id);
      else state.selectedIds.delete(id);
      c.checked = cb.checked;
    });
    updateSelectionBar();
    document.querySelectorAll('#farmer-tbody tr').forEach(tr => {
      const c = tr.querySelector('[data-farmer-id]');
      if (c) {
        tr.classList.toggle('bg-emerald-50', c.checked);
        tr.classList.toggle('dark:bg-emerald-900/20', c.checked);
      }
    });
  };

  window.toggleSelectFarmer = (id, checked) => {
    if (checked) state.selectedIds.add(id);
    else state.selectedIds.delete(id);
    updateSelectionBar();
    const checkboxes = document.querySelectorAll('[data-farmer-id]');
    const visibleIds = Array.from(checkboxes).map(c => parseInt(c.dataset.farmerId, 10));
    const items = visibleIds.map(i => ({ id: i }));
    updateSelectAllCheckbox(items);
    const tr = document.querySelector(`[data-farmer-id="${id}"]`)?.closest('tr');
    if (tr) {
      tr.classList.toggle('bg-emerald-50', checked);
      tr.classList.toggle('dark:bg-emerald-900/20', checked);
    }
  };

  window.clearCardSelection = () => {
    state.selectedIds.clear();
    document.querySelectorAll('[data-farmer-id]').forEach(c => { c.checked = false; });
    const selectAll = document.getElementById('select-all');
    if (selectAll) { selectAll.checked = false; selectAll.indeterminate = false; }
    document.querySelectorAll('#farmer-tbody tr').forEach(tr => {
      tr.classList.remove('bg-emerald-50', 'dark:bg-emerald-900/20');
    });
    updateSelectionBar();
  };

  // --- Single card download ---
  window.downloadSingleCard = async (id, fmt) => {
    try {
      const path = `/farmer-card/${id}.${fmt}`;
      const blob = await window.api.get(path);
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `farmer_card_${id}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast(`${t('farmer_card')} ${fmt.toUpperCase()} ${t('downloaded')}`, 'success');
    } catch (e) {
      toast(`${t('download_failed')}: ${e.message}`, 'error');
    }
  };

  // --- Print card (opens HTML print view) ---
  window.printCard = (id) => {
    window.open(`/api/farmer-card/${id}/print`, '_blank');
  };

  // --- Bulk download ---
  window.downloadBulkCards = async (fmt) => {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) { toast(t('no_farmers_selected'), 'warning'); return; }
    try {
      const blob = await window.api.post(`/farmer-card/bulk.${fmt}`, { ids });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `farmer_cards_${ids.length}.${fmt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast(`${ids.length} ${t('farmer_card')} ${fmt.toUpperCase()} ${t('downloaded')}`, 'success');
    } catch (e) {
      toast(`${t('download_failed')}: ${e.message}`, 'error');
    }
  };

  await loadFarmers();
})();
