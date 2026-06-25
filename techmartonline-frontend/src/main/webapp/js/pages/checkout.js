document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth()) return;

    const user = AuthUtils.getUser();
    if (user) {
        const fname = document.getElementById('fname');
        const lname = document.getElementById('lname');
        const phone = document.getElementById('phone');

        if (fname) fname.value = user.firstName || '';
        if (lname) lname.value = user.lastName || '';
        if (phone) phone.value = user.mobile || '';
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cart.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    let subtotal = 0;
    const list = document.getElementById('checkoutSummaryList');
    if (list) {
        list.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            return `
                <div class="flex justify-between items-center text-xs font-semibold">
                    <span class="text-slate-500">${item.name} <span class="font-bold text-slate-700">x${item.quantity}</span></span>
                    <span class="font-black text-slate-900">${Helpers.formatPrice(itemTotal)}</span>
                </div>
            `;
        }).join('');
    }

    const total = subtotal + 10.00;
    const subVal = document.getElementById('summarySubtotal');
    const totVal = document.getElementById('summaryTotal');
    if (subVal) subVal.textContent = Helpers.formatPrice(subtotal);
    if (totVal) totVal.textContent = Helpers.formatPrice(total);
});

async function submitOrder() {
    const form = document.getElementById('checkoutForm');
    if (!form.reportValidity()) return;

    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const statusMsg = document.getElementById('statusMessage');

    if (placeOrderBtn) {
        placeOrderBtn.disabled = true;
        placeOrderBtn.textContent = 'Processing checkout...';
    }

    if (statusMsg) statusMsg.classList.add('hidden');

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.quantity);
    const total = subtotal + 10.00;

    const user = AuthUtils.getUser();
    const paymentMethodId = parseInt(document.querySelector('input[name="paymentMethod"]:checked').value);

    const orderRequest = {
        userId: user.id,
        addressId: 1, // dummy address
        paymentMethodId: paymentMethodId,
        subtotal: subtotal,
        total: total
    };

    const token = AuthUtils.getToken();

    try {
        await OrdersAPI.place(orderRequest, token);

        if (statusMsg) {
            statusMsg.className = 'text-sm font-bold text-center p-3 rounded-xl bg-emerald-50 text-emerald-700';
            statusMsg.innerHTML = '✅ Order placed successfully! Redirecting...';
            statusMsg.classList.remove('hidden');
        }

        localStorage.removeItem('cart');

        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 1500);

    } catch (error) {
        if (statusMsg) {
            statusMsg.className = 'text-sm font-bold text-center p-3 rounded-xl bg-rose-50 text-rose-700';
            statusMsg.innerHTML = `❌ ${error.message}`;
            statusMsg.classList.remove('hidden');
        }

        if (placeOrderBtn) {
            placeOrderBtn.disabled = false;
            placeOrderBtn.textContent = 'Place Order →';
        }
    }
}
