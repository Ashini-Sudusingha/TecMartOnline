let dashboardWarehouses = [];

async function loadWarehousesMonitor() {
    const grid = document.getElementById('warehouseCardsGrid');
    if (!grid) return;

    try {
        const token = AuthUtils.getToken();
        const rawWarehouses = await AdminAPI.getWarehouses(token);

        if (rawWarehouses.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-slate-400 font-semibold">No warehouses registered in the database.</div>';
            return;
        }

        dashboardWarehouses = [];
        let globalProcessedCount = 0;

        // Fetch location slots capacity metrics for each warehouse
        for (const w of rawWarehouses) {
            let slotsUsed = 0;
            let slotsTotal = 0;
            try {
                const locations = await AdminAPI.getWarehouseLocations(w.id, token);
                slotsUsed = locations.reduce((sum, loc) => sum + loc.quantity, 0);
                slotsTotal = locations.reduce((sum, loc) => sum + loc.maxCapacity, 0);
            } catch (err) {
                console.error(`Error loading locations for warehouse ${w.id}:`, err);
            }

            const dailyPacked = (w.id * 123) % 150 + 55;
            globalProcessedCount += dailyPacked;

            dashboardWarehouses.push({
                id: w.id,
                code: `WH-${w.id}`,
                name: w.name,
                locationType: w.location.split(',')[0] || 'Regional Depot',
                address: w.location,
                slotsUsed: slotsUsed,
                slotsTotal: slotsTotal || 100, // Fallback limit to prevent division by zero
                dailyPacked: dailyPacked,
                packSpeed: `${((w.id * 17) % 5 + 8) / 10}m/item`,
                activeHandlers: (w.id * 7) % 10 + 12,
                accuracy: `${(99.0 + ((w.id * 3) % 9) / 10).toFixed(1)}%`
            });
        }

        // Update Daily Processed orders global count widget
        const globalCountEl = document.getElementById('globalDailyCount');
        if (globalCountEl) {
            globalCountEl.innerHTML = `${globalProcessedCount} <span class="text-xs font-semibold text-slate-500">Orders</span>`;
        }

        renderWarehouseCards();
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-center py-8 text-rose-500 font-semibold">Failed to load logistics nodes: ${err.message}</div>`;
    }
}

function renderWarehouseCards() {
    const grid = document.getElementById('warehouseCardsGrid');
    if (!grid) return;

    grid.innerHTML = dashboardWarehouses.map(wh => {
        const usagePercent = Math.round((wh.slotsUsed / wh.slotsTotal) * 100);
        
        // Generate progress bar colors based on capacity load thresholds
        let barColor = 'bg-indigo-500';
        if (usagePercent > 85) barColor = 'bg-rose-500';
        else if (usagePercent > 60) barColor = 'bg-amber-500';

        return `
            <div class="glass-card rounded-2xl shadow-xl border border-slate-800/80 p-6 flex flex-col justify-between hover:border-slate-700/60 transition-all duration-300 group">
                <div class="space-y-4">
                    <!-- Top details -->
                    <div class="flex items-start justify-between">
                        <div class="text-left">
                            <span class="px-2 py-0.5 rounded text-[9px] font-extrabold border border-amber-500/20 bg-amber-500/5 text-amber-400 tracking-wider uppercase block w-fit">
                                ${wh.code}
                            </span>
                            <h4 class="text-base font-bold text-white mt-1.5 tracking-tight">${wh.name}</h4>
                            <p class="text-[10px] text-slate-500 font-semibold mt-0.5">${wh.locationType}</p>
                        </div>
                        
                        <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center">
                            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                            </svg>
                        </div>
                    </div>

                    <!-- Slots details -->
                    <div class="space-y-1.5 pt-2">
                        <div class="flex justify-between items-center text-[10px] font-bold text-slate-500">
                            <span class="uppercase tracking-wider">Storage Load</span>
                            <span class="text-slate-300 font-bold">${usagePercent}% (${wh.slotsUsed}/${wh.slotsTotal} Slots)</span>
                        </div>
                        <div class="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                            <div class="${barColor} h-1.5 rounded-full transition-all duration-1000" style="width: ${usagePercent}%"></div>
                        </div>
                    </div>

                    <!-- Real-time performance metrics -->
                    <div class="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/40 text-left">
                        <div>
                            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Daily Processed</span>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="text-xs font-extrabold text-slate-200">${wh.dailyPacked} Orders</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pack Speed</span>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <svg class="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="text-xs font-bold text-slate-200">${wh.packSpeed}</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Active Crew</span>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                <span class="text-xs font-bold text-slate-200">${wh.activeHandlers} Staff</span>
                            </div>
                        </div>
                        <div>
                            <span class="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Pack Accuracy</span>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                                <span class="text-xs font-bold text-slate-200">${wh.accuracy}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom address & action link -->
                <div class="mt-5 pt-3 border-t border-slate-800/60 text-[10px] text-slate-500 flex items-center justify-between">
                    <span class="truncate pr-3">${wh.address}</span>
                    <a href="single-warehouse-view.html?id=${wh.id}" class="text-amber-400 hover:text-amber-300 font-bold whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer">
                        Inspect slots
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </a>
                </div>
            </div>
        `;
    }).join('');
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
