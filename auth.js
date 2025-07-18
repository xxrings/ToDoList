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
    alert('Account created successfully! You are now logged in.');
  } catch (error) {
    console.error('Registration error:', error.message);
    alert('Registration failed: ' + error.message);
  }
}

// Log in existing user
export async function loginUser(email, password) {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('User logged in:', user);
    alert('Login successful!');
  } catch (error) {
    console.error('Login error:', error.message);
    alert('Login failed: ' + error.message);
  }
}

// Log out
export async function logoutUser() {
  try {
    await signOut(auth);
    console.log('User signed out');
  } catch (error) {
    console.error('Logout error:', error.message);
    alert('Logout failed: ' + error.message);
  }
}

// Detect login status
export function monitorAuthState(callback) {
  onAuthStateChanged(auth, user => {
    callback(user);
  });
}

