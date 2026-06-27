let dashboardWarehouses = [];
let selectedWarehouseId = null;
let warehouseNotifications = {}; // Key: warehouseName, Value: Array of stock alerts

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

        if (selectedWarehouseId === null && dashboardWarehouses.length > 0) {
            selectWarehouse(dashboardWarehouses[0].id, dashboardWarehouses[0].name);
        }
    } catch (err) {
        grid.innerHTML = `<div class="col-span-full text-center py-8 text-rose-500 font-semibold">Failed to load warehouses: ${err.message}</div>`;
    }
}

function renderWarehouseCards() {
    const grid = document.getElementById('warehouseCardsGrid');
    if (!grid) return;

    grid.innerHTML = dashboardWarehouses.map(w => {
        const isSelected = w.id === selectedWarehouseId;
        const borderStyle = isSelected ? 'border-amber-400 bg-amber-50/20 shadow-md' : 'border-slate-200 hover:border-slate-400';
        const badgeStyle = isSelected ? 'bg-amber-400 text-slate-900' : 'bg-slate-100 text-slate-600';

        return `
            <div onclick="selectWarehouse(${w.id}, '${w.name.replace(/'/g, "\\'")}')" class="bg-white p-5 rounded-2xl border-2 ${borderStyle} transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[140px]">
                <div class="flex items-start justify-between">
                    <div class="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center text-xl">🏢</div>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-md ${badgeStyle}">ID: #${w.id}</span>
                </div>
                <div class="space-y-1 mt-4">
                    <h4 class="font-black text-slate-900 text-sm leading-tight">${w.name}</h4>
                    <p class="text-[10px] text-slate-500 font-semibold truncate">${w.location || 'N/A'}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function selectWarehouse(warehouseId, warehouseName) {
    selectedWarehouseId = warehouseId;
    renderWarehouseCards();

    const panel = document.getElementById('warehouseDetailsPanel');
    if (panel) panel.classList.remove('hidden');

    await Promise.all([
        loadWarehouseInventory(warehouseId),
        loadWarehouseLocationsCapacity(warehouseId)
    ]);

    renderWarehouseLiveLogs(warehouseName);
}

async function loadWarehouseLocationsCapacity(warehouseId) {
    const container = document.getElementById('warehouseLocationsCapacity');
    if (!container) return;

    try {
        const token = AuthUtils.getToken();
        const locations = await AdminAPI.getWarehouseLocations(warehouseId, token);

        if (locations.length === 0) {
            container.innerHTML = '<div class="col-span-full text-slate-400 text-xs font-semibold py-4">No locations/slots added for this warehouse.</div>';
            return;
        }

        container.innerHTML = locations.map(l => {
            const percentage = Math.min(100, Math.max(0, (l.quantity / l.maxCapacity) * 100));
            let colorClass = 'bg-emerald-500';
            if (percentage >= 90) colorClass = 'bg-rose-500';
            else if (percentage >= 70) colorClass = 'bg-amber-500';

            return `
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2">
                    <div class="flex items-center justify-between text-xs font-bold">
                        <span class="text-slate-800">${l.location}</span>
                        <span class="text-slate-500">${l.quantity} / ${l.maxCapacity} units</span>
                    </div>
                    <div class="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div class="h-full rounded-full ${colorClass} transition-all duration-300" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading locations capacity:', err);
    }
}

async function loadWarehouseInventory(warehouseId) {
    const tbody = document.getElementById('warehouseInventoryBody');
    const badge = document.getElementById('inventoryCountBadge');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const items = await AdminAPI.getWarehouseInventory(warehouseId, token);

        if (badge) badge.textContent = `${items.length} Items`;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-semibold">No stock items available in this warehouse.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            return `
                <tr class="hover:bg-slate-50/50 transition-all">
                    <td class="py-3 px-4 font-bold text-slate-400">#ITEM-${item.id}</td>
                    <td class="py-3 px-4 font-bold text-slate-900">${item.productName || 'N/A'}</td>
                    <td class="py-3 px-4 text-slate-500 font-semibold">${item.location || 'N/A'}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">Rs. ${parseFloat(item.buyingPrice).toFixed(2)}</td>
                    <td class="py-3 px-4 font-black text-slate-700">${item.stockQuantity} units</td>
                    <td class="py-3 px-4">
                        <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">${item.statusName || 'Active'}</span>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-500 font-semibold">Error: ${err.message}</td></tr>`;
    }
}

function renderWarehouseLiveLogs(warehouseName) {
    const logsContainer = document.getElementById('warehouseLiveLogs');
    if (!logsContainer) return;

    const list = warehouseNotifications[warehouseName] || [];

    if (list.length === 0) {
        logsContainer.innerHTML = '<div class="text-center py-8 text-slate-400 font-medium text-xs">No live notifications received yet.</div>';
        return;
    }

    logsContainer.innerHTML = list.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        return `
            <div class="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1 transform transition-all duration-200 hover:scale-[1.01] hover:border-slate-300 animate-fade-in">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Replenished</span>
                    <span class="text-[10px] text-slate-400 font-bold">${time}</span>
                </div>
                <p class="text-xs font-semibold text-slate-700 leading-relaxed">
                    Added <b class="text-slate-900">${log.replenishedQuantity} units</b> of <b class="text-slate-900">${log.productName}</b> to location <b class="text-slate-950">${log.locationName || 'Slot'}</b>.
                </p>
            </div>
        `;
    }).join('');
}

// Bind live WebSocket stockUpdate events
window.addEventListener('stockUpdate', async (e) => {
    const data = e.detail;
    console.log("Warehouse Dashboard received live stock event:", data);

    if (data.warehouseName) {
        if (!warehouseNotifications[data.warehouseName]) {
            warehouseNotifications[data.warehouseName] = [];
        }

        // Add to front
        warehouseNotifications[data.warehouseName].unshift({
            productName: data.productName,
            replenishedQuantity: data.replenishedQuantity,
            locationName: data.locationName,
            timestamp: data.timestamp || Date.now()
        });

        if (warehouseNotifications[data.warehouseName].length > 50) {
            warehouseNotifications[data.warehouseName].pop();
        }

        const selectedWh = dashboardWarehouses.find(w => w.id === selectedWarehouseId);
        
        if (selectedWh && selectedWh.name === data.warehouseName) {
            renderWarehouseLiveLogs(data.warehouseName);
            await Promise.all([
                loadWarehouseInventory(selectedWarehouseId),
                loadWarehouseLocationsCapacity(selectedWarehouseId)
            ]);
        }
    }
});

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
