let warehouseId = null;
let warehouseName = "";
let warehouseNotificationsList = [];
let currentPicklists = [];

async function loadWarehouseDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (!idParam) {
        alert("No warehouse ID specified.");
        window.location.href = "warehouse-dashboard.html";
        return;
    }
    warehouseId = parseInt(idParam);

    try {
        const token = AuthUtils.getToken();
        const warehouses = await AdminAPI.getWarehouses(token);
        const wh = warehouses.find(w => w.id === warehouseId);

        if (!wh) {
            alert("Specified warehouse not found.");
            window.location.href = "warehouse-dashboard.html";
            return;
        }

        warehouseName = wh.name;
        document.getElementById('viewWarehouseName').textContent = `🏢 ${wh.name}`;
        document.getElementById('viewWarehouseLoc').textContent = `${wh.location || 'No location address listed'}`;

        await Promise.all([
            loadWarehouseLocationsCapacity(warehouseId),
            loadWarehouseInventory(warehouseId),
            loadWarehousePicklists(warehouseId)
        ]);

        renderWarehouseLiveLogs();
    } catch (err) {
        console.error("Error loading warehouse details:", err);
    }
}

async function loadWarehouseLocationsCapacity(whId) {
    const container = document.getElementById('warehouseLocationsCapacity');
    if (!container) return;

    try {
        const token = AuthUtils.getToken();
        const locations = await AdminAPI.getWarehouseLocations(whId, token);

        if (locations.length === 0) {
            container.innerHTML = '<div class="col-span-full text-slate-500 text-xs font-semibold py-4">No locations/slots added for this warehouse.</div>';
            return;
        }

        container.innerHTML = locations.map(l => {
            const percentage = Math.min(100, Math.max(0, (l.quantity / l.maxCapacity) * 100));
            let colorClass = 'bg-emerald-500';
            if (percentage >= 90) colorClass = 'bg-rose-500';
            else if (percentage >= 70) colorClass = 'bg-amber-500';

            return `
                <div class="bg-slate-900/40 p-3.5 rounded-xl border border-slate-800/60 space-y-2 text-left">
                     <div class="flex items-center justify-between text-[11px] font-bold">
                        <span class="text-white">${l.location}</span>
                        <span class="text-slate-400">${l.quantity} / ${l.maxCapacity} units</span>
                    </div>
                    <div class="w-full bg-[#0b0f19] h-2 rounded-full overflow-hidden">
                        <div class="h-full rounded-full ${colorClass} transition-all duration-300" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading locations capacity:', err);
    }
}

async function loadWarehouseInventory(whId) {
    const tbody = document.getElementById('warehouseInventoryBody');
    const badge = document.getElementById('inventoryCountBadge');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const items = await AdminAPI.getWarehouseInventory(whId, token);

        if (badge) badge.textContent = `${items.length} Items`;

        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-400 font-semibold bg-slate-900/10">No stock items available in this warehouse.</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => {
            return `
                <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                    <td class="py-3 px-4 font-bold text-slate-500">#ITEM-${item.id}</td>
                    <td class="py-3 px-4 font-bold text-white">${item.productName || 'N/A'}</td>
                    <td class="py-3 px-4 text-slate-400 font-semibold">${item.location || 'N/A'}</td>
                    <td class="py-3 px-4 font-semibold text-slate-300">Rs. ${parseFloat(item.buyingPrice).toFixed(2)}</td>
                    <td class="py-3 px-4 font-bold text-amber-400">${item.stockQuantity} units</td>
                    <td class="py-3 px-4">
                        <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${item.statusName || 'Active'}</span>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-rose-450 font-semibold bg-slate-900/10">Error: ${err.message}</td></tr>`;
    }
}

async function loadWarehousePicklists(whId) {
    const tbody = document.getElementById('warehousePicklistsBody');
    const badge = document.getElementById('picklistCountBadge');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/orders/warehouses/${whId}/pick-lists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load pick lists");
        const json = await res.json();
        
        currentPicklists = json.data || [];
        if (badge) badge.textContent = `${currentPicklists.length} Assigned`;

        renderPicklistsTable(currentPicklists);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-rose-455 font-semibold bg-slate-900/10">Error: ${err.message}</td></tr>`;
    }
}

function renderPicklistsTable(list) {
    const tbody = document.getElementById('warehousePicklistsBody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-455 font-semibold bg-slate-900/10">No pick lists assigned to this warehouse yet.</td></tr>';
        return;
    }

    tbody.innerHTML = list.map(pl => {
        return `
            <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                <td class="py-3 px-4 font-bold text-white">#PL-${1000 + pl.id}</td>
                <td class="py-3 px-4 font-semibold text-slate-300">${pl.userName || 'Admin'}</td>
                <td class="py-3 px-4 text-slate-400 font-semibold">${Helpers.formatDate(pl.createdAt)}</td>
                <td class="py-3 px-4 font-bold text-amber-400">${pl.orders ? pl.orders.length : 0} Orders</td>
                <td class="py-3 px-4 text-right">
                    <button onclick="viewPicklistDetails(${pl.id})" class="px-3.5 py-1.5 bg-slate-800/60 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-slate-700/50 rounded-xl font-bold text-xs shadow-sm transition-all duration-150 cursor-pointer">View Orders & Items</button>
                </td>
            </tr>
        `;
    }).join('');
}

async function viewPicklistDetails(picklistId) {
    const pl = currentPicklists.find(p => p.id === picklistId);
    if (!pl) return;

    const modal = document.getElementById('pickListItemsModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.getElementById('plModalId').textContent = `Pick List Orders: #PL-${1000 + pl.id}`;
    document.getElementById('plModalDate').textContent = `Created on: ${Helpers.formatDate(pl.createdAt)}`;

    const body = document.getElementById('plModalBody');
    body.innerHTML = '<div class="text-center py-8 text-slate-500 text-xs font-semibold">Loading orders and items...</div>';

    try {
        const token = AuthUtils.getToken();
        
        let html = '';
        for (const order of (pl.orders || [])) {
            // Fetch items for this order
            const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${order.id}/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to load order items");
            const json = await res.json();
            const items = json.data || [];

            let itemsHtml = items.map(item => `
                <div class="flex justify-between items-center py-2 px-3 text-xs bg-slate-900/40 rounded-xl border border-slate-800/60 font-semibold text-slate-300">
                    <div class="text-left">
                        <span class="text-white font-bold block">${item.productName}</span>
                        <span class="text-slate-500 text-[10px] block">Product ID: #${item.productId}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-amber-400 font-bold block">${item.quantity} units</span>
                        <span class="text-slate-500 text-[10px] block">Price: ${Helpers.formatPrice(item.sellingPrice)}</span>
                    </div>
                </div>
            `).join('');

            if (items.length === 0) {
                itemsHtml = '<div class="text-center py-3 text-slate-500 text-xs font-semibold">No items found in this order.</div>';
            }

            let statusClass = 'bg-slate-800 text-slate-400 border border-slate-700/40';
            const status = order.status.toLowerCase();
            if (status === 'delivered') statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            else if (status === 'processing') statusClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            else if (status === 'shipped' || status === 'dispatched') statusClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            else if (status === 'cancelled') statusClass = 'bg-rose-500/10 text-rose-450 border-rose-500/20';
            else if (status === 'placed') statusClass = 'bg-amber-500/10 text-amber-405 border-amber-500/20';

            html += `
                <div class="bg-slate-900/20 rounded-2xl border border-slate-800/60 p-4 space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div class="text-left">
                            <span class="font-bold text-white text-xs block">#ORD-${10000 + order.id}</span>
                            <span class="text-[10px] text-slate-500 font-semibold mt-0.5">Customer: ${order.customerName || 'Guest'}</span>
                        </div>
                        <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg border ${statusClass}">${order.status}</span>
                    </div>
                    <div class="space-y-2">
                        ${itemsHtml}
                    </div>
                </div>
            `;
        }

        if (html === '') {
            html = '<div class="text-center py-8 text-slate-500 text-xs font-semibold">No orders assigned to this pick list.</div>';
        }

        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<div class="text-center py-8 text-rose-450 text-xs font-semibold">Error: ${err.message}</div>`;
    }
}

function closePicklistItemsModal() {
    const modal = document.getElementById('pickListItemsModal');
    if (modal) modal.classList.add('hidden');
}

function renderWarehouseLiveLogs() {
    const logsContainer = document.getElementById('warehouseLiveLogs');
    if (!logsContainer) return;

    if (warehouseNotificationsList.length === 0) {
        logsContainer.innerHTML = '<div class="text-center py-8 text-slate-500 font-medium text-xs">No live notifications received yet.</div>';
        return;
    }

    logsContainer.innerHTML = warehouseNotificationsList.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        if (log.type === 'picklist') {
            return `
                <div id="log-card-${log.id}" class="p-3.5 bg-indigo-500/5 border border-indigo-500/20 rounded-xl space-y-1 transform transition-all duration-150 hover:scale-[1.01] hover:border-indigo-500/40 animate-fade-in text-left">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">Pick List Assigned</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] text-slate-550 font-semibold">${time}</span>
                            <button onclick="dismissNotification('${log.id}')" class="text-slate-500 hover:text-slate-300 text-xs font-bold focus:outline-none cursor-pointer">✕</button>
                        </div>
                    </div>
                    <p class="text-xs font-semibold text-slate-300 leading-relaxed">
                        Assigned Pick List <b class="text-white">#PL-${1000 + log.picklistId}</b> containing <b class="text-white">${log.ordersCount} orders</b> to this warehouse.
                    </p>
                </div>
            `;
        } else if (log.type === 'locationTransfer') {
            return `
                <div id="log-card-${log.id}" class="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-1 transform transition-all duration-150 hover:scale-[1.01] hover:border-amber-500/40 animate-fade-in text-left">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-amber-405 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">Location Transfer</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] text-slate-555 font-semibold">${time}</span>
                            <button onclick="dismissNotification('${log.id}')" class="text-slate-500 hover:text-slate-300 text-xs font-bold focus:outline-none cursor-pointer">✕</button>
                        </div>
                    </div>
                    <p class="text-xs font-semibold text-slate-300 leading-relaxed">
                        ${log.msgText}
                    </p>
                </div>
            `;
        } else {
            return `
                <div id="log-card-${log.id}" class="p-3.5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-1 transform transition-all duration-150 hover:scale-[1.01] hover:border-emerald-500/40 animate-fade-in text-left">
                    <div class="flex items-center justify-between">
                        <span class="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">Stock Replenished</span>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] text-slate-555 font-semibold">${time}</span>
                            <button onclick="dismissNotification('${log.id}')" class="text-slate-500 hover:text-slate-300 text-xs font-bold focus:outline-none cursor-pointer">✕</button>
                        </div>
                    </div>
                    <p class="text-xs font-semibold text-slate-300 leading-relaxed">
                        Added <b class="text-white">${log.replenishedQuantity} units</b> of <b class="text-white">${log.productName}</b> to location <b class="text-white">${log.locationName || 'Slot'}</b>.
                    </p>
                </div>
            `;
        }
    }).join('');
}

function dismissNotification(id) {
    warehouseNotificationsList = warehouseNotificationsList.filter(log => log.id !== id);
    renderWarehouseLiveLogs();
}

// Open/Close Actions for Stock Registration
async function openAddStockModal() {
    const prodSelect = document.getElementById('stockProduct');
    const slotSelect = document.getElementById('stockSlot');
    if (!prodSelect || !slotSelect) return;

    prodSelect.innerHTML = '<option value="">Loading products...</option>';
    slotSelect.innerHTML = '<option value="">Loading slots...</option>';
    document.getElementById('addStockModal').classList.remove('hidden');

    try {
        const token = AuthUtils.getToken();
        const [products, locations] = await Promise.all([
            ProductsAPI.getAll(),
            AdminAPI.getWarehouseLocations(warehouseId, token)
        ]);

        prodSelect.innerHTML = '<option value="">Select product item...</option>' +
            products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

        slotSelect.innerHTML = '<option value="">Select slot...</option>' +
            locations.map(l => {
                const avail = l.maxCapacity - l.quantity;
                return `<option value="${l.id}">${l.location} (Avail: ${avail}/${l.maxCapacity})</option>`;
            }).join('');
    } catch (err) {
        prodSelect.innerHTML = `<option value="">Error loading products: ${err.message}</option>`;
        slotSelect.innerHTML = `<option value="">Error loading slots: ${err.message}</option>`;
        console.error(err);
    }
}

function closeAddStockModal() {
    document.getElementById('addStockModal').classList.add('hidden');
    document.getElementById('addStockForm').reset();
}

async function submitAddStockForm(event) {
    event.preventDefault();

    const productId = parseInt(document.getElementById('stockProduct').value);
    const locationId = document.getElementById('stockSlot').value;
    const qty = parseInt(document.getElementById('stockQty').value);
    const price = parseFloat(document.getElementById('stockPrice').value);

    if (!productId || !locationId || isNaN(qty) || isNaN(price)) {
        alert("Please select product, location slot and enter valid quantity/price!");
        return;
    }

    try {
        const token = AuthUtils.getToken();
        
        // 1. Get all invoices to find a target invoice to link with this inventory record
        const invoices = await AdminAPI.getInvoices(token);
        if (invoices.length === 0) {
            alert("❌ No purchase invoice found. Please create a purchase invoice first under Management -> Invoices.");
            return;
        }

        // Use the latest invoice
        const targetInvoiceId = invoices[0].id;

        const dto = {
            productId: productId,
            warehouseId: warehouseId,
            warehouseLocationId: String(locationId),
            stockQuantity: qty,
            buyingPrice: price
        };

        // 2. Call the server REST API to save stock item
        await AdminAPI.addInvoiceInventory(targetInvoiceId, dto, token);

        alert("🎉 Stock registered successfully inside the database!");
        closeAddStockModal();

        // 3. Reload everything
        await Promise.all([
            loadWarehouseLocationsCapacity(warehouseId),
            loadWarehouseInventory(warehouseId)
        ]);
    } catch (err) {
        alert("❌ Failed to register stock: " + err.message);
    }
}

function filterPicklists(query) {
    const q = query.toLowerCase().trim();
    const filtered = currentPicklists.filter(pl => 
        String(pl.id).includes(q) ||
        (pl.userName && pl.userName.toLowerCase().includes(q)) ||
        (pl.createdAt && Helpers.formatDate(pl.createdAt).toLowerCase().includes(q))
    );
    renderPicklistsTable(filtered);
}

// Bind live WebSocket stockUpdate events
window.addEventListener('stockUpdate', async (e) => {
    const data = e.detail;
    console.log("Single Warehouse View received live stock event:", data);

    if (data.warehouseName && data.warehouseName === warehouseName) {
        warehouseNotificationsList.unshift({
            id: 'stock-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type: 'stock',
            productName: data.productName,
            replenishedQuantity: data.replenishedQuantity,
            locationName: data.locationName,
            timestamp: data.timestamp || Date.now()
        });

        if (warehouseNotificationsList.length > 50) {
            warehouseNotificationsList.pop();
        }

        renderWarehouseLiveLogs();

        await Promise.all([
            loadWarehouseLocationsCapacity(warehouseId),
            loadWarehouseInventory(warehouseId)
        ]);
    }
});

// Bind live WebSocket picklist events
window.addEventListener('newPicklist', async (e) => {
    const data = e.detail;
    console.log("Single Warehouse View received live picklist event:", data);

    if (parseInt(data.warehouseId) === warehouseId) {
        warehouseNotificationsList.unshift({
            id: 'picklist-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type: 'picklist',
            picklistId: data.picklistId,
            ordersCount: data.ordersCount,
            timestamp: Date.now()
        });

        if (warehouseNotificationsList.length > 50) {
            warehouseNotificationsList.pop();
        }

        renderWarehouseLiveLogs();
        await loadWarehousePicklists(warehouseId);
    }
});

// Bind live WebSocket locationTransfer events
window.addEventListener('locationTransfer', async (e) => {
    const data = e.detail;
    console.log("Single Warehouse View received live locationTransfer event:", data);

    const isSource = parseInt(data.sourceWarehouseId) === warehouseId;
    const isDest = parseInt(data.destWarehouseId) === warehouseId;

    if (isSource || isDest) {
        let msg = "";
        if (isSource && isDest) {
            msg = `Moved <b>${data.qty} units</b> of <b>${data.productName}</b> from slot <b>${data.oldLoc}</b> to <b>${data.newLoc}</b>.`;
        } else if (isSource) {
            msg = `Transferred <b>${data.qty} units</b> of <b>${data.productName}</b> from slot <b>${data.oldLoc}</b> to warehouse <b>${data.destWarehouseName}</b> (slot <b>${data.newLoc}</b>).`;
        } else {
            msg = `Received <b>${data.qty} units</b> of <b>${data.productName}</b> from warehouse <b>${data.sourceWarehouseName}</b> (slot <b>${data.oldLoc}</b>) into slot <b>${data.newLoc}</b>.`;
        }

        warehouseNotificationsList.unshift({
            id: 'transfer-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            type: 'locationTransfer',
            productName: data.productName,
            oldLoc: data.oldLoc,
            newLoc: data.newLoc,
            qty: data.qty,
            msgText: msg,
            timestamp: Date.now()
        });

        if (warehouseNotificationsList.length > 50) {
            warehouseNotificationsList.pop();
        }

        renderWarehouseLiveLogs();

        await Promise.all([
            loadWarehouseLocationsCapacity(warehouseId),
            loadWarehouseInventory(warehouseId)
        ]);
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

    loadWarehouseDetails();
});
