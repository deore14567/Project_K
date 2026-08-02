/* Reports page — multi-format exports with format picker */
(async function () {
  const user = await bootPage('reports', 'Reports', { subtitle: 'Download data exports in your preferred format' });
  if (!user) return;
  const main = document.getElementById('page-content');

  const reports = [
    { key: 'residents',    title: 'Resident Report',         desc: 'Complete resident master list with all demographic fields.',  icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0z', color: 'from-blue-500 to-blue-600' },
    { key: 'families',     title: 'Family Report',           desc: 'All families with head, village, ward, and member counts.',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3',                  color: 'from-purple-500 to-purple-600' },
    { key: 'schemes',      title: 'Scheme Report',           desc: 'All government schemes with eligibility & status.',           icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16',                       color: 'from-amber-500 to-amber-600' },
    { key: 'applications', title: 'All Applications',        desc: 'Every application regardless of status.',                     icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', color: 'from-indigo-500 to-indigo-600', statusPicker: true },
    { key: 'ward',         title: 'Ward Report',             desc: 'Resident counts grouped by village + ward.',                  icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5z', color: 'from-rose-500 to-rose-600' },
    { key: 'village',      title: 'Village Report',          desc: 'Resident counts aggregated per village.',                     icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z', color: 'from-emerald-500 to-emerald-600' },
  ];

  const formats = [
    { ext: 'xlsx', label: 'Excel',  icon: '📊', color: 'bg-emerald-600 hover:bg-emerald-700', hint: '.xlsx — opens in Excel / Sheets' },
    { ext: 'pdf',  label: 'PDF',    icon: '📄', color: 'bg-rose-600 hover:bg-rose-700',       hint: '.pdf — print-ready' },
    { ext: 'docx', label: 'Word',   icon: '📝', color: 'bg-blue-600 hover:bg-blue-700',       hint: '.docx — editable Word doc' },
    { ext: 'csv',  label: 'CSV',    icon: '🗂️', color: 'bg-slate-600 hover:bg-slate-700',     hint: '.csv — universal spreadsheet' },
    { ext: 'txt',  label: 'Text',   icon: '📃', color: 'bg-amber-600 hover:bg-amber-700',     hint: '.txt — plain text table' },
  ];

  main.innerHTML = `
    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 mb-6 border border-indigo-100 dark:border-indigo-900/40">
      <h2 class="text-lg font-bold text-slate-800 dark:text-white">Export Reports</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">Choose a report, then click your preferred format. Files download instantly and open in Microsoft Office, Google Workspace, LibreOffice, or Apple iWork.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      ${reports.map(r => `
        <div class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
          <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center text-white flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${r.icon}"/></svg>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-slate-800 dark:text-white">${r.title}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${r.desc}</p>
            </div>
          </div>
          ${r.statusPicker ? `
            <div class="mb-3">
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Status filter (optional)</label>
              <select id="filter-${r.key}" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
                <option value="">All statuses</option>
                <option value="applied">Applied</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          ` : ''}
          <div class="grid grid-cols-5 gap-1.5">
            ${formats.map(f => `
              <button onclick="downloadReport('${r.key}', '${f.ext}')" title="${f.hint}"
                class="flex flex-col items-center gap-1 px-2 py-2 ${f.color} text-white text-xs font-medium rounded-lg transition-all hover:-translate-y-0.5">
                <span class="text-base">${f.icon}</span>
                <span>${f.label}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <div class="mt-6 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 class="font-semibold text-slate-800 dark:text-white mb-2">Need a custom report?</h3>
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-3">Use the filters on the Residents or Applications page to narrow down your list, then click the "Download" button at the top of the page to export the filtered set.</p>
      <div class="flex gap-2">
        <a href="/residents.html" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">Go to Residents →</a>
        <a href="/applications.html" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg">Go to Applications →</a>
      </div>
    </div>
  `;

  // `downloadReport` is defined in ui.js.
  // For applications with a status filter, we need to pass params.
  const origDownloadReport = window.downloadReport;
  window.downloadReport = async (entity, fmt) => {
    const filterEl = document.getElementById(`filter-${entity}`);
    const params = filterEl && filterEl.value ? `status_filter=${filterEl.value}` : '';
    return origDownloadReport(entity, fmt, params);
  };
})();
