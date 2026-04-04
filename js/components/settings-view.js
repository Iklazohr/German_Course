import { renderPage, setHeaderTitle, showBackButton } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { getCurrentUser } from '../auth.js';
import { isFirebaseConfigured } from '../firebase-config.js';
import { playCorrect } from '../audio.js';
import { APP_VERSION } from '../version.js';

export function renderSettings() {
    setHeaderTitle('Opzioni');
    showBackButton(false);

    const settings = store.getSettings();
    const user = getCurrentUser();

    const page = renderPage(`
        ${isFirebaseConfigured() ? `
        <div class="settings-group">
            <div class="settings-group-title">Account</div>
            <div class="setting-item" id="setting-account" style="cursor:pointer">
                <div style="display:flex;align-items:center;gap:12px">
                    ${user ? `
                        <div class="auth-avatar-large" style="width:40px;height:40px;font-size:1rem">${(user.email || 'U')[0].toUpperCase()}</div>
                        <div>
                            <div class="setting-label">${user.email}</div>
                            <div class="setting-desc">Progressi sincronizzati</div>
                        </div>
                    ` : `
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        <div>
                            <div class="setting-label">Accedi o registrati</div>
                            <div class="setting-desc">Sincronizza i progressi tra i dispositivi</div>
                        </div>
                    `}
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
        </div>
        ` : ''}

        <div class="settings-group">
            <div class="settings-group-title">Aspetto</div>
            <div class="setting-item">
                <div>
                    <div class="setting-label">Tema scuro</div>
                    <div class="setting-desc">Riduci l'affaticamento degli occhi</div>
                </div>
                <label class="toggle">
                    <input type="checkbox" id="setting-dark" ${settings.darkMode ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="setting-item">
                <div>
                    <div class="setting-label">Dimensione testo</div>
                </div>
                <div class="select-group">
                    <button class="select-btn ${settings.fontSize === 'small' ? 'active' : ''}" data-size="small">A</button>
                    <button class="select-btn ${settings.fontSize === 'normal' ? 'active' : ''}" data-size="normal">A</button>
                    <button class="select-btn ${settings.fontSize === 'large' ? 'active' : ''}" data-size="large">A</button>
                    <button class="select-btn ${settings.fontSize === 'xlarge' ? 'active' : ''}" data-size="xlarge">A</button>
                </div>
            </div>
        </div>

        <div class="settings-group">
            <div class="settings-group-title">Audio</div>
            <div class="setting-item">
                <div>
                    <div class="setting-label">Effetti sonori</div>
                    <div class="setting-desc">Suoni per risposte corrette e sbagliate</div>
                </div>
                <label class="toggle">
                    <input type="checkbox" id="setting-audio" ${settings.audioEnabled !== false ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
            <div class="setting-item">
                <div>
                    <div class="setting-label">Test audio</div>
                    <div class="setting-desc">Prova il suono di risposta corretta</div>
                </div>
                <button class="btn btn-sm btn-outline" id="setting-test-audio">Prova</button>
            </div>
        </div>

        <div class="settings-group">
            <div class="settings-group-title">Dati</div>
            <div class="setting-item">
                <div>
                    <div class="setting-label">Resetta progressi</div>
                    <div class="setting-desc">Cancella tutti i progressi e ricomincia da zero</div>
                </div>
                <button class="btn btn-sm btn-outline" style="color:var(--error);border-color:var(--error)" id="setting-reset">Reset</button>
            </div>
        </div>

        <div class="settings-group">
            <div class="settings-group-title">Informazioni</div>
            <div class="setting-item">
                <div>
                    <div class="setting-label">Tedesco Facile</div>
                    <div class="setting-desc">Corso di tedesco per italiani · v${APP_VERSION}</div>
                </div>
            </div>
        </div>
    `);

    // Account
    page.querySelector('#setting-account')?.addEventListener('click', () => navigate('/account'));

    // Dark mode toggle
    page.querySelector('#setting-dark').addEventListener('change', (e) => {
        store.saveSetting('darkMode', e.target.checked);
        if (typeof window.applySettings === 'function') window.applySettings();
    });

    // Font size
    page.querySelectorAll('.select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            page.querySelectorAll('.select-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            store.saveSetting('fontSize', btn.dataset.size);
            if (typeof window.applySettings === 'function') window.applySettings();
        });
    });

    // Audio toggle
    page.querySelector('#setting-audio').addEventListener('change', (e) => {
        store.saveSetting('audioEnabled', e.target.checked);
        if (typeof window.applySettings === 'function') window.applySettings();
    });

    // Test audio
    page.querySelector('#setting-test-audio').addEventListener('click', () => {
        playCorrect();
    });

    // Reset
    page.querySelector('#setting-reset').addEventListener('click', () => {
        if (confirm('Sei sicuro? Tutti i progressi verranno cancellati.')) {
            store.resetProgress();
            if (typeof window.applySettings === 'function') window.applySettings();
            alert('Progressi resettati!');
        }
    });
}
