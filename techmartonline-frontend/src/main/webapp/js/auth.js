/**
 * ============================================================
 * AUTH.JS - TechMart Online
 * Authentication functionality (login.html & signup.html)
 * ============================================================
 */

// ============================================================ */
// API CONFIGURATION
// ============================================================ */
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/techmartonline-server/api',
    ENDPOINTS: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register'
    }
};

// ============================================================ */
// LOGIN FUNCTION
// ============================================================ */
function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide messages
        errorMsg.classList.remove('show');
        successMsg.classList.remove('show');

        // Disable button
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Validation
        if (!email || !password) {
            errorMsg.textContent = '⚠️ Please fill in all fields.';
            errorMsg.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In →';
            return;
        }

        try {
            // Call Login API
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            // Success - store token
            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Show success message
            successMsg.textContent = '✅ Login successful! Redirecting...';
            successMsg.classList.add('show');

            // Redirect based on role
            setTimeout(() => {
                if (data.role === 'ADMIN') {
                    window.location.href = '../admin/dashboard.html';
                } else {
                    window.location.href = '../user/products.html';
                }
            }, 1200);

        } catch (error) {
            errorMsg.textContent = '❌ ' + (error.message || 'Login failed. Please try again.');
            errorMsg.classList.add('show');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In →';
        }
    });
}

// ============================================================ */
// SIGNUP FUNCTION - First Name + Last Name
// ============================================================ */
function initSignup() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;

    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirmPassword');
    const mobileInput = document.getElementById('mobile');
    const signupBtn = document.getElementById('signupBtn');
    const errorMsg = document.getElementById('errorMessage');
    const successMsg = document.getElementById('successMessage');

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Hide messages
        errorMsg.classList.remove('show');
        successMsg.classList.remove('show');

        // Disable button
        signupBtn.disabled = true;
        signupBtn.textContent = 'Creating account...';

        // Get values
        const firstName = firstNameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();
        const confirmPassword = confirmInput.value.trim();
        const mobile = mobileInput.value.trim();

        // Validation
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            errorMsg.textContent = '⚠️ Please fill in all required fields.';
            errorMsg.classList.add('show');
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account →';
            return;
        }

        if (password.length < 6) {
            errorMsg.textContent = '⚠️ Password must be at least 6 characters.';
            errorMsg.classList.add('show');
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account →';
            return;
        }

        if (password !== confirmPassword) {
            errorMsg.textContent = '⚠️ Passwords do not match.';
            errorMsg.classList.add('show');
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account →';
            return;
        }

        // Prepare data with firstName + lastName
        const userData = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            mobile: mobile || null,
            role: 'CUSTOMER'
        };

        try {
            // Call Register API
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Success
            successMsg.textContent = '✅ Account created successfully! Redirecting to login...';
            successMsg.classList.add('show');

            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html?registered=true';
            }, 1500);

        } catch (error) {
            errorMsg.textContent = '❌ ' + (error.message || 'Registration failed. Please try again.');
            errorMsg.classList.add('show');
            signupBtn.disabled = false;
            signupBtn.textContent = 'Create Account →';
        }
    });
}

// ============================================================ */
// CHECK URL PARAMETERS (for registration success message)
// ============================================================ */
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const registered = urlParams.get('registered');

    if (registered === 'true') {
        const successMsg = document.getElementById('successMessage');
        if (successMsg) {
            successMsg.textContent = '✅ Account created successfully! Please login.';
            successMsg.classList.add('show');
        }
    }
}

// ============================================================ */
// INIT
// ============================================================ */
document.addEventListener('DOMContentLoaded', function() {
    // Check URL params
    checkUrlParams();

    // Initialize login
    initLogin();

    // Initialize signup
    initSignup();
});