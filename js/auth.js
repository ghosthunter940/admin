import { supabase } from './lib/supabaseClient.js';

const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const appContent = document.getElementById('app-content');
const loginError = document.getElementById('login-error');

const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Jika berada di halaman admin.html
    if (window.location.pathname.endsWith('admin.html')) {
        if (!session) {
            window.location.href = 'login.html';
        } else {
            // Tampilkan konten jika user sudah login
            if(appContent) appContent.classList.remove('hidden');
        }
    }

    // Jika berada di halaman login.html
    if (window.location.pathname.endsWith('login.html')) {
        if (session) {
            window.location.href = 'admin.html';
        }
    }
};

const handleLogin = async (e) => {
    e.preventDefault();
    if(loginError) loginError.classList.add('hidden');
    
    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        console.error('Login error:', error);
        if(loginError) {
            loginError.textContent = 'Email atau password salah.';
            loginError.classList.remove('hidden');
        }
    } else {
        window.location.href = 'admin.html';
    }
};

const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan pengecekan user saat halaman dimuat
    checkUser();
    
    // Tambahkan listener hanya jika elemennya ada
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

