/**
 * auth.js — Lógica de inicio de sesión para el panel admin
 */
import { supabase } from './supabase-client.js';

// Referencias al DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const errorMsg = document.getElementById('login-error');

// Si el usuario ya está logueado e intenta entrar a login.html, lo pasamos directo al panel
async function checkExistingSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    window.location.replace('/admin/index.html');
  }
}

// Manejo del formulario de login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI: Estado de carga
    loginBtn.textContent = 'Iniciando...';
    loginBtn.disabled = true;
    errorMsg.hidden = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    try {
      // Petición a Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Si todo sale bien, redirigimos al panel
      window.location.replace('/admin/index.html');

    } catch (error) {
      // UI: Mostrar error
      console.error('[auth] Error de login:', error.message);
      errorMsg.textContent = 'Correo o contraseña incorrectos.';
      errorMsg.hidden = false;
      
      // UI: Restaurar botón
      loginBtn.textContent = 'Iniciar Sesión';
      loginBtn.disabled = false;
    }
  });
}

// Ejecutar verificación al cargar
checkExistingSession();