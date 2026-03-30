import { renderPage, setHeaderTitle, showBackButton } from '../renderer.js';
import { getCurrentUser, signUpWithEmail, signInWithEmail, signOut, resetPassword } from '../auth.js';
import { isFirebaseConfigured } from '../firebase-config.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { setNickname, getNickname, searchUserByNickname, addFriend, removeFriend, getFriends, getFriendProgress } from '../friends.js';

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

    // Share button (always visible)
    addShareButton();
}

function renderNotConfigured() {
    renderPage(`
        <div class="card" style="text-align:center;padding:32px 24px">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5" style="margin-bottom:16px"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <h3 style="margin-bottom:8px">Account non disponibile</h3>
            <p class="text-secondary" style="font-size:0.875rem">
                I tuoi progressi vengono salvati localmente su questo dispositivo.
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
                <p class="text-secondary" style="font-size:0.875rem;margin-bottom:24px">Sincronizza i progressi e aggiungi amici</p>

                <div id="auth-error" class="auth-error hidden"></div>

                <div class="auth-form">
                    <input type="email" id="auth-email" class="auth-input" placeholder="Email" autocomplete="email">
                    <input type="password" id="auth-password" class="auth-input" placeholder="Password" autocomplete="current-password">

                    <button class="btn btn-primary btn-block" id="btn-login">Accedi</button>
                    <button class="btn btn-outline btn-block" id="btn-signup">Crea account</button>

                    <button class="auth-link" id="btn-forgot">Password dimenticata?</button>
                </div>
            </div>
        </div>
    `);

    const emailEl = page.querySelector('#auth-email');
    const passEl = page.querySelector('#auth-password');
    const errorEl = page.querySelector('#auth-error');

    function showError(msg, isSuccess) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        errorEl.style.color = isSuccess ? 'var(--success)' : '';
    }

    function clearError() {
        errorEl.classList.add('hidden');
        errorEl.style.color = '';
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
            renderAuthPage(); // Reload to show nickname setup
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
            showError('Email di reset inviata! Controlla la tua casella.', true);
        } catch (err) {
            showError(getErrorMessage(err.code));
        }
    });
}

async function renderLoggedIn(user) {
    const currentNickname = await getNickname();
    const stats = store.getStats();

    const page = renderPage(`
        <div class="card" style="text-align:center;padding:28px 24px;margin-bottom:16px">
            <div class="auth-avatar-large">${(currentNickname || user.email || 'U')[0].toUpperCase()}</div>
            <h3 style="margin:12px 0 4px">${currentNickname || 'Imposta un nickname'}</h3>
            <p class="text-secondary" style="font-size:0.875rem;margin-bottom:16px">${user.email}</p>

            ${!currentNickname ? `
                <div class="nickname-setup" style="margin-bottom:16px">
                    <p class="text-secondary" style="font-size:0.85rem;margin-bottom:10px">Scegli un nickname per farti trovare dagli amici:</p>
                    <div style="display:flex;gap:8px">
                        <input type="text" id="nickname-input" class="auth-input" placeholder="Il tuo nickname" maxlength="20" style="margin:0;flex:1">
                        <button class="btn btn-primary" id="btn-set-nickname">Salva</button>
                    </div>
                    <div id="nickname-error" class="auth-error hidden" style="margin-top:8px"></div>
                </div>
            ` : `
                <div class="badge badge-success" style="margin-bottom:16px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg>
                    Progressi sincronizzati
                </div>
            `}

            <div style="display:flex;flex-direction:column;gap:10px">
                <button class="btn btn-outline btn-block" id="btn-sync">Sincronizza ora</button>
                <button class="btn btn-block" id="btn-logout" style="background:var(--error);color:#fff">Esci</button>
            </div>
        </div>

        <!-- Friends Section -->
        <div class="card" style="padding:24px;margin-bottom:16px">
            <h3 style="margin:0 0 16px">Amici</h3>

            <div class="friend-add-section" style="margin-bottom:20px">
                <p class="text-secondary" style="font-size:0.85rem;margin-bottom:8px">Aggiungi un amico tramite nickname:</p>
                <div style="display:flex;gap:8px">
                    <input type="text" id="friend-search" class="auth-input" placeholder="Nickname amico" style="margin:0;flex:1">
                    <button class="btn btn-primary" id="btn-add-friend">Aggiungi</button>
                </div>
                <div id="friend-error" class="auth-error hidden" style="margin-top:8px"></div>
                <div id="friend-success" class="auth-error hidden" style="margin-top:8px;color:var(--success)"></div>
            </div>

            <div id="friends-list">
                <div class="fc-loading" style="min-height:100px"><div class="fc-spinner"></div></div>
            </div>
        </div>
    `);

    // Nickname setup
    if (!currentNickname) {
        page.querySelector('#btn-set-nickname')?.addEventListener('click', async () => {
            const input = page.querySelector('#nickname-input');
            const errEl = page.querySelector('#nickname-error');
            const nick = input.value.trim().toLowerCase();

            if (!nick || nick.length < 3) {
                errEl.textContent = 'Il nickname deve avere almeno 3 caratteri.';
                errEl.classList.remove('hidden');
                return;
            }
            if (!/^[a-z0-9_]+$/.test(nick)) {
                errEl.textContent = 'Solo lettere, numeri e underscore.';
                errEl.classList.remove('hidden');
                return;
            }

            try {
                const result = await setNickname(nick);
                if (result.success) {
                    renderAuthPage(); // Reload
                } else {
                    errEl.textContent = result.error;
                    errEl.classList.remove('hidden');
                }
            } catch {
                errEl.textContent = 'Errore. Riprova.';
                errEl.classList.remove('hidden');
            }
        });
    }

    // Sync
    page.querySelector('#btn-sync').addEventListener('click', async () => {
        const btn = page.querySelector('#btn-sync');
        btn.textContent = 'Sincronizzazione...';
        btn.disabled = true;
        await store.syncFromCloud();
        await store.forceSyncToCloud();
        btn.textContent = 'Sincronizzato!';
        if (typeof window.applySettings === 'function') window.applySettings();
        setTimeout(() => { btn.textContent = 'Sincronizza ora'; btn.disabled = false; }, 2000);
    });

    // Logout
    page.querySelector('#btn-logout').addEventListener('click', async () => {
        await signOut();
        renderAuthPage();
    });

    // Add friend
    page.querySelector('#btn-add-friend').addEventListener('click', async () => {
        const input = page.querySelector('#friend-search');
        const errEl = page.querySelector('#friend-error');
        const succEl = page.querySelector('#friend-success');
        errEl.classList.add('hidden');
        succEl.classList.add('hidden');

        const nick = input.value.trim().toLowerCase();
        if (!nick) { errEl.textContent = 'Inserisci un nickname.'; errEl.classList.remove('hidden'); return; }

        if (nick === currentNickname) {
            errEl.textContent = 'Non puoi aggiungere te stesso!';
            errEl.classList.remove('hidden');
            return;
        }

        try {
            const result = await addFriend(nick);
            if (result.success) {
                succEl.textContent = `${nick} aggiunto agli amici!`;
                succEl.classList.remove('hidden');
                input.value = '';
                loadFriendsList(page);
            } else {
                errEl.textContent = result.error;
                errEl.classList.remove('hidden');
            }
        } catch {
            errEl.textContent = 'Errore. Riprova.';
            errEl.classList.remove('hidden');
        }
    });

    // Load friends
    loadFriendsList(page);
}

async function loadFriendsList(page) {
    const listEl = page.querySelector('#friends-list');
    try {
        const friends = await getFriends();

        if (!friends || friends.length === 0) {
            listEl.innerHTML = `
                <div style="text-align:center;padding:16px;color:var(--text-tertiary)">
                    <p>Nessun amico ancora.</p>
                    <p style="font-size:0.85em">Aggiungi amici tramite il loro nickname!</p>
                </div>
            `;
            return;
        }

        // Load progress for each friend
        const friendsData = await Promise.all(friends.map(async (f) => {
            const progress = await getFriendProgress(f.uid);
            return { ...f, progress };
        }));

        listEl.innerHTML = friendsData.map(friend => {
            const p = friend.progress || {};
            const completedLessons = p.completedLessons || 0;
            const streak = p.streakDays || 0;
            const exercises = p.totalExercises || 0;
            const accuracy = exercises > 0 ? Math.round((p.totalCorrect || 0) / exercises * 100) : 0;

            return `
                <div class="friend-card" data-uid="${friend.uid}">
                    <div class="friend-avatar">${(friend.nickname || '?')[0].toUpperCase()}</div>
                    <div class="friend-info">
                        <div class="friend-name">${friend.nickname}</div>
                        <div class="friend-stats">
                            🔥 ${streak} · 📖 ${completedLessons} lezioni · 🎯 ${accuracy}%
                        </div>
                    </div>
                    <button class="friend-remove-btn" data-nick="${friend.nickname}" title="Rimuovi">✕</button>
                </div>
            `;
        }).join('');

        // Remove friend buttons
        listEl.querySelectorAll('.friend-remove-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const nick = btn.dataset.nick;
                if (confirm(`Rimuovere ${nick} dagli amici?`)) {
                    await removeFriend(nick);
                    loadFriendsList(page);
                }
            });
        });

    } catch (err) {
        listEl.innerHTML = `<p class="text-secondary" style="text-align:center">Errore nel caricamento amici.</p>`;
    }
}

function addShareButton() {
    const main = document.getElementById('app-main');
    const page = main?.querySelector('.page');
    if (!page) return;

    const shareDiv = document.createElement('div');
    shareDiv.style.cssText = 'text-align:center;padding:8px 0 16px';
    shareDiv.innerHTML = `
        <button class="btn btn-outline" id="btn-share" style="font-size:0.85em;padding:8px 20px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Condividi l'app
        </button>
    `;
    page.appendChild(shareDiv);

    shareDiv.querySelector('#btn-share').addEventListener('click', async () => {
        const shareData = {
            title: 'Tedesco Facile',
            text: 'Impara il tedesco dall\'italiano con questo corso gratuito da A1 a C1!',
            url: 'https://german-course-1cc9b.web.app'
        };
        const btn = shareDiv.querySelector('#btn-share');
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                const old = btn.innerHTML;
                btn.textContent = '✓ Link copiato!';
                setTimeout(() => { btn.innerHTML = old; }, 2000);
            }
        } catch {}
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
        default: return 'Errore. Riprova più tardi.';
    }
}
