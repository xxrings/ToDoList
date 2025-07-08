// auth.js

import { auth } from './firebase.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

// Sign up new user
export async function registerUser(email, password) {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User registered:', user);
  } catch (error) {
    console.error('Registration error:', error.message);
  }
}

// Log in existing user
export async function loginUser(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', user);
  } catch (error) {
    console.error('Login error:', error.message);
  }
}

// Log out
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Logout error:', error.message);
  }
}

// Detect login status
export function monitorAuthState(callback) {
  onAuthStateChanged(auth, user => {
    callback(user);
  });
}

// ─── Top-level hookup ────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const emailInput   = document.getElementById('email');
  const passwordInput= document.getElementById('password');
  const loginBtn     = document.getElementById('login-btn');
  const signupBtn    = document.getElementById('signup-btn');
  const logoutBtn    = document.getElementById('logout-btn');
  const userStatus   = document.getElementById('user-status');

  loginBtn.addEventListener('click', async () => {
    const email    = emailInput.value;
    const password = passwordInput.value;
    await loginUser(email, password);
  });

  signupBtn.addEventListener('click', async () => {
    const email    = emailInput.value;
    const password = passwordInput.value;
    await registerUser(email, password);
  });

  logoutBtn.addEventListener('click', async () => {
    await logoutUser();
  });

  monitorAuthState(user => {
    if (user) {
      // Show status + logout, hide everything else
      userStatus.textContent    = `Logged in as: ${user.email}`;
      logoutBtn.style.display   = 'inline-block';
      emailInput.style.display  = 'none';
      passwordInput.style.display = 'none';
      loginBtn.style.display    = 'none';
      signupBtn.style.display   = 'none';
    } else {
      // Show login form, hide logout
      userStatus.textContent      = 'Not logged in';
      logoutBtn.style.display     = 'none';
      emailInput.style.display    = 'inline-block';
      passwordInput.style.display = 'inline-block';
      loginBtn.style.display      = 'inline-block';
      signupBtn.style.display     = 'inline-block';
    }
  });
});

