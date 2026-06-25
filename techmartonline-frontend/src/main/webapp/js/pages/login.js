document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    // Check query params for registration success
    const registered = Helpers.getQueryParam('registered');
    if (registered === 'true') {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.textContent = '✅ Account created successfully! Please login.';
            successMsg.classList.add('show');
        }
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const loginBtn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMessage');
        const successMsg = document.getElementById('successMessage');

        errorMsg.classList.remove('show');
        successMsg.classList.remove('show');
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';

        try {
            const data = await AuthAPI.login(email, password);
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user', JSON.stringify(data.user));

            successMsg.textContent = '✅ Login successful! Redirecting...';
            successMsg.classList.add('show');

            setTimeout(() => {
                if (data.role === 'ADMIN') {
                    window.location.href = '../admin/dashboard.html';
                } else {
                    window.location.href = '../user/products.html';
                }
            }, 1200);
        } catch (err) {
            errorMsg.textContent = '❌ ' + err.message;
            errorMsg.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In →';
        }
    });
});
