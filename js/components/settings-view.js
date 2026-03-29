import { renderPage, setHeaderTitle, showBackButton } from '../renderer.js';
import { store } from '../store.js';

export function renderSettings() {
    setHeaderTitle('Opzioni');
    showBackButton(false);

    const settings = store.getSettings();

    const page = renderPage(`
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
                    <div class="setting-desc">Corso di tedesco per italiani · v1.0</div>
                </div>
            </div>
        </div>
    `);

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

    // Reset
    page.querySelector('#setting-reset').addEventListener('click', () => {
        if (confirm('Sei sicuro? Tutti i progressi verranno cancellati.')) {
            store.resetProgress();
            if (typeof window.applySettings === 'function') window.applySettings();
            alert('Progressi resettati!');
        }
    });
}
