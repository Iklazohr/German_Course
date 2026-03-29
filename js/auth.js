// ===== Firebase Authentication Module =====

import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

let auth = null;
let firebaseApp = null;
let onAuthChangeCallbacks = [];
let currentUser = null;

export function getCurrentUser() {
    return currentUser;
}

export function onAuthChange(callback) {
    onAuthChangeCallbacks.push(callback);
}

function notifyAuthChange(user) {
    currentUser = user;
    onAuthChangeCallbacks.forEach(cb => cb(user));
}

export async function initAuth() {
    if (!isFirebaseConfigured()) {
        console.log('Firebase not configured - running in offline mode');
        return null;
    }

    try {
        // Dynamic import Firebase SDK from CDN
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
        const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');

        firebaseApp = initializeApp(firebaseConfig);
        auth = getAuth(firebaseApp);

        return new Promise((resolve) => {
            onAuthStateChanged(auth, (user) => {
                notifyAuthChange(user);
                resolve(user);
            });
        });
    } catch (err) {
        console.error('Firebase init error:', err);
        return null;
    }
}

export async function signUpWithEmail(email, password) {
    if (!auth) throw new Error('Auth non inizializzato');
    const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function signInWithEmail(email, password) {
    if (!auth) throw new Error('Auth non inizializzato');
    const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function signInWithGoogle() {
    if (!auth) throw new Error('Auth non inizializzato');
    const { GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
}

export async function signOut() {
    if (!auth) return;
    const { signOut: fbSignOut } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    await fbSignOut(auth);
}

export async function resetPassword(email) {
    if (!auth) throw new Error('Auth non inizializzato');
    const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js');
    await sendPasswordResetEmail(auth, email);
}

export function getFirebaseApp() {
    return firebaseApp;
}
