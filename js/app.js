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
    } else if (isFirebaseConfigured()) {
        indicator.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
        indicator.classList.remove('hidden');
        indicator.title = 'Accedi';
    } else {
        indicator.classList.add('hidden');
    }
}

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    const settings = store.getSettings();
    store.saveSetting('darkMode', !settings.darkMode);
    applySettings();
});

// Settings button click
document.getElementById('settings-btn')?.addEventListener('click', () => {
    navigate('/settings');
});

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

// Register service worker with auto-update
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
        // Check for updates every 60 seconds
        setInterval(() => reg.update(), 60000);
    }).catch(() => {});

    // When a new service worker takes over, reload the page
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
            refreshing = true;
            window.location.reload();
        }
    });
}

// Expose for settings changes
window.applySettings = applySettings;
