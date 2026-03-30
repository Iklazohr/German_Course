// ===== App Entry Point =====

import { store } from './store.js';
import { addRoute, startRouter, navigate } from './router.js';
import { renderDashboard } from './components/dashboard.js';
import { renderLevels, renderLevel } from './components/levels-view.js';
import { renderLesson } from './components/lesson-view.js';
import { renderExercise } from './components/exercise-view.js';
import { renderProgress } from './components/progress-view.js';
import { renderSettings } from './components/settings-view.js';
import { renderAuthPage } from './components/auth-view.js';
import { renderFlashcards, renderFlashcardDeck } from './components/flashcards-view.js';
import { renderTheory } from './components/theory-view.js';
import { initAuth, onAuthChange, getCurrentUser } from './auth.js';
import { isFirebaseConfigured } from './firebase-config.js';
import { setAudioEnabled } from './audio.js';

// Apply saved settings
function applySettings() {
    const settings = store.getSettings();
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-font', settings.fontSize || 'normal');
    setAudioEnabled(settings.audioEnabled !== false);

    // Update streak badge
    const stats = store.getStats();
    const badge = document.getElementById('streak-badge');
    const count = document.getElementById('streak-count');
    if (stats.streakDays > 0) {
        badge.classList.remove('hidden');
        count.textContent = stats.streakDays;
    } else {
        badge.classList.add('hidden');
    }

    // Update auth indicator
    updateAuthIndicator();
}

function updateAuthIndicator() {
    const indicator = document.getElementById('auth-indicator');
    if (!indicator) return;

    const user = getCurrentUser();
    if (user) {
        const initial = (user.email || 'U')[0].toUpperCase();
        indicator.innerHTML = `<span class="auth-avatar">${initial}</span>`;
        indicator.classList.remove('hidden');
        indicator.title = user.email || 'Account';
    } else {
        indicator.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        indicator.classList.remove('hidden');
        indicator.title = 'Account';
    }
}

// Streak badge click — open calendar
document.getElementById('streak-badge')?.addEventListener('click', () => {
    showStreakCalendar();
});

function showStreakCalendar() {
    // Remove existing
    document.getElementById('streak-modal')?.remove();

    const activeDates = new Set(store.getActiveDates());
    const stats = store.getStats();
    const now = new Date();
    let viewYear = now.getFullYear();
    let viewMonth = now.getMonth();

    const modal = document.createElement('div');
    modal.id = 'streak-modal';
    modal.className = 'streak-modal-overlay';
    document.body.appendChild(modal);

    function renderCalendar() {
        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        const monthName = new Date(viewYear, viewMonth).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
        const today = new Date().toISOString().split('T')[0];

        // Count active days this month
        let monthActive = 0;
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            if (activeDates.has(ds)) monthActive++;
        }

        const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
        // Adjust firstDay: JS uses 0=Sun, we want 0=Mon
        const startOffset = (firstDay + 6) % 7;

        let daysHtml = dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('');
        for (let i = 0; i < startOffset; i++) daysHtml += '<div class="cal-day empty"></div>';
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isActive = activeDates.has(ds);
            const isToday = ds === today;
            daysHtml += `<div class="cal-day${isActive ? ' active' : ''}${isToday ? ' today' : ''}">${d}</div>`;
        }

        modal.innerHTML = `
            <div class="streak-modal-content">
                <div class="streak-modal-header">
                    <div class="streak-modal-streak">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color:var(--warning)"><path d="M12 23c-3.6 0-8-3.17-8-8.5C4 9.83 8.26 4.77 11.34 2.23a1 1 0 011.32 0C15.74 4.77 20 9.83 20 14.5c0 5.33-4.4 8.5-8 8.5z"/></svg>
                        <span>${stats.streakDays} ${stats.streakDays === 1 ? 'giorno' : 'giorni'} di fila</span>
                    </div>
                    <button class="streak-modal-close" id="streak-close">&times;</button>
                </div>
                <div class="cal-nav">
                    <button class="cal-nav-btn" id="cal-prev">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <div class="cal-month-label">${monthName.charAt(0).toUpperCase() + monthName.slice(1)}</div>
                    <button class="cal-nav-btn" id="cal-next">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                </div>
                <div class="cal-grid">${daysHtml}</div>
                <div class="cal-footer">${monthActive} ${monthActive === 1 ? 'giorno attivo' : 'giorni attivi'} questo mese</div>
            </div>
        `;

        modal.querySelector('#streak-close').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
        modal.querySelector('#cal-prev').addEventListener('click', () => {
            viewMonth--;
            if (viewMonth < 0) { viewMonth = 11; viewYear--; }
            renderCalendar();
        });
        modal.querySelector('#cal-next').addEventListener('click', () => {
            viewMonth++;
            if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            renderCalendar();
        });
    }

    renderCalendar();
}

// Auth indicator click
document.getElementById('auth-indicator')?.addEventListener('click', () => {
    navigate('/account');
});

// Register routes
addRoute('/', () => renderDashboard());
addRoute('/levels', () => renderLevels());
addRoute('/level/:id', (params) => renderLevel(params.id));
addRoute('/lesson/:id', (params) => renderLesson(params.id));
addRoute('/exercise/:id', (params) => renderExercise(params.id));
addRoute('/theory', () => renderTheory());
addRoute('/flashcards', () => renderFlashcards());
addRoute('/flashcards/:id', (params) => renderFlashcardDeck(params.id));
addRoute('/progress', () => renderProgress());
addRoute('/settings', () => renderSettings());
addRoute('/account', () => renderAuthPage());

// Initialize
async function init() {
    applySettings();
    store.updateStreak();

    // Initialize Firebase auth if configured
    if (isFirebaseConfigured()) {
        await initAuth();
        onAuthChange(async (user) => {
            updateAuthIndicator();
            if (user) {
                // Sync from cloud on login
                await store.syncFromCloud();
                applySettings();
            }
        });
    }

    startRouter();
}

init();

// Register service worker with update banner
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60000);

        // When a new SW is found waiting, show update banner
        const showUpdateBanner = () => {
            if (document.getElementById('update-banner')) return;
            const banner = document.createElement('div');
            banner.id = 'update-banner';
            banner.innerHTML = `
                <div class="update-banner-content">
                    <span>Nuova versione disponibile</span>
                    <button id="update-btn">Aggiorna</button>
                    <button id="update-dismiss" class="update-dismiss">✕</button>
                </div>
            `;
            document.body.appendChild(banner);

            banner.querySelector('#update-btn').addEventListener('click', () => {
                if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                // Fallback: reload after a short delay if controllerchange doesn't fire
                setTimeout(() => window.location.reload(), 1500);
            });
            banner.querySelector('#update-dismiss').addEventListener('click', () => {
                banner.remove();
            });
        };

        if (reg.waiting) showUpdateBanner();
        reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    showUpdateBanner();
                }
            });
        });
    }).catch(() => {});

    // When the new SW takes over, reload
    let refreshing = false;
    function doReload() {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    }
    navigator.serviceWorker.addEventListener('controllerchange', doReload);
    // Fallback: SW sends message after activating
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_ACTIVATED') {
            doReload();
        }
    });
}

// Expose for settings changes
window.applySettings = applySettings;
