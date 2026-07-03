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
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-rose-500 font-bold">Failed to load system user accounts.</td></tr>';
    }
}

function renderUserRows(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-slate-400 font-semibold bg-slate-900/10">No accounts match search query.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => {
        const isClient = user.role === 'CUSTOMER';
        const roleClass = isClient 
            ? 'border-indigo-500/20 bg-indigo-500/5 text-indigo-400' 
            : 'border-amber-500/20 bg-amber-500/5 text-amber-400';

        return `
            <tr class="hover:bg-slate-900/10 transition-colors border-b border-slate-800/40 last:border-b-0">
                <td class="py-4 px-6 text-slate-500 font-bold">#USR-${user.id}</td>
                <td class="py-4 px-6 font-bold text-white">${user.firstName || ''} ${user.lastName || ''}</td>
                <td class="py-4 px-6 text-slate-300 font-semibold">${user.email}</td>
                <td class="py-4 px-6 text-slate-450 font-semibold">${user.mobile || 'N/A'}</td>
                <td class="py-4 px-6">
                    <span class="px-2 py-0.5 rounded text-[9px] font-extrabold border ${roleClass} uppercase tracking-wider">
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
            const firstName = (user.firstName || '').toLowerCase();
            const lastName = (user.lastName || '').toLowerCase();
            const fullName = `${firstName} ${lastName}`;
            const email = (user.email || '').toLowerCase();
            const role = (user.role || '').toLowerCase();
            
            return firstName.includes(query) ||
                   lastName.includes(query) ||
                   fullName.includes(query) ||
                   email.includes(query) ||
                   role.includes(query);
        });

        renderUserRows(filtered);
    });
}

document.addEventListener('DOMContentLoaded', loadUsers);
