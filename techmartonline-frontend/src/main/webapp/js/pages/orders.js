async function loadOrders() {
    if (!AuthUtils.checkAuth()) return;

    const token = AuthUtils.getToken();
    const user = AuthUtils.getUser();
    const list = document.getElementById('ordersList');
    const emptyMsg = document.getElementById('emptyOrdersMessage');
    const loading = document.getElementById('loadingMessage');

    if (!list) return;

    try {
        const orders = await OrdersAPI.getByUserId(user.id, token);
        if (loading) loading.classList.add('hidden');

        if (orders.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove('hidden');
            list.innerHTML = '';
            return;
        }

        if (emptyMsg) emptyMsg.classList.add('hidden');

        list.innerHTML = orders.map(order => {
            const dateStr = Helpers.formatDate(order.createdAt);

            // Status Badge Color
            let statusClass = 'bg-slate-100 text-slate-700 border border-slate-200';
            if (order.status.toLowerCase() === 'delivered') {
                statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            } else if (order.status.toLowerCase() === 'processing') {
                statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
            } else if (order.status.toLowerCase() === 'cancelled') {
                statusClass = 'bg-rose-50 text-rose-700 border border-rose-200';
            }

            // Payment Status Color
            let payClass = 'bg-slate-100 text-slate-700 border border-slate-200';
            if (order.paymentStatus.toLowerCase() === 'paid') {
                payClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            } else if (order.paymentStatus.toLowerCase() === 'pending') {
                payClass = 'bg-amber-50 text-amber-700 border border-amber-200';
            }

            return `
                <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 hover:border-slate-200 transition-all">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Order ID</span>
                            <span class="font-bold text-slate-900">#${order.id}</span>
                        </div>
                        <div>
                            <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider">Date</span>
                            <span class="font-semibold text-slate-700 text-sm">${dateStr}</span>
                        </div>
                        <div class="flex gap-2">
                            <div>
                                <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-1">Status</span>
                                <span class="inline-flex px-2.5 py-0.5 text-xs font-black rounded-lg ${statusClass}">${order.status}</span>
                            </div>
                            <div>
                                <span class="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-1">Payment</span>
                                <span class="inline-flex px-2.5 py-0.5 text-xs font-black rounded-lg ${payClass}">${order.paymentStatus}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-sm">
                        <div class="text-slate-500 font-semibold">
                            <span>Payment Method: </span>
                            <span class="text-slate-900 font-bold">${order.paymentMethod}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-slate-400 font-semibold block">Total Paid</span>
                            <span class="font-black text-slate-900 text-lg">${Helpers.formatPrice(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        if (loading) loading.classList.add('hidden');
        list.innerHTML = `
            <div class="text-center py-12 bg-rose-50 text-rose-700 rounded-3xl border border-rose-100">
                <span class="font-bold">❌ Error loading orders. Please try again.</span>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});
