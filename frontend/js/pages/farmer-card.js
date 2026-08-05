/* Farmer Card page — select farmers, preview card, download PDF/JPG */
(async function () {
  const user = await bootPage('farmer-card', t('farmer_card'), {
    subtitle: t('farmer_card_subtitle'),
  });
  if (!user) return;
  const main = document.getElementById('page-content');

  const state = {
    page: 1, per_page: 50, q: '', village: '',
    selectedIds: new Set(),
    previewFarmer: null,  // currently previewed farmer object (full data)
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

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Card Preview -->
      <div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-slate-800 dark:text-white">${t('card_preview')}</h3>
          <div id="preview-actions" class="flex gap-2"></div>
        </div>
        <div id="card-preview" class="flex justify-center items-center min-h-[280px] bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
          <div class="text-slate-400 text-sm text-center">
            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a2 2 0 012-2h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM8 7h8M8 11h8M8 15h5"/></svg>
            ${t('click_preview_hint')}
          </div>
        </div>
      </div>

      <!-- Search + Selection -->
      <div>
        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input id="f-q" type="search" placeholder="${t('search_placeholder')}"
              class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input id="f-village" type="text" placeholder="${t('village')}"
              class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            <button id="btn-search" class="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg">${t('search')}</button>
          </div>
        </div>

        <!-- Selection bar -->
        <div id="selection-bar" class="hidden bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold" id="selection-count">0</span>
            <span class="text-sm font-medium text-emerald-700 dark:text-emerald-300"><span id="sel-count-text">0</span> ${t('cards_ready')}</span>
            <button onclick="clearCardSelection()" class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline ml-2">${t('clear')}</button>
          </div>
          <button onclick="downloadBulkCards()" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg">
            📄 ${t('download_selected_pdf')}
          </button>
        </div>
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
  `;

  // Inject card styles for preview
  const styleEl = document.createElement('div');
  styleEl.innerHTML = cardStyles();
  document.head.appendChild(styleEl.querySelector('style'));

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
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50 ${state.selectedIds.has(r.id) ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}" data-farmer-row="${r.id}">
            <td class="px-4 py-3">
              <input type="checkbox" data-farmer-id="${r.id}" ${state.selectedIds.has(r.id) ? 'checked' : ''}
                onchange="toggleSelectFarmer(${r.id}, this.checked)"
                class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 bg-white dark:bg-slate-700 cursor-pointer" />
            </td>
            <td class="px-4 py-3 cursor-pointer" onclick="showPreview(${r.id})">
              <div class="font-medium text-slate-800 dark:text-white hover:text-emerald-600">${escapeHtml(r.first_name)} ${escapeHtml(r.last_name || '')}</div>
              <div class="text-xs text-slate-500 dark:text-slate-400">${escapeHtml(r.resident_id)}</div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 font-mono">${escapeHtml(r.farmer_id || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.gat_number || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.village || '—')}</td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(r.mobile_number || '—')}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-1">
                <button onclick="showPreview(${r.id})" title="${t('preview')}" class="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded hover:bg-emerald-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                </button>
                <button onclick="downloadSinglePDF(${r.id})" title="${t('download_pdf')}" class="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                </button>
                <button onclick="downloadSingleJPG(${r.id})" title="${t('download_jpg')}" class="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
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

  // --- Card preview ---
  window.showPreview = async (id) => {
    const previewEl = document.getElementById('card-preview');
    const actionsEl = document.getElementById('preview-actions');
    previewEl.innerHTML = '<div class="text-slate-400 text-sm">Loading...</div>';
    actionsEl.innerHTML = '';
    try {
      const farmer = await api.get(`/residents/${id}`);
      state.previewFarmer = farmer;
      // Render front + back side by side, scaled down for preview
      previewEl.innerHTML = `
        <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;transform:scale(0.85);transform-origin:center;">
          <div id="preview-card-front">${cardFrontHTML(farmer)}</div>
          <div id="preview-card-back">${cardBackHTML(farmer)}</div>
        </div>
      `;
      actionsEl.innerHTML = `
        <button onclick="downloadSinglePDF(${id})" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg">📄 PDF</button>
        <button onclick="downloadSingleJPG(${id})" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg">🖼️ JPG</button>
      `;
    } catch (e) {
      previewEl.innerHTML = `<div class="text-rose-600 text-sm">${escapeHtml(e.message)}</div>`;
    }
  };

  // --- Single card PDF download (portrait, front + back) ---
  window.downloadSinglePDF = async (id) => {
    try {
      const farmer = await api.get(`/residents/${id}`);
      printFarmerCards([farmer], false);
      toast(t('print_dialog_opened'), 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  // --- Single card JPG download (html2canvas on preview) ---
  window.downloadSingleJPG = async (id) => {
    try {
      const farmer = await api.get(`/residents/${id}`);
      // Create a temporary off-screen container with the card
      const tmp = document.createElement('div');
      tmp.style.cssText = 'position:fixed;left:-9999px;top:0;';
      tmp.innerHTML = cardStyles() + cardFrontHTML(farmer);
      document.body.appendChild(tmp);
      const cardEl = tmp.querySelector('.farmer-card');
      await captureCardAsJPG(cardEl, `farmer_card_${id}.jpg`);
      document.body.removeChild(tmp);
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  // --- Bulk PDF download (portrait, 3 fronts per row + 3 backs per row) ---
  window.downloadBulkCards = async () => {
    const ids = Array.from(state.selectedIds);
    if (!ids.length) { toast(t('no_farmers_selected'), 'warning'); return; }
    try {
      // Fetch all selected farmers' data
      const farmers = [];
      for (const id of ids) {
        try {
          const f = await api.get(`/residents/${id}`);
          farmers.push(f);
        } catch (e) { /* skip */ }
      }
      if (!farmers.length) { toast('No farmers found', 'error'); return; }
      printFarmerCards(farmers, true);
      toast(t('print_dialog_opened'), 'success');
    } catch (e) {
      toast(e.message, 'error');
    }
  };

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

  await loadFarmers();
})();
