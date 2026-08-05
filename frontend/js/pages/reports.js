/* Reports page — multi-format exports with format picker */
(async function () {
  const user = await bootPage('reports', t('reports'), { subtitle: t('export_reports_desc') });
  if (!user) return;
  const main = document.getElementById('page-content');

  const reports = [
    { key: 'residents',    title: t('resident_report'),         desc: t('resident_report_desc'),         icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0z', color: 'from-blue-500 to-blue-600', statusPicker: false },
    { key: 'applications', title: t('all_applications'),        desc: t('all_applications_desc'),        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', color: 'from-indigo-500 to-indigo-600', statusPicker: true },
    { key: 'village',      title: t('village_report'),          desc: t('village_report_desc'),          icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z', color: 'from-emerald-500 to-emerald-600', statusPicker: false },
  ];

  const formats = [
    { ext: 'xlsx', label: t('excel'),  icon: '📊', color: 'bg-emerald-600 hover:bg-emerald-700', hint: '.xlsx — Excel' },
    { ext: 'pdf',  label: t('pdf'),    icon: '📄', color: 'bg-rose-600 hover:bg-rose-700',       hint: '.pdf — PDF' },
    { ext: 'docx', label: t('word'),   icon: '📝', color: 'bg-blue-600 hover:bg-blue-700',       hint: '.docx — Word' },
    { ext: 'csv',  label: t('csv'),    icon: '🗂️', color: 'bg-slate-600 hover:bg-slate-700',     hint: '.csv — CSV' },
    { ext: 'txt',  label: t('txt'),    icon: '📃', color: 'bg-amber-600 hover:bg-amber-700',     hint: '.txt — Text' },
  ];

  main.innerHTML = `
    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 mb-6 border border-indigo-100 dark:border-indigo-900/40">
      <h2 class="text-lg font-bold text-slate-800 dark:text-white">${t('export_reports')}</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">${t('export_reports_desc')}</p>
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
              <label class="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">${t('status_filter')}</label>
              <select id="filter-${r.key}" class="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm">
                <option value="">${t('all_statuses')}</option>
                <option value="applied">${t('applied')}</option>
                <option value="pending">${t('pending')}</option>
                <option value="processing">${t('processing')}</option>
                <option value="approved">${t('approved')}</option>
                <option value="rejected">${t('rejected')}</option>
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
      <h3 class="font-semibold text-slate-800 dark:text-white mb-2">${t('need_custom_report')}</h3>
      <p class="text-sm text-slate-600 dark:text-slate-400 mb-3">${t('custom_report_hint')}</p>
      <div class="flex gap-2 flex-wrap">
        <a href="/farmer-card.html" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg">${t('farmer_card')} →</a>
        <a href="/residents.html" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">${t('go_to_farmers')} →</a>
      </div>
    </div>
  `;

  const origDownloadReport = window.downloadReport;
  window.downloadReport = async (entity, fmt) => {
    const filterEl = document.getElementById(`filter-${entity}`);
    const params = filterEl && filterEl.value ? `status_filter=${filterEl.value}` : '';
    return origDownloadReport(entity, fmt, params);
  };
})();
