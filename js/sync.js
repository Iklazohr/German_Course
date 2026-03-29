// ===== Cloud Sync Service (Firestore) =====

import { isFirebaseConfigured } from './firebase-config.js';
import { getCurrentUser, getFirebaseApp } from './auth.js';

let db = null;
let initialized = false;

async function getDb() {
    if (db) return db;
    if (!isFirebaseConfigured() || !getFirebaseApp()) return null;

    try {
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        db = getFirestore(getFirebaseApp());
        initialized = true;
        return db;
    } catch (err) {
        console.error('Firestore init error:', err);
        return null;
    }
}

export function isSyncAvailable() {
    return isFirebaseConfigured() && getCurrentUser() !== null;
}

// Save entire progress to cloud
export async function saveToCloud(stateData) {
    const user = getCurrentUser();
    if (!user) return false;

    const firestore = await getDb();
    if (!firestore) return false;

    try {
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const userDoc = doc(firestore, 'users', user.uid);
        await setDoc(userDoc, {
            progress: stateData.progress || {},
            settings: stateData.settings || {},
            streakDays: stateData.streakDays || 0,
            lastActiveDate: stateData.lastActiveDate || null,
            totalExercises: stateData.totalExercises || 0,
            totalCorrect: stateData.totalCorrect || 0,
            currentLesson: stateData.currentLesson || null,
            lastSync: new Date().toISOString(),
            email: user.email || ''
        }, { merge: true });
        return true;
    } catch (err) {
        console.error('Cloud save error:', err);
        return false;
    }
}

// Load progress from cloud
export async function loadFromCloud() {
    const user = getCurrentUser();
    if (!user) return null;

    const firestore = await getDb();
    if (!firestore) return null;

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const userDoc = doc(firestore, 'users', user.uid);
        const snapshot = await getDoc(userDoc);

        if (snapshot.exists()) {
            return snapshot.data();
        }
        return null;
    } catch (err) {
        console.error('Cloud load error:', err);
        return null;
    }
}

// Merge cloud data with local data (cloud wins for newer entries)
export function mergeProgress(localData, cloudData) {
    if (!cloudData) return localData;
    if (!localData) return cloudData;

    const merged = { ...localData };

    // Merge progress entries
    if (cloudData.progress) {
        if (!merged.progress) merged.progress = {};
        for (const [key, cloudEntry] of Object.entries(cloudData.progress)) {
            const localEntry = merged.progress[key];
            if (!localEntry) {
                merged.progress[key] = cloudEntry;
            } else {
                // Keep the one with higher score or more recent completion
                const cloudTime = cloudEntry.lastAccessed || '';
                const localTime = localEntry.lastAccessed || '';
                if (cloudEntry.completed && !localEntry.completed) {
                    merged.progress[key] = cloudEntry;
                } else if (cloudEntry.score > (localEntry.score || 0)) {
                    merged.progress[key] = cloudEntry;
                } else if (cloudTime > localTime) {
                    merged.progress[key] = cloudEntry;
                }
            }
        }
    }

    // Take the higher stats
    merged.streakDays = Math.max(merged.streakDays || 0, cloudData.streakDays || 0);
    merged.totalExercises = Math.max(merged.totalExercises || 0, cloudData.totalExercises || 0);
    merged.totalCorrect = Math.max(merged.totalCorrect || 0, cloudData.totalCorrect || 0);

    return merged;
}
