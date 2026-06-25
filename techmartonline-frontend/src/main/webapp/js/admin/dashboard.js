document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    
    // Set admin details
    const user = AuthUtils.getUser();
    if (user) {
        const name = document.getElementById('adminName');
        if (name) name.textContent = `${user.firstName} ${user.lastName}`;
    }
});
