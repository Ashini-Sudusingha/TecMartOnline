const AuthUtils = {
    getToken() {
        return localStorage.getItem('token');
    },
    getRole() {
        return localStorage.getItem('role');
    },
    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    isAuthenticated() {
        return !!this.getToken();
    },
    isAdmin() {
        return this.getRole() === 'ADMIN';
    },
    logout(redirectPath = '../auth/login.html') {
        localStorage.clear();
        window.location.href = redirectPath;
    },
    checkAuth(roleRequired) {
        if (!this.isAuthenticated()) {
            this.logout();
            return false;
        }
        if (roleRequired && this.getRole() !== roleRequired) {
            alert('Access Denied. Unauthorized role.');
            window.location.href = this.isAdmin() ? '../admin/dashboard.html' : '../user/products.html';
            return false;
        }
        return true;
    }
};
