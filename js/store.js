// ===== LocalStorage Progress & Settings Store with Cloud Sync =====

import { isSyncAvailable, saveToCloud, loadFromCloud, mergeProgress } from './sync.js';

const STORAGE_KEY = 'germanCourse';
const STORAGE_VERSION = 1;

let syncTimeout = null;

function getDefaultState() {
    return {
        version: STORAGE_VERSION,
        settings: {
            darkMode: false,
            fontSize: 'normal',
            audioEnabled: true
        },
        progress: {},
        favorites: [],
        currentLesson: null,
        streakDays: 0,
        lastActiveDate: null,
        totalExercises: 0,
        totalCorrect: 0
    };
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return getDefaultState();
        const state = JSON.parse(raw);
        if (state.version !== STORAGE_VERSION) {
            return { ...getDefaultState(), ...state, version: STORAGE_VERSION };
        }
        // Ensure audioEnabled exists
        if (state.settings && state.settings.audioEnabled === undefined) {
            state.settings.audioEnabled = true;
        }
        return state;
    } catch {
        return getDefaultState();
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Storage full or unavailable
    }
    // Debounced cloud sync
    scheduleSyncToCloud();
}

function scheduleSyncToCloud() {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
        if (isSyncAvailable()) {
            await saveToCloud(state);
        }
    }, 2000);
}

let state = loadState();

export const store = {
    getSettings() {
        return { ...state.settings };
    },

    saveSetting(key, value) {
        state.settings[key] = value;
        saveState(state);
    },

    getProgress(lessonId) {
        return state.progress[lessonId] || null;
    },

    isCompleted(lessonId) {
        return state.progress[lessonId]?.completed === true;
    },

    getScore(lessonId) {
        return state.progress[lessonId]?.score ?? null;
    },

    saveProgress(lessonId, data) {
        state.progress[lessonId] = {
            ...state.progress[lessonId],
            ...data,
            lastAccessed: new Date().toISOString()
        };
        saveState(state);
    },

    completeLesson(lessonId, score = null) {
        state.progress[lessonId] = {
            ...state.progress[lessonId],
            completed: true,
            score: score,
            completedAt: new Date().toISOString(),
            lastAccessed: new Date().toISOString()
        };
        this.updateStreak();
        saveState(state);
    },

    addExerciseStats(total, correct) {
        state.totalExercises = (state.totalExercises || 0) + total;
        state.totalCorrect = (state.totalCorrect || 0) + correct;
        saveState(state);
    },

    getStats() {
        return {
            totalExercises: state.totalExercises || 0,
            totalCorrect: state.totalCorrect || 0,
            streakDays: state.streakDays || 0,
            completedLessons: Object.values(state.progress).filter(p => p.completed).length
        };
    },

    getLevelCompletion(levelId, courseStructure) {
        const level = courseStructure.levels.find(l => l.id === levelId);
        if (!level) return 0;

        let total = 0;
        let completed = 0;

        for (const unit of level.units) {
            for (const lesson of unit.lessons) {
                total++;
                if (this.isCompleted(lesson.id)) completed++;
            }
            if (unit.review) {
                total++;
                if (this.isCompleted(unit.review.id)) completed++;
            }
        }

        return total === 0 ? 0 : Math.round((completed / total) * 100);
    },

    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        if (state.lastActiveDate === today) return;

        if (state.lastActiveDate === yesterday) {
            state.streakDays = (state.streakDays || 0) + 1;
        } else if (state.lastActiveDate !== today) {
            state.streakDays = 1;
        }

        state.lastActiveDate = today;
        saveState(state);
    },

    getCurrentLesson() {
        return state.currentLesson;
    },

    setCurrentLesson(lessonId) {
        state.currentLesson = lessonId;
        saveState(state);
    },

    resetProgress() {
        const settings = { ...state.settings };
        state = getDefaultState();
        state.settings = settings;
        saveState(state);
    },

    getAllProgress() {
        return { ...state.progress };
    },

    // Favorites
    isFavorite(lessonId) {
        return (state.favorites || []).includes(lessonId);
    },

    toggleFavorite(lessonId) {
        if (!state.favorites) state.favorites = [];
        const idx = state.favorites.indexOf(lessonId);
        if (idx >= 0) {
            state.favorites.splice(idx, 1);
        } else {
            state.favorites.push(lessonId);
        }
        saveState(state);
        return this.isFavorite(lessonId);
    },

    getFavorites() {
        return [...(state.favorites || [])];
    },

    // Cloud sync methods
    async syncFromCloud() {
        if (!isSyncAvailable()) return false;
        try {
            const cloudData = await loadFromCloud();
            if (cloudData) {
                const merged = mergeProgress(state, cloudData);
                state = { ...state, ...merged, version: STORAGE_VERSION };
                // Preserve local settings
                if (cloudData.settings) {
                    state.settings = { ...state.settings, ...cloudData.settings };
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Sync from cloud failed:', err);
            return false;
        }
    },

    async forceSyncToCloud() {
        if (!isSyncAvailable()) return false;
        return await saveToCloud(state);
    },

    getStateForExport() {
        return { ...state };
    },

    importState(importedState) {
        const merged = mergeProgress(state, importedState);
        state = { ...state, ...merged, version: STORAGE_VERSION };
        saveState(state);
    }
};
