let allUsers = [];

async function loadUsers() {
    if (!AuthUtils.checkAuth('ADMIN')) return;

    const token = AuthUtils.getToken();
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    try {
        const users = await AdminAPI.getUsers(token);
        allUsers = users;
        
        renderUserRows(allUsers);
        setupSearchListener();
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-rose-500 font-bold">Failed to load users.</td></tr>';
    }
}

function renderUserRows(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-semibold">No users match search query.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => {
        return `
            <tr class="hover:bg-slate-50/50 transition-all">
                <td class="py-4 px-6 font-bold text-slate-400">#${user.id}</td>
                <td class="py-4 px-6 font-bold text-slate-900">${user.firstName} ${user.lastName}</td>
                <td class="py-4 px-6 text-slate-500 font-semibold">${user.email}</td>
                <td class="py-4 px-6 text-slate-500 font-semibold">${user.mobile || 'N/A'}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        ${user.role}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function setupSearchListener() {
    const searchInput = document.getElementById('userSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        const filtered = allUsers.filter(user => {
            const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
            return user.firstName.toLowerCase().includes(query) ||
                   user.lastName.toLowerCase().includes(query) ||
                   fullName.includes(query) ||
                   user.email.toLowerCase().includes(query) ||
                   user.role.toLowerCase().includes(query);
        });

        renderUserRows(filtered);
    });
}

document.addEventListener('DOMContentLoaded', loadUsers);
