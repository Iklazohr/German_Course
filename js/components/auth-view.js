import { renderPage, setHeaderTitle, showBackButton } from '../renderer.js';
import { getCurrentUser, signUpWithEmail, signInWithEmail, signInWithGoogle, signOut, resetPassword } from '../auth.js';
import { isFirebaseConfigured } from '../firebase-config.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

export function renderAuthPage() {
    setHeaderTitle('Account');
    showBackButton(true, () => navigate('/'));

    if (!isFirebaseConfigured()) {
        renderNotConfigured();
        return;
    }

    const user = getCurrentUser();
    if (user) {
        renderLoggedIn(user);
    } else {
        renderLoginForm();
    }
}

function renderNotConfigured() {
    renderPage(`
        <div class="card" style="text-align:center;padding:32px 24px">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" style="margin-bottom:16px"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h3 style="margin-bottom:8px">Account non disponibile</h3>
            <p class="text-secondary" style="font-size:0.875rem;margin-bottom:16px">
                Il sistema di account richiede la configurazione di Firebase.
                I tuoi progressi vengono salvati localmente su questo dispositivo.
            </p>
            <p class="text-secondary" style="font-size:0.8125rem">
                Per attivare gli account, segui le istruzioni nel file <strong>SETUP_FIREBASE.md</strong> del repository.
            </p>
        </div>
    `);
}

function renderLoginForm() {
    const page = renderPage(`
        <div class="auth-container">
            <div class="card" style="padding:28px 24px;text-align:center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="1.5" style="margin-bottom:12px"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <h2 style="margin-bottom:4px">Accedi o Registrati</h2>
                <p class="text-secondary" style="font-size:0.875rem;margin-bottom:24px">Sincronizza i progressi su tutti i dispositivi</p>

                <div id="auth-error" class="auth-error hidden"></div>

                <div class="auth-form">
                    <input type="email" id="auth-email" class="auth-input" placeholder="Email" autocomplete="email">
                    <input type="password" id="auth-password" class="auth-input" placeholder="Password" autocomplete="current-password">

                    <button class="btn btn-primary btn-block" id="btn-login">Accedi</button>
                    <button class="btn btn-outline btn-block" id="btn-signup">Crea account</button>

                    <div class="auth-divider">
                        <span>oppure</span>
                    </div>

                    <button class="btn btn-block auth-google-btn" id="btn-google">
                        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Accedi con Google
                    </button>

                    <button class="auth-link" id="btn-forgot">Password dimenticata?</button>
                </div>
            </div>
        </div>
    `);

    const emailEl = page.querySelector('#auth-email');
    const passEl = page.querySelector('#auth-password');
    const errorEl = page.querySelector('#auth-error');

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
    }

    function clearError() {
        errorEl.classList.add('hidden');
    }

    page.querySelector('#btn-login').addEventListener('click', async () => {
        clearError();
        const email = emailEl.value.trim();
        const pass = passEl.value;
        if (!email || !pass) { showError('Inserisci email e password.'); return; }
        try {
            await signInWithEmail(email, pass);
            await store.syncFromCloud();
            if (typeof window.applySettings === 'function') window.applySettings();
            navigate('/');
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
    });

    page.querySelector('#btn-signup').addEventListener('click', async () => {
        clearError();
        const email = emailEl.value.trim();
        const pass = passEl.value;
        if (!email || !pass) { showError('Inserisci email e password.'); return; }
        if (pass.length < 6) { showError('La password deve avere almeno 6 caratteri.'); return; }
        try {
            await signUpWithEmail(email, pass);
            await store.forceSyncToCloud();
            if (typeof window.applySettings === 'function') window.applySettings();
            navigate('/');
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
    });

    page.querySelector('#btn-google').addEventListener('click', async () => {
        clearError();
        try {
            await signInWithGoogle();
            await store.syncFromCloud();
            if (typeof window.applySettings === 'function') window.applySettings();
            navigate('/');
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
    });

    page.querySelector('#btn-forgot').addEventListener('click', async () => {
        clearError();
        const email = emailEl.value.trim();
        if (!email) { showError('Inserisci la tua email per resettare la password.'); return; }
        try {
            await resetPassword(email);
            showError('Email di reset inviata! Controlla la tua casella.');
            errorEl.style.color = 'var(--success)';
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
    });
}

function renderLoggedIn(user) {
    const page = renderPage(`
        <div class="card" style="text-align:center;padding:28px 24px">
            <div class="auth-avatar-large">${(user.email || 'U')[0].toUpperCase()}</div>
            <h3 style="margin:12px 0 4px">${user.displayName || 'Studente'}</h3>
            <p class="text-secondary" style="font-size:0.875rem;margin-bottom:20px">${user.email}</p>

            <div class="badge badge-success" style="margin-bottom:20px">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>
                Progressi sincronizzati
            </div>

            <div style="display:flex;flex-direction:column;gap:10px">
                <button class="btn btn-outline btn-block" id="btn-sync">Sincronizza ora</button>
                <button class="btn btn-block" id="btn-logout" style="background:var(--error);color:#fff">Esci</button>
            </div>
        </div>
    `);

    page.querySelector('#btn-sync').addEventListener('click', async () => {
        const btn = page.querySelector('#btn-sync');
        btn.textContent = 'Sincronizzazione...';
        btn.disabled = true;
        await store.syncFromCloud();
        await store.forceSyncToCloud();
        btn.textContent = 'Sincronizzato!';
        if (typeof window.applySettings === 'function') window.applySettings();
        setTimeout(() => {
            btn.textContent = 'Sincronizza ora';
            btn.disabled = false;
        }, 2000);
    });

    page.querySelector('#btn-logout').addEventListener('click', async () => {
        await signOut();
        renderAuthPage();
    });
}

function getErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-email': return 'Email non valida.';
        case 'auth/user-disabled': return 'Account disabilitato.';
        case 'auth/user-not-found': return 'Nessun account con questa email.';
        case 'auth/wrong-password': return 'Password errata.';
        case 'auth/invalid-credential': return 'Email o password errata.';
        case 'auth/email-already-in-use': return 'Questa email è già registrata. Prova ad accedere.';
        case 'auth/weak-password': return 'Password troppo debole (minimo 6 caratteri).';
        case 'auth/too-many-requests': return 'Troppi tentativi. Riprova più tardi.';
        case 'auth/popup-closed-by-user': return 'Finestra chiusa. Riprova.';
        default: return 'Errore. Riprova più tardi.';
    }
}
