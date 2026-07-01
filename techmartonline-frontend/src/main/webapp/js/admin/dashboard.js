let currentOrders = [];

document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    
    // Set admin details
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

    loadRecentOrders();

    // Live update when a new order arrives via WebSocket
    window.addEventListener('newOrder', () => {
        console.log("🔄 Live Order received: Refreshing Recent Orders dashboard...");
        loadRecentOrders();
    });
});

async function loadRecentOrders() {
    const tbody = document.getElementById('recentOrders');
    if (!tbody) return;

    try {
        const token = AuthUtils.getToken();
        const res = await fetch(`${API_CONFIG.BASE_URL}/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load recent orders");
        const json = await res.json();
        
        currentOrders = json.data || [];
        // Take the 5 most recent orders
        const recent = currentOrders.slice(0, 5);

        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-6 text-slate-400 font-semibold">No orders received yet.</td></tr>';
            return;
        }

        tbody.innerHTML = recent.map(order => {
            let statusClass = 'bg-slate-800/60 text-slate-400 border border-slate-700/40';
            const status = order.status.toLowerCase();
            if (status === 'delivered') statusClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            else if (status === 'processing') statusClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';
            else if (status === 'shipped' || status === 'dispatched') statusClass = 'bg-violet-500/10 text-violet-400 border border-violet-500/20';
            else if (status === 'cancelled') statusClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
            else if (status === 'placed') statusClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';

            return `
                <tr class="hover:bg-slate-800/20 transition-all border-b border-slate-800/40 last:border-b-0">
                    <td class="py-3.5 px-2 font-semibold text-white">#ORD-${order.id}</td>
                    <td class="py-3.5 px-2 text-slate-350">${order.customerName || 'Guest'}</td>
                    <td class="py-3.5 px-2 font-bold text-white">${Helpers.formatPrice(order.totalAmount)}</td>
                    <td class="py-3.5 px-2">
                        <span class="inline-flex px-2 py-0.5 text-[11px] font-bold rounded-md ${statusClass}">
                            ${order.status}
                        </span>
                    </td>
                    <td class="py-3.5 px-2 text-right">
                        <button onclick="showOrderDetails(${order.id})" class="text-[11px] font-bold text-indigo-400 hover:bg-indigo-400 hover:text-slate-950 border border-indigo-400/20 px-2.5 py-1 rounded-lg transition-all cursor-pointer">View</button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-6 text-rose-500 font-semibold">Error: ${err.message}</td></tr>`;
    }
}

async function showOrderDetails(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const modal = document.getElementById('orderDetailsModal');
    if (!modal) return;

    modal.classList.remove('hidden');
    
    // Fill text details
    document.getElementById('modalOrderId').textContent = `Order Details: #ORD-${order.id}`;
    document.getElementById('modalOrderDate').textContent = `Placed on: ${Helpers.formatDate(order.createdAt)}`;
    document.getElementById('modalCustomerName').textContent = order.customerName || 'Guest';
    document.getElementById('modalPaymentMethod').textContent = order.paymentMethod || 'N/A';
    document.getElementById('modalTotalAmount').textContent = Helpers.formatPrice(order.totalAmount);
    
    const statusBadge = document.getElementById('modalStatus');
    statusBadge.textContent = order.status;
    let statusClass = 'bg-slate-800/60 text-slate-400 border border-slate-700/40';
    const status = order.status.toLowerCase();
    if (status === 'delivered') statusClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    else if (status === 'processing') statusClass = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    else if (status === 'shipped' || status === 'dispatched') statusClass = 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    else if (status === 'cancelled') statusClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    else if (status === 'placed') statusClass = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    statusBadge.className = `inline-flex px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${statusClass}`;

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
            <div class="p-4 flex items-center justify-between text-xs font-semibold border-b border-slate-800/40 last:border-b-0">
                <div class="flex items-center gap-3">
                   <div class="w-8 h-8 bg-slate-800/60 rounded-lg flex items-center justify-center">📦</div> 
                   <div>
                       <p class="text-white font-semibold text-xs">${item.productName}</p>
                       <p class="text-[10px] text-slate-500">Qty: ${item.quantity}</p>
                   </div>
                </div>
                <div class="text-white font-bold text-xs">${Helpers.formatPrice(item.sellingPrice)}</div>
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
