/* Reports page — links to CSV exports */
(async function () {
  const user = await bootPage('reports', 'Reports', { subtitle: 'Download data exports' });
  if (!user) return;
  const main = document.getElementById('page-content');

  const cards = [
    { title: 'Resident Report', desc: 'Complete resident master list with all demographic fields.', href: '/api/reports/residents.csv', icon: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-8 0 4 4 0 008 0z', color: 'from-blue-500 to-blue-600' },
    { title: 'Family Report', desc: 'All families with head, village, ward, and member counts.', href: '/api/reports/families.csv', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3', color: 'from-purple-500 to-purple-600' },
    { title: 'Scheme Report', desc: 'All government schemes with eligibility & status.', href: '/api/reports/schemes.csv', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16', color: 'from-amber-500 to-amber-600' },
    { title: 'Pending Applications', desc: 'Applications in applied / pending / processing state.', href: '/api/reports/applications.csv?status_filter=pending', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-orange-500 to-orange-600' },
    { title: 'Approved Applications', desc: 'Approved applications for the disbursement team.', href: '/api/reports/applications.csv?status_filter=approved', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-green-500 to-green-600' },
    { title: 'All Applications', desc: 'Every application regardless of status.', href: '/api/reports/applications.csv', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2', color: 'from-indigo-500 to-indigo-600' },
    { title: 'Ward Report', desc: 'Resident counts grouped by village + ward.', href: '/api/reports/ward.csv', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4z', color: 'from-rose-500 to-rose-600' },
    { title: 'Village Report', desc: 'Resident counts aggregated per village.', href: '/api/reports/village.csv', icon: 'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9', color: 'from-emerald-500 to-emerald-600' },
  ];

  main.innerHTML = `
    <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-5 mb-6 border border-indigo-100 dark:border-indigo-900/40">
      <h2 class="text-lg font-bold text-slate-800 dark:text-white">Export Reports</h2>
      <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">All reports download as CSV files that open directly in Microsoft Excel, Google Sheets, or Apple Numbers.</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${cards.map(c => `
        <a href="${c.href}" class="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br ${c.color} flex items-center justify-center text-white mb-3">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${c.icon}"/></svg>
          </div>
          <h3 class="font-semibold text-slate-800 dark:text-white text-sm">${c.title}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">${c.desc}</p>
          <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-3 font-medium">Download CSV →</p>
        </a>
      `).join('')}
    </div>

    <div class="mt-8 bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 class="font-semibold text-slate-800 dark:text-white mb-2">Other Formats</h3>
      <p class="text-sm text-slate-600 dark:text-slate-400">Need a PDF or printed copy? Use the <strong>Print</strong> button on any resident profile, scheme detail, or application detail page — your browser's print dialog includes a "Save as PDF" option.</p>
    </div>
  `;
})();
