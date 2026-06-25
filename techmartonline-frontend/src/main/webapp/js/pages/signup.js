document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const mobile = document.getElementById('mobile').value.trim();
        const signupBtn = document.getElementById('signupBtn');
        const errorMsg = document.getElementById('errorMessage');
        const successMsg = document.getElementById('successMessage');

        errorMsg.classList.remove('show');
        successMsg.classList.remove('show');

        if (password !== confirmPassword) {
            errorMsg.textContent = '⚠️ Passwords do not match.';
            errorMsg.classList.add('show');
            return;
        }

        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';

        try {
            await AuthAPI.register(firstName, lastName, email, password, mobile);
            successMsg.textContent = '✅ Account created successfully! Redirecting to login...';
            successMsg.classList.add('show');

            setTimeout(() => {
                window.location.href = 'login.html?registered=true';
            }, 1500);
        } catch (err) {
            errorMsg.textContent = '❌ ' + err.message;
            errorMsg.classList.add('show');
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account →';
        }
    });
});
