let dashboardWarehouses = [];

async function loadWarehousesMonitor() {
    const grid = document.getElementById('warehouseCardsGrid');
    if (!grid) return;

    try {
        const token = AuthUtils.getToken();
        dashboardWarehouses = await AdminAPI.getWarehouses(token);

        if (dashboardWarehouses.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400 font-semibold">No warehouses registered.</div>';
            return;
        }

        renderWarehouseCards();
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-center py-8 text-rose-500 font-semibold">Failed to load warehouses: ${err.message}</div>`;
    }
}

function renderWarehouseCards() {
    const grid = document.getElementById('warehouseCardsGrid');
    if (!grid) return;

    grid.innerHTML = dashboardWarehouses.map(w => {
        return `
            <div onclick="goToWarehouseDetail(${w.id})" class="glass-card rounded-2xl shadow-xl border border-slate-800/80 p-6 flex flex-col justify-between hover:border-slate-700/60 hover:scale-[1.01] transition-all duration-200 cursor-pointer min-h-[160px] group text-left">
                <div class="flex items-start justify-between">
                    <div>
                        <span class="px-2 py-0.5 rounded text-[9px] font-extrabold border border-amber-500/20 bg-amber-500/5 text-amber-400 tracking-wider uppercase block w-fit">
                            ID: #${w.id}
                        </span>
                        <h4 class="text-base font-bold text-white mt-3 tracking-tight">${w.name}</h4>
                        <p class="text-[10px] text-slate-500 font-semibold truncate mt-0.5">${w.location || 'N/A'}</p>
                    </div>
                    <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                        <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                    </div>
                </div>
                <div class="mt-4 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
                    <span class="truncate pr-3 text-slate-400 font-medium">Inspect capacity & slots</span>
                    <span class="text-amber-400 hover:text-amber-300 font-bold whitespace-nowrap transition-colors flex items-center gap-1">
                        Open Hub
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

function goToWarehouseDetail(id) {
    window.location.href = `single-warehouse-view.html?id=${id}`;
}

// Setup admin details and event bindings on load
document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    
    const user = AuthUtils.getUser();
    if (user) {
        const name = document.getElementById('adminName');
        if (name) {
            if (user.firstName && user.lastName) {
                name.textContent = `${user.firstName} ${user.lastName}`;
            } else if (user.name) {
                name.textContent = user.name;
            } else if (user.email) {
                name.textContent = user.email.split('@')[0];
            }
        }
    }

    loadWarehousesMonitor();
});
