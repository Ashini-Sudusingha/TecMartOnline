const AuthAPI = {
    async login(email, password) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        return data.data;
    },
    async register(firstName, lastName, email, password, mobile) {
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ firstName, lastName, email, password, mobile, role: 'CUSTOMER' })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Registration failed');
        return data;
    }
};
