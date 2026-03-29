// ===== App Entry Point =====

import { store } from './store.js';
import { addRoute, startRouter, navigate } from './router.js';
import { renderDashboard } from './components/dashboard.js';
import { renderLevels, renderLevel } from './components/levels-view.js';
import { renderLesson } from './components/lesson-view.js';
import { renderExercise } from './components/exercise-view.js';
import { renderProgress } from './components/progress-view.js';
import { renderSettings } from './components/settings-view.js';

// Apply saved settings
function applySettings() {
    const settings = store.getSettings();
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-font', settings.fontSize || 'normal');

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
}

// Theme toggle
document.getElementById('theme-toggle').addEventListener('click', () => {
    const settings = store.getSettings();
    store.saveSetting('darkMode', !settings.darkMode);
    applySettings();
});

// Register routes
addRoute('/', () => renderDashboard());
addRoute('/levels', () => renderLevels());
addRoute('/level/:id', (params) => renderLevel(params.id));
addRoute('/lesson/:id', (params) => renderLesson(params.id));
addRoute('/exercise/:id', (params) => renderExercise(params.id));
addRoute('/progress', () => renderProgress());
addRoute('/settings', () => renderSettings());

// Initialize
applySettings();
store.updateStreak();
startRouter();

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Expose for settings changes
window.applySettings = applySettings;
