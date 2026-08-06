/* Users page — admin-only */
(async function () {
  const user = await bootPage('users', 'User Management', {
    subtitle: 'Manage admin & operator accounts',
    adminOnly: true,
    actions: `
      <button onclick="openUserForm()" class="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
        Add User
      </button>
    `,
  });
  if (!user) return;
  const main = document.getElementById('page-content');

  const state = { page: 1, per_page: 20, q: '' };

  main.innerHTML = `
    <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 mb-4 flex gap-3">
      <input id="f-q" type="search" placeholder="Search by email or name…" class="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
      <button id="btn-search" class="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg">Search</button>
    </div>
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead class="bg-slate-50 dark:bg-slate-700/50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Email</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Role</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Last Login</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody id="user-tbody" class="divide-y divide-slate-100 dark:divide-slate-700">
            ${Array(4).fill(skeletonRow(6)).join('')}
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

  async function loadList() {
    const tbody = document.getElementById('user-tbody');
    tbody.innerHTML = Array(3).fill(skeletonRow(6)).join('');
    try {
      const res = await api.get('/users', { page: state.page, per_page: state.per_page, q: state.q });
      if (!res.items.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-10 text-center text-slate-500">No users found.</td></tr>`;
      } else {
        tbody.innerHTML = res.items.map(u => `
          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
            <td class="px-4 py-3 text-slate-800 dark:text-white text-sm">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold uppercase">${escapeHtml((u.full_name || u.email || '?')[0])}</div>
                ${escapeHtml(u.full_name)}
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">${escapeHtml(u.email)} ${copyButton(u.email, 'Email')}</td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 text-xs rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'}">${escapeHtml(u.role)}</span>
            </td>
            <td class="px-4 py-3">
              <span class="px-2 py-0.5 text-xs rounded-full ${u.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200'}">${u.is_active ? 'Active' : 'Disabled'}</span>
            </td>
            <td class="px-4 py-3 text-xs text-slate-500">${u.last_login ? fmtDateTime(u.last_login) : 'Never'}</td>
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button onclick="openUserForm(${u.id})" class="text-indigo-600 hover:underline text-sm mr-2">Edit</button>
              ${u.id !== user.id ? `
                <button onclick="resetUserPassword(${u.id}, '${escapeHtml(u.email)}')" class="text-amber-600 hover:underline text-sm mr-2">Reset Password</button>
                <button onclick="toggleBlockUser(${u.id}, ${u.is_active})" class="${u.is_active ? 'text-rose-600' : 'text-emerald-600'} hover:underline text-sm mr-2">${u.is_active ? 'Block' : 'Unblock'}</button>
                <button onclick="deleteUser(${u.id})" class="text-rose-600 hover:underline text-sm">Delete</button>
              ` : '<span class="text-xs text-slate-400">(you)</span>'}
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

  // Quick action: reset password
  window.resetUserPassword = (id, email) => {
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">Reset Password — ${escapeHtml(email)}</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="reset-pw-form" class="p-5 space-y-3">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password <span class="text-rose-500">*</span></label>
          <input name="password" type="password" required minlength="6" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" />
        </div>
        <div class="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs text-amber-700 dark:text-amber-300">
          ℹ️ Passwords are hashed with bcrypt and cannot be viewed. You can only set a new password.
        </div>
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg">Set New Password</button>
        </div>
      </form>
    `);
    document.getElementById('reset-pw-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await api.put(`/users/${id}`, { password: fd.get('password') });
        toast('Password reset successfully', 'success');
        closeModal();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  // Quick action: block / unblock user
  window.toggleBlockUser = async (id, currentlyActive) => {
    const action = currentlyActive ? 'Block' : 'Unblock';
    if (!confirm(`${action} this user account?`)) return;
    try {
      await api.put(`/users/${id}`, { is_active: !currentlyActive });
      toast(`User ${action.toLowerCase()}ed`, 'success');
      loadList();
    } catch (e) { toast(e.message, 'error'); }
  };
  window.openUserForm = (id = null) => {
    const isEdit = !!id;
    openModal(`
      <div class="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 class="font-semibold text-slate-800 dark:text-white">${isEdit ? 'Edit' : 'Add'} User</h3>
        <button onclick="closeModal()" class="text-slate-400 text-xl">&times;</button>
      </div>
      <form id="user-form" class="p-5 space-y-3">
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Full Name <span class="text-rose-500">*</span></label><input name="full_name" required class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email <span class="text-rose-500">*</span></label><input name="email" type="email" required ${isEdit ? 'readonly' : ''} class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm ${isEdit ? 'opacity-70' : ''}" /></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">${isEdit ? 'New Password (leave blank to keep)' : 'Password'} ${isEdit ? '' : '<span class="text-rose-500">*</span>'}</label><input name="password" type="password" ${isEdit ? '' : 'required'} minlength="6" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm" /></div>
        <div><label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label><select name="role" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm"><option value="operator">Operator</option><option value="admin">Admin</option></select></div>
        ${isEdit ? `<div><label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" name="is_active" class="rounded" /> Active</label></div>` : ''}
        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onclick="closeModal()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg">Cancel</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">${isEdit ? 'Save' : 'Create'}</button>
        </div>
      </form>
    `);
    if (isEdit) {
      api.get('/users').then(res => {
        const u = res.items.find(x => x.id === id);
        if (u) {
          const form = document.getElementById('user-form');
          form.full_name.value = u.full_name;
          form.email.value = u.email;
          form.role.value = u.role;
          form.is_active.checked = u.is_active;
        }
      });
    }
    document.getElementById('user-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const body = { full_name: fd.get('full_name'), role: fd.get('role') };
      const pwd = fd.get('password');
      if (pwd) body.password = pwd;
      if (isEdit) body.is_active = !!fd.get('is_active');
      else body.email = fd.get('email');
      try {
        if (isEdit) await api.put(`/users/${id}`, body);
        else await api.post('/users', body);
        toast(isEdit ? 'User updated' : 'User created', 'success');
        closeModal();
        loadList();
      } catch (err) { toast(err.message, 'error'); }
    });
  };

  window.deleteUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await api.del(`/users/${id}`);
      toast('User deleted', 'success');
      loadList();
    } catch (e) { toast(e.message, 'error'); }
  };

  await loadList();
})();
