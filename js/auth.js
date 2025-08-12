// ====================
// CONFIGURACIÓN INICIAL
// ====================

const SUPABASE_URL = "https://nebwwmhqaupmfsgbules.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lYnd3bWhxYXVwbWZzZ2J1bGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDUzMjUsImV4cCI6MjA3MDA4MTMyNX0.wSufUYgkxjGZxlbpqonqbdlnN1nzWXZ-Sd5zgcZeMAc";
const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ====================
// FUNCIÓN PARA CAMBIAR ENTRE FORMULARIOS
// ====================

function toggleForms() {
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (loginForm && registerForm) {
        loginForm.style.display = loginForm.style.display === "none" ? "block" : "none";
        registerForm.style.display = registerForm.style.display === "none" ? "block" : "none";
    }
}

// ====================
// FUNCIÓN DE REGISTRO
// ====================

async function register() {
    const email = document.getElementById("reg-email")?.value;
    const password = document.getElementById("reg-password")?.value;

    if (!email || !password) {
        alert("Por favor, ingresa un correo y una contraseña.");
        return;
    }

    const { data, error } = await client.auth.signUp({
        email,
        password,
    });

    if (error) {
        alert("Error de registro: " + error.message);
    } else {
        alert("¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar tu cuenta.");
        toggleForms();
    }
}

// ====================
// FUNCIÓN DE INICIO DE SESIÓN
// ====================

async function login() {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    
    if (!email || !password) {
        alert("Por favor, ingresa tu correo y contraseña.");
        return;
    }

    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        alert("Error de inicio de sesión: " + error.message);
    } else {
        alert("Sesión iniciada con éxito.");
        // Redirige al usuario al dashboard
        window.location.href = "dashboard.html";
    }
}

// ====================
// VERIFICAR SESIÓN AL CARGAR LA PÁGINA
// ====================

document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await client.auth.getSession();
    if (session) {
        // Si el usuario ya tiene una sesión, redirige al dashboard
        window.location.href = "dashboard.html";
    }
});