function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const list = document.getElementById('cartItemsList');
    const emptyMsg = document.getElementById('emptyCartMessage');
    const countBadge = document.getElementById('cartCountBadge');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!list) return;

    const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (countBadge) countBadge.textContent = `${totalItemsCount} Items`;

    if (cart.length === 0) {
        list.innerHTML = '';
        emptyMsg.classList.remove('hidden');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        }
        updateSummary(0);
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hidden');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    let subtotal = 0;

    list.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const isUrl = item.image && (item.image.startsWith('http://') || item.image.startsWith('https://') || item.image.startsWith('data:image/'));
        const imageElement = isUrl 
            ? `<img src="${item.image}" class="w-full h-full object-cover rounded-2xl" />`
            : item.image || '📦';

        return `
            <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 transition-all hover:border-slate-200">
                <div class="flex items-center gap-4">
                    <span class="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl border border-slate-100 flex-shrink-0 overflow-hidden">${imageElement}</span>
                    <div>
                        <h3 class="font-bold text-slate-900 leading-tight">${item.name}</h3>
                        <span class="text-sm font-black text-amber-500 block mt-1">${Helpers.formatPrice(item.price)}</span>
                    </div>
                </div>

                <div class="flex items-center gap-6">
                    <div class="flex items-center border border-slate-100 bg-slate-50/50 rounded-xl p-1">
                        <button onclick="changeQty(${item.id}, -1)" class="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">-</button>
                        <span class="w-8 text-center font-black text-sm text-slate-800">${item.quantity}</span>
                        <button onclick="changeQty(${item.id}, 1)" class="w-8 h-8 flex items-center justify-center font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">+</button>
                    </div>

                    <div class="flex items-center gap-4 text-right">
                        <div class="w-24">
                            <span class="text-xs text-slate-400 font-semibold block">Total</span>
                            <span class="font-black text-slate-900">${Helpers.formatPrice(itemTotal)}</span>
                        </div>
                        <button onclick="removeItem(${item.id})" class="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    updateSummary(subtotal);
}

function changeQty(id, diff) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const item = cart.find(x => x.id === id);
    if (item) {
        item.quantity += diff;
        if (item.quantity <= 0) {
            cart = cart.filter(x => x.id !== id);
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        loadCart();
    }
}

function removeItem(id) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(x => x.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
}

function updateSummary(subtotal) {
    const shipping = subtotal > 0 ? 10.00 : 0;
    const total = subtotal + shipping;

    const sub = document.getElementById('summarySubtotal');
    const ship = document.getElementById('summaryShipping');
    const tot = document.getElementById('summaryTotal');

    if (sub) sub.textContent = Helpers.formatPrice(subtotal);
    if (ship) ship.textContent = Helpers.formatPrice(shipping);
    if (tot) tot.textContent = Helpers.formatPrice(total);
}

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});
