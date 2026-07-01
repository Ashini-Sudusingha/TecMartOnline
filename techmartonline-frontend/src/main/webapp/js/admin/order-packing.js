let currentPackingItems = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    loadWarehousesForPacking();
});

async function loadWarehousesForPacking() {
    const select = document.getElementById('packingWarehouseSelect');
    if (!select) return;

    try {
        const token = AuthUtils.getToken();
        const warehouses = await AdminAPI.getWarehouses(token);
        
        select.innerHTML = '<option value="">-- Choose Warehouse Depot --</option>' +
            warehouses.map(w => `<option value="${w.id}">${w.name} (${w.city || 'Depot'})</option>`).join('');
    } catch (err) {
        select.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

async function onWarehouseChanged() {
    const whId = document.getElementById('packingWarehouseSelect').value;
    const plSelect = document.getElementById('packingPicklistSelect');
    const workspace = document.getElementById('packingWorkspace');

    if (!whId) {
        plSelect.innerHTML = '<option value="">-- Select Pick List --</option>';
        plSelect.disabled = true;
        workspace.innerHTML = '<div class="glass-card rounded-2xl p-12 text-center text-slate-400 font-medium text-xs">Select a Warehouse and Pick List to load items.</div>';
        return;
    }

    plSelect.innerHTML = '<option value="">Loading pick lists...</option>';
    plSelect.disabled = true;

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/orders/warehouses/${whId}/pick-lists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load pick lists");
        const json = await res.json();
        const pickLists = json.data || [];

        if (pickLists.length === 0) {
            plSelect.innerHTML = '<option value="">No pick lists assigned.</option>';
            return;
        }

        plSelect.innerHTML = '<option value="">-- Select Pick List --</option>' +
            pickLists.map(pl => `<option value="${pl.id}">#PL-${1000 + pl.id} (Created: ${Helpers.formatDate(pl.createdAt)})</option>`).join('');
        plSelect.disabled = false;
    } catch (err) {
        plSelect.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

async function onPicklistChanged() {
    const plId = document.getElementById('packingPicklistSelect').value;
    const workspace = document.getElementById('packingWorkspace');

    if (!plId) {
        workspace.innerHTML = '<div class="glass-card rounded-2xl p-12 text-center text-slate-400 font-medium text-xs">Select a Warehouse and Pick List to load items.</div>';
        return;
    }

    loadPackingDetails(plId);
}

async function loadPackingDetails(plId) {
    const workspace = document.getElementById('packingWorkspace');
    workspace.innerHTML = '<div class="glass-card rounded-2xl p-12 text-center text-slate-400 font-medium text-xs">Loading packing items...</div>';

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/orders/pick-lists/${plId}/packing-details`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load packing details");
        const json = await res.json();
        currentPackingItems = json.data || [];

        renderPackingWorkspace();
    } catch (err) {
        workspace.innerHTML = `<div class="glass-card rounded-2xl border border-rose-500/20 p-12 text-center text-rose-400 font-semibold text-xs bg-rose-500/5">Error: ${err.message}</div>`;
    }
}

function renderPackingWorkspace() {
    const workspace = document.getElementById('packingWorkspace');
    if (!workspace) return;

    if (currentPackingItems.length === 0) {
        workspace.innerHTML = '<div class="glass-card rounded-2xl p-12 text-center text-slate-400 font-medium text-xs">No items found in this pick list.</div>';
        return;
    }

    // Group items by Order ID
    const grouped = {};
    currentPackingItems.forEach(item => {
        if (!grouped[item.orderId]) {
            grouped[item.orderId] = [];
        }
        grouped[item.orderId].push(item);
    });

    let allOrdersPacked = true;
    let html = '';

    for (const orderId in grouped) {
        const items = grouped[orderId];
        let itemsHtml = '';
        let orderPacked = true;

        items.forEach(item => {
            if (!item.packed) {
                orderPacked = false;
                allOrdersPacked = false;
            }

            let slotSelector = '';
            let actionBtn = '';

            if (item.packed) {
                slotSelector = `<span class="text-xs text-emerald-450 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">Packed successfully</span>`;
                actionBtn = `<span class="inline-flex px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ Packed</span>`;
            } else {
                if (item.inventorySlots && item.inventorySlots.length > 0) {
                    const options = item.inventorySlots.map(slot => 
                        `<option value="${slot.inventoryId}">${slot.locationName} (Stock: ${slot.availableQty} units)</option>`
                    ).join('');
                    
                    slotSelector = `
                        <div class="flex flex-col gap-1 w-full max-w-xs text-left">
                            <label class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Select Shelf/Rack Slot</label>
                            <select id="slotSelect-${item.orderItemId}" class="px-3 py-2 rounded-xl border border-slate-800 text-xs font-bold bg-[#0d121f] text-slate-300 focus:outline-none focus:border-amber-400">
                                ${options}
                            </select>
                        </div>
                    `;

                    actionBtn = `
                        <button onclick="packOrderItem(${item.orderItemId}, ${item.orderId}, ${item.orderedQty})" class="px-4 py-2 bg-slate-800/60 hover:bg-amber-400 hover:text-slate-950 text-amber-400 border border-slate-700/50 rounded-xl font-bold text-xs transition-colors cursor-pointer">
                            Pack Item
                        </button>
                    `;
                } else {
                    slotSelector = `<span class="text-xs text-rose-450 font-bold bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">⚠️ Out of Stock (No slots available)</span>`;
                    actionBtn = `<button class="px-4 py-2 bg-slate-800 text-slate-500 border border-slate-800 rounded-xl font-bold text-xs cursor-not-allowed" disabled>Pack Item</button>`;
                }
            }

            itemsHtml += `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-800/60 gap-4">
                    <div class="space-y-1 text-left">
                        <span class="font-bold text-white text-xs block">${item.productName}</span>
                        <span class="text-[10px] text-slate-400 font-semibold block">Qty Needed: <b class="text-amber-405">${item.orderedQty} units</b></span>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-4 text-right">
                        ${slotSelector}
                        <div>
                            ${actionBtn}
                        </div>
                    </div>
                </div>
            `;
        });

        html += `
            <div class="glass-card rounded-2xl p-6 space-y-4">
                <div class="flex items-center justify-between border-b border-slate-800/60 pb-3">
                    <div class="text-left">
                        <h4 class="font-bold text-white text-sm">#ORD-${10000 + parseInt(orderId)}</h4>
                        <p class="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Order packing list</p>
                    </div>
                    <span class="inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-lg border ${orderPacked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}">
                        ${orderPacked ? 'Packed' : 'Fulfillment In Progress'}
                    </span>
                </div>
                <div class="space-y-3">
                    ${itemsHtml}
                </div>
            </div>
        `;
    }

    if (allOrdersPacked) {
        html = `
            <div class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl p-6 text-center space-y-2">
                <h3 class="font-bold text-emerald-300 text-sm">🎉 Pick List Fully Packed & Dispatched!</h3>
                <p class="text-xs text-emerald-450 font-semibold">All orders in this pick list have been successfully processed and stock levels updated.</p>
            </div>
            ${html}
        `;
    }

    workspace.innerHTML = html;
}

async function packOrderItem(orderItemId, orderId, orderedQty) {
    const select = document.getElementById(`slotSelect-${orderItemId}`);
    if (!select) return;

    const inventoryId = select.value;
    if (!inventoryId) {
        alert("Please select a valid inventory slot shelf first!");
        return;
    }

    const plId = document.getElementById('packingPicklistSelect').value;

    try {
        const token = AuthUtils.getToken();
        const payload = {
            picklistId: parseInt(plId),
            orderId: orderId,
            orderItemId: orderItemId,
            inventoryId: parseInt(inventoryId),
            pickQty: orderedQty
        };

        const res = await fetch(`${API_CONFIG.BASE_URL}/orders/pack-item`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to pack item");

        alert("🎉 Item packed successfully! Stock levels updated.");
        loadPackingDetails(plId);
    } catch (err) {
        alert(`❌ Error packing item: ${err.message}`);
    }
}
