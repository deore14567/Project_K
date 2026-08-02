/* Documents vault page */
(async function () {
  const user = await bootPage('documents', 'Document Vault', {
    subtitle: 'Upload, preview & manage documents',
    actions: `
      <button onclick="openUploadModal()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
        Upload
      </button>
    `,
  });
  if (!user) return;
  const main = document.getElementById('page-content');

  const state = {
    page: 1, per_page: 24,
    resident_id: getQueryParam('resident_id') || '',
    doc_type: '',
  };

  main.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="f-resident" type="number" placeholder="Resident ID" value="${state.resident_id}"
          class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <select id="f-type" class="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
          <option value="">All Types</option>
          ${['Aadhaar','PAN','Income Certificate','Caste Certificate','Birth Certificate','Death Certificate','Ration Card','Election Card','Passport','Driving License','Domicile Certificate','Electricity Bill','Water Bill','Others'].map(t => `<option value="${t}">${t}</option>`).join('')}
        </select>
        <button id="btn-search" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Apply Filters</button>
      </div>
    </div>

    <div id="docs-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      ${Array(8).fill('<div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-32"><div class="h-4 w-2/3 skeleton rounded mb-2"></div><div class="h-3 w-1/3 skeleton rounded"></div></div>').join('')}
    </div>
    <div id="pagination" class="mt-4 flex items-center justify-between text-sm"></div>
  `;

  document.getElementById('btn-search').addEventListener('click', () => {
    state.resident_id = document.getElementById('f-resident').value.trim();
    state.doc_type = document.getElementById('f-type').value;
    state.page = 1;
    loadList();
  });

  async function loadList() {
    const grid = document.getElementById('docs-grid');
    grid.innerHTML = Array(6).fill('<div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 h-32"><div class="h-4 w-2/3 skeleton rounded mb-2"></div><div class="h-3 w-1/3 skeleton rounded"></div></div>').join('');
    try {
      const res = await api.get('/documents', {
        page: state.page, per_page: state.per_page,
        resident_id: state.resident_id, doc_type: state.doc_type,
      });
      if (!res.items.length) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-12">No documents found.</div>`;
      } else {
        grid.innerHTML = res.items.map(d => docCard(d)).join('');
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

  function docCard(d) {
    const icon = d.mime_type && d.mime_type.includes('pdf')
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>';
    return `
      <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
        <div class="flex items-start gap-3">
          <div class="w-12 h-12 rounded-lg ${d.mime_type && d.mime_type.includes('pdf') ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'} flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icon}</svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold text-slate-800 dark:text-white truncate">${escapeHtml(d.doc_type)}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">${escapeHtml(d.title || d.file_name || '—')}</p>
            <p class="text-xs text-slate-400 mt-1">v${d.version} · ${d.file_size_human || (d.file_size + ' B')}</p>
            <p class="text-xs text-slate-400">Resident #${d.resident_id}</p>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-1">
          <button onclick="previewDoc(${d.id})" class="px-2 py-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100">Preview</button>
          <button onclick="downloadDoc(${d.id})" class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200">Download</button>
          <button onclick="showVersions(${d.id})" class="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded">Versions</button>
          <button onclick="deleteDoc(${d.id})" class="px-2 py-1 text-xs bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded hover:bg-rose-100">Delete</button>
        </div>
      </div>
    `;
  }

  window.gotoPage = (n) => { if (n >= 1) { state.page = n; loadList(); } };
  window.previewDoc = (id) => window.open(`/api/documents/${id}/preview`, '_blank');
  window.downloadDoc = async (id) => {
    try {
      const blob = await api.get(`/documents/${id}/download`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `document-${id}`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { toast(e.message, 'error'); }
  };
  window.showVersions = async (id) => {
    try {
      const res = await api.get(`/documents/${id}/versions`);
      openModal(`
        <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800 dark:text-white">Version History</h3>
          <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
        </div>
        <div class="p-5">
          <table class="w-full text-sm">
            <thead><tr class="text-left text-slate-500"><th class="py-2">Version</th><th>File</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
            <tbody>
              ${res.items.map(v => `
                <tr class="border-t border-slate-100 dark:border-slate-700">
                  <td class="py-2">v${v.version} ${v.is_latest ? '<span class="text-xs text-emerald-600">(latest)</span>' : ''}</td>
                  <td>${escapeHtml(v.file_name || '—')}</td>
                  <td>${v.file_size_human || v.file_size + ' B'}</td>
                  <td>${fmtDate(v.created_at)}</td>
                  <td><button onclick="downloadDoc(${v.id})" class="text-indigo-600 hover:underline">Download</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `);
    } catch (e) { toast(e.message, 'error'); }
  };
  window.deleteDoc = async (id) => {
    if (!confirm('Delete this document version?')) return;
    try {
      await api.del(`/documents/${id}`);
      toast('Document deleted', 'success');
      loadList();
    } catch (e) { toast(e.message, 'error'); }
  };

  window.openUploadModal = () => {
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">Upload Document</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="upload-form" class="p-5 space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resident ID <span class="text-rose-500">*</span></label>
          <input name="resident_id" type="number" required value="${state.resident_id}" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Type <span class="text-rose-500">*</span></label>
          <select name="doc_type" required class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
            ${['Aadhaar','PAN','Income Certificate','Caste Certificate','Birth Certificate','Death Certificate','Ration Card','Election Card','Passport','Driving License','Domicile Certificate','Electricity Bill','Water Bill','Others'].map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title (optional)</label>
          <input name="title" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">File <span class="text-rose-500">*</span></label>
          <input name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required class="w-full text-sm" />
          <p class="text-xs text-slate-500 mt-1">Allowed: PDF, JPG, PNG · Max 5 MB</p>
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">Upload</button>
        </div>
      </form>
    `);
    document.getElementById('upload-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api.upload('/documents/upload', fd);
        toast('Document uploaded', 'success');
        closeModal();
        loadList();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  await loadList();
})();
