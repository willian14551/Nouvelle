document.addEventListener("DOMContentLoaded", function() {
    const senhaInput = document.getElementById('senhaLogin');
    const togglePassword = document.querySelector('.btn-toggle-password');

    if (togglePassword && senhaInput) {
        togglePassword.addEventListener('click', function() {
            const tipo = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
            senhaInput.setAttribute('type', tipo);
            
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }
});