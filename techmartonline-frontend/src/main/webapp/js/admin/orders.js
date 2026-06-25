document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    loadAdminOrders();
});

function loadAdminOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    // Simulated admin orders list
    const mockOrders = [
        { id: 10001, date: new Date(), customer: 'Amal Perera', total: 249.99, status: 'Processing', payment: 'Paid' },
        { id: 10002, date: new Date(), customer: 'Nimal Silva', total: 89.99, status: 'Delivered', payment: 'Paid' },
        { id: 10003, date: new Date(), customer: 'Sunil Fernado', total: 1299.99, status: 'Cancelled', payment: 'Refunded' }
    ];

    tbody.innerHTML = mockOrders.map(order => {
        let statusClass = 'bg-slate-50 text-slate-400 border border-slate-200';
        if (order.status === 'Delivered') statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        if (order.status === 'Processing') statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
        if (order.status === 'Cancelled') statusClass = 'bg-rose-50 text-rose-700 border border-rose-200';

        return `
            <tr class="hover:bg-slate-50/50 transition-all">
                <td class="py-4 px-6 font-bold text-slate-400">#${order.id}</td>
                <td class="py-4 px-6 font-bold text-slate-900">${order.customer}</td>
                <td class="py-4 px-6 text-slate-500 font-semibold">${Helpers.formatDate(order.date)}</td>
                <td class="py-4 px-6 font-black text-slate-900">${Helpers.formatPrice(order.total)}</td>
                <td class="py-4 px-6">
                    <span class="inline-flex px-2.5 py-0.5 text-xs font-bold rounded-lg ${statusClass}">
                        ${order.status}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}
