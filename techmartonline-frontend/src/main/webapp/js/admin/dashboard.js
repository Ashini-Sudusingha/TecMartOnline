document.addEventListener('DOMContentLoaded', () => {
    if (!AuthUtils.checkAuth('ADMIN')) return;
    
    // Set admin details
    const user = AuthUtils.getUser();
    if (user) {
        const name = document.getElementById('adminName');
        if (name) {
            if (user.firstName && user.lastName) {
                name.textContent = `${user.firstName} ${user.lastName}`;
            } else if (user.name) {
                name.textContent = user.name;
            } else if (user.email) {
                name.textContent = user.email.split('@')[0];
            }
        }
    }
});
