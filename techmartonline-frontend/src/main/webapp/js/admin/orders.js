let currentOrders = [];
let currentPicklists = [];
let selectedOrderIds = new Set();
let activeTab = 'new'; // 'new' | 'processing' | 'picklists' | 'all'

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    loadAdminOrders();

    // Live update when a new order arrives via WebSocket
    window.addEventListener('newOrder', () => {
        console.log("🔄 Live Order received: Refreshing Admin Orders...");
        loadAdminOrders();
    });

    window.addEventListener('newPicklist', () => {
        console.log("🔄 Live Pick List assigned: Refreshing lists...");
        loadAdminOrders();
    });
});

async function loadAdminOrders() {
    try {
        const token = AuthUtils.getToken();
        
        // Fetch all orders
        const ordersRes = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!ordersRes.ok) throw new Error("Failed to load orders");
        const ordersJson = await ordersRes.json();
        currentOrders = ordersJson.data || [];

        // Fetch all pick lists
        const picklistsRes = await fetch(`${API_CONFIG.BASE_URL}/orders/pick-lists`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!picklistsRes.ok) throw new Error("Failed to load pick lists");
        const picklistsJson = await picklistsRes.json();
        currentPicklists = picklistsJson.data || [];

        // Render tab badges
        const newCount = currentOrders.filter(o => !o.assignedToPicklist).length;
        const processingCount = currentOrders.filter(o => o.assignedToPicklist).length;
        
        document.getElementById('badge-new').textContent = newCount;
        document.getElementById('badge-processing').textContent = processingCount;
        document.getElementById('badge-picklists').textContent = currentPicklists.length;
        document.getElementById('badge-all').textContent = currentOrders.length;

        // Render current active tab content
        renderActiveTab();
    } catch (err) {
        console.error("Error loading admin orders/picklists:", err);
        const tbody = document.getElementById('ordersTableBody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-rose-500 font-semibold">Error: ${err.message}</td></tr>`;
        }
    }
}

function switchTab(tabName) {
    activeTab = tabName;

    // Update tab styles
    const tabs = ['new', 'processing', 'picklists', 'all'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.className = "border-b-2 border-amber-400 text-amber-400 px-1 pb-4 text-xs font-bold tracking-wider uppercase flex items-center gap-2.5 cursor-pointer focus:outline-none transition-all";
            } else {
                btn.className = "border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 px-1 pb-4 text-xs font-bold tracking-wider uppercase flex items-center gap-2.5 cursor-pointer focus:outline-none transition-all";
            }
        }
    });

    renderActiveTab();
}

function renderActiveTab() {
    const ordersCard = document.getElementById('ordersTableCard');
    const picklistsCard = document.getElementById('picklistsTableCard');
    const checkboxHeader = document.getElementById('checkboxHeader');
    const selectAllCheckbox = document.getElementById('selectAllOrders');
    
    // Reset SelectAll checkbox
    if (selectAllCheckbox) selectAllCheckbox.checked = false;

    if (activeTab === 'picklists') {
        if (ordersCard) ordersCard.classList.add('hidden');
        if (picklistsCard) picklistsCard.classList.remove('hidden');
        renderPickListsTable();
    } else {
        if (ordersCard) ordersCard.classList.remove('hidden');
        if (picklistsCard) picklistsCard.classList.add('hidden');
        
        let filteredOrders = [];
        if (activeTab === 'new') {
            filteredOrders = currentOrders.filter(o => !o.assignedToPicklist);
            if (checkboxHeader) checkboxHeader.classList.remove('hidden');
        } else if (activeTab === 'processing') {
            filteredOrders = currentOrders.filter(o => o.assignedToPicklist);
            if (checkboxHeader) checkboxHeader.classList.add('hidden');
        } else {
            filteredOrders = currentOrders;
            if (checkboxHeader) checkboxHeader.classList.add('hidden');
        }

        renderOrdersTable(filteredOrders);
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-slate-400 font-semibold bg-slate-900/20">No orders found in this view.</td></tr>`;
        return;
    }

    tbody.innerHTML = orders.map(order => {
        let statusClass = 'bg-slate-800/60 text-slate-400 border border-slate-700/40';
        const status = order.status.toLowerCase();
        if (status === 'delivered') statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
        else if (status === 'processing') statusClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
        else if (status === 'shipped' || status === 'dispatched') statusClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
        else if (status === 'cancelled') statusClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
        else if (status === 'placed') statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

        const checkboxCell = activeTab === 'new' ? `
            <td class="py-4 px-6 w-12 text-center">
                <input type="checkbox" data-id="${order.id}" onchange="handleOrderCheckboxChange(this)" class="order-checkbox rounded bg-slate-900 border-slate-700 text-amber-400 focus:ring-amber-400 focus:ring-offset-[#0b0f19] cursor-pointer" ${selectedOrderIds.has(order.id) ? 'checked' : ''}>
            </td>
        ` : `<td class="hidden"></td>`;

        return `
            <tr class="hover:bg-slate-900/10 transition-colors border-b border-slate-800/40 last:border-b-0">
                ${checkboxCell}
                <td class="py-4 px-6 font-bold text-slate-500">#ORD-${10000 + order.id}</td>
                <td class="py-4 px-6 font-bold text-white">${order.customerName || 'Guest'}</td>
                <td class="py-4 px-6 text-slate-400 font-semibold">${Helpers.formatDate(order.createdAt)}</td>
                <td class="py-4 px-6 font-black text-white">${Helpers.formatPrice(order.totalAmount)}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-lg tracking-wider ${statusClass}">
                        ${order.status}
                    </span>
                </td>
                <td class="py-4 px-6 text-right">
                    <button onclick="showOrderDetails(${order.id})" class="text-[10px] font-bold text-amber-400 bg-amber-400/5 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer">Inspect payload</button>
                </td>
            </tr>
        `;
    }).join('');

    updatePickListButtonState();
}

function renderPickListsTable() {
    const tbody = document.getElementById('picklistsTableBody');
    if (!tbody) return;

    if (currentPicklists.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 font-semibold bg-slate-900/20">No pick lists assigned yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = currentPicklists.map(pl => {
        return `
            <tr class="hover:bg-slate-900/10 transition-colors border-b border-slate-800/40 last:border-b-0">
                <td class="py-4 px-6 font-bold text-white">#PL-${1000 + pl.id}</td>
                <td class="py-4 px-6 font-semibold text-slate-300">${pl.userName || 'Admin'}</td>
                <td class="py-4 px-6 font-bold text-amber-400">${pl.warehouseName || 'Warehouse'}</td>
                <td class="py-4 px-6 text-slate-400 font-semibold">${Helpers.formatDate(pl.createdAt)}</td>
                <td class="py-4 px-6 font-black text-white">${pl.orders ? pl.orders.length : 0} Orders</td>
                <td class="py-4 px-6 text-right">
                    <button onclick="viewPicklistDetails(${pl.id})" class="text-[10px] font-bold text-amber-400 bg-amber-400/5 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/20 px-3 py-1.5 rounded-lg transition-all cursor-pointer">Inspect Manifest</button>
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
    body.innerHTML = '<div class="text-center py-8 text-slate-400 text-xs font-semibold">Loading orders and items...</div>';

    try {
        const token = AuthUtils.getToken();
        
        let html = '';
        for (const order of (pl.orders || [])) {
            const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${order.id}/items`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to load order items");
            const json = await res.json();
            const items = json.data || [];

            let itemsHtml = items.map(item => `
                <div class="flex justify-between items-center py-2 px-3 text-xs bg-slate-900/40 rounded-xl border border-slate-800/60 font-semibold text-slate-300">
                    <div>
                        <span class="text-white font-bold block">${item.productName}</span>
                        <span class="text-slate-500 text-[10px] block mt-0.5">Product ID: #${item.productId}</span>
                    </div>
                    <div class="text-right">
                        <span class="text-amber-405 font-black block">${item.quantity} units</span>
                        <span class="text-slate-500 text-[10px] block">Price: ${Helpers.formatPrice(item.sellingPrice)}</span>
                    </div>
                </div>
            `).join('');

            if (items.length === 0) {
                itemsHtml = '<div class="text-center py-3 text-slate-500 text-xs font-semibold">No items found in this order.</div>';
            }

            let statusClass = 'bg-slate-800/60 text-slate-400 border border-slate-700/40';
            const status = order.status.toLowerCase();
            if (status === 'delivered') statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            else if (status === 'processing') statusClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            else if (status === 'shipped' || status === 'dispatched') statusClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            else if (status === 'cancelled') statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            else if (status === 'placed') statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';

            html += `
                <div class="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl space-y-3">
                    <div class="flex items-center justify-between border-b border-slate-800/60 pb-2">
                        <div>
                            <span class="font-black text-white text-xs block">#ORD-${10000 + order.id}</span>
                            <span class="text-[10px] text-slate-500 font-semibold mt-0.5">Customer: ${order.customerName || 'Guest'}</span>
                        </div>
                        <span class="inline-flex px-2 py-0.5 text-[10px] font-bold rounded-lg ${statusClass}">${order.status}</span>
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
        body.innerHTML = `<div class="text-center py-8 text-rose-500 text-xs font-semibold">Error: ${err.message}</div>`;
    }
}

function closePicklistItemsModal() {
    const modal = document.getElementById('pickListItemsModal');
    if (modal) modal.classList.add('hidden');
}

function toggleSelectAll(selectAllCheckbox) {
    const checkboxes = document.querySelectorAll('.order-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = selectAllCheckbox.checked;
        const id = parseInt(cb.dataset.id);
        if (selectAllCheckbox.checked) {
            selectedOrderIds.add(id);
        } else {
            selectedOrderIds.delete(id);
        }
    });
    updatePickListButtonState();
}

function handleOrderCheckboxChange(cb) {
    const id = parseInt(cb.dataset.id);
    if (cb.checked) {
        selectedOrderIds.add(id);
    } else {
        selectedOrderIds.delete(id);
    }
    
    const selectAll = document.getElementById('selectAllOrders');
    const checkboxes = document.querySelectorAll('.order-checkbox');
    if (selectAll) {
        selectAll.checked = checkboxes.length > 0 && Array.from(checkboxes).every(c => c.checked);
    }
    
    updatePickListButtonState();
}

function updatePickListButtonState() {
    const btn = document.getElementById('createPickListBtn');
    if (!btn) return;
    
    if (activeTab === 'new' && selectedOrderIds.size > 0) {
        btn.classList.remove('hidden');
    } else {
        btn.classList.add('hidden');
    }
}

async function openPickListModal() {
    const modal = document.getElementById('pickListModal');
    if (!modal) return;
    
    document.getElementById('selectedOrdersCount').textContent = selectedOrderIds.size;
    modal.classList.remove('hidden');
    
    const select = document.getElementById('warehouseSelect');
    select.innerHTML = '<option value="">Loading warehouses...</option>';
    
    try {
        const token = AuthUtils.getToken();
        const warehouses = await AdminAPI.getWarehouses(token);
        if (warehouses.length === 0) {
            select.innerHTML = '<option value="">No warehouses found.</option>';
            return;
        }
        
        select.innerHTML = '<option value="">-- Choose Warehouse Depot --</option>' + 
            warehouses.map(w => `<option value="${w.id}">${w.name} (${w.city || 'Depot'})</option>`).join('');
    } catch (err) {
        select.innerHTML = `<option value="">Error: ${err.message}</option>`;
    }
}

function closePickListModal() {
    const modal = document.getElementById('pickListModal');
    if (modal) modal.classList.add('hidden');
}

async function submitPickList() {
    const warehouseId = document.getElementById('warehouseSelect').value;
    if (!warehouseId) {
        alert("Please select a warehouse depot first!");
        return;
    }
    
    try {
        const token = AuthUtils.getToken();
        const user = AuthUtils.getUser();
        const userId = user ? user.id : 1;
        
        const payload = {
            userId: userId,
            warehouseId: parseInt(warehouseId),
            orderIds: Array.from(selectedOrderIds)
        };
        
        const res = await fetch(`${API_CONFIG.BASE_URL}/orders/pick-lists`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to assign pick list");
        
        alert("🎉 Pick list successfully created and assigned to warehouse!");
        closePickListModal();
        
        selectedOrderIds.clear();
        const selectAll = document.getElementById('selectAllOrders');
        if (selectAll) selectAll.checked = false;
        updatePickListButtonState();
        
        loadAdminOrders();
    } catch (err) {
        alert(`❌ Error creating pick list: ${err.message}`);
    }
}

async function showOrderDetails(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailsModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    
    // Fill text details
    document.getElementById('modalOrderId').textContent = `Order Details: #ORD-${10000 + order.id}`;
    document.getElementById('modalOrderDate').textContent = `Placed on: ${Helpers.formatDate(order.createdAt)}`;
    document.getElementById('modalCustomerName').textContent = order.customerName || 'Guest';
    document.getElementById('modalPaymentMethod').textContent = order.paymentMethod || 'N/A';
    document.getElementById('modalTotalAmount').textContent = Helpers.formatPrice(order.totalAmount);
    
    const statusBadge = document.getElementById('modalStatus');
    statusBadge.textContent = order.status;
    let statusClass = 'bg-slate-50 text-slate-400 border border-slate-200';
    const status = order.status.toLowerCase();
    if (status === 'delivered') statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    else if (status === 'processing') statusClass = 'bg-blue-50 text-blue-700 border-blue-200';
    else if (status === 'shipped' || status === 'dispatched') statusClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    else if (status === 'cancelled') statusClass = 'bg-rose-50 text-rose-700 border-rose-200';
    else if (status === 'placed') statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
    statusBadge.className = `inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border mt-0.5 ${statusClass}`;

    // Load items list
    const itemsList = document.getElementById('modalItemsList');
    itemsList.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs font-semibold">Loading purchased items...</div>';

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/orders/${orderId}/items`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load order items");
        const json = await res.json();
        
        const items = json.data || [];
        if (items.length === 0) {
            itemsList.innerHTML = '<div class="p-4 text-center text-slate-400 text-xs font-semibold">No items found in this order.</div>';
            return;
        }

        itemsList.innerHTML = items.map(item => `
            <div class="p-4 flex justify-between items-center text-xs font-semibold hover:bg-slate-900/20">
                <div>
                    <span class="text-white block font-bold">${item.productName}</span>
                    <span class="text-slate-550 text-[10px] block mt-0.5">Product ID: #${item.productId}</span>
                </div>
                <div class="text-right">
                    <span class="text-slate-400 block">${item.quantity} x ${Helpers.formatPrice(item.sellingPrice)}</span>
                    <span class="text-white font-black block mt-0.5">${Helpers.formatPrice(item.quantity * item.sellingPrice)}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        itemsList.innerHTML = `<div class="p-4 text-center text-rose-500 text-xs font-semibold">Error: ${err.message}</div>`;
    }
}

function closeDetailsModal() {
    const modal = document.getElementById('orderDetailsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
