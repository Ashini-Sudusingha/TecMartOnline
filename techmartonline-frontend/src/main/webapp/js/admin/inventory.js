document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;

    // Connect to WebSocket updates
    InventoryWebSocketClient.connect((message) => {
        // Callback when stock is updated via JMS Topic -> WebSocket!
        alert(`🔔 REAL-TIME NOTIFICATION: Stock updated for Product #${message.productId}. Qty: ${message.replenishedQuantity} in ${message.warehouseName}`);
        
        // Append update log or modify local table stock value
        const log = document.getElementById('wsReplenishLog');
        if (log) {
            const time = new Date(message.timestamp).toLocaleTimeString();
            log.innerHTML = `<div class="p-3 bg-amber-500/10 text-amber-400 rounded-xl text-xs font-bold border border-amber-500/20 mb-2 text-left animate-fade-in">
                [${time}] Replenished Product #${message.productId} with ${message.replenishedQuantity} units inside ${message.warehouseName}
            </div>` + log.innerHTML;
        }
    });

    const form = document.getElementById('replenishForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = parseInt(document.getElementById('repProductId').value);
            const quantity = parseInt(document.getElementById('repQuantity').value);
            const warehouseName = document.getElementById('repWarehouse').value;
            const btn = document.getElementById('replenishBtn');
            const token = AuthUtils.getToken();

            btn.disabled = true;
            btn.textContent = 'Updating...';

            try {
                await InventoryAPI.replenish({ productId, quantity, warehouseName }, token);
                alert('✅ Replenishment successfully processed!');
                form.reset();
            } catch (err) {
                alert(`❌ Error: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Replenish Stock';
            }
        });
    }
});
