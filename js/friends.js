// ===== Friends Service (Firestore) =====

import { isFirebaseConfigured } from './firebase-config.js';
import { getCurrentUser, getFirebaseApp } from './auth.js';

let db = null;

async function getDb() {
    if (db) return db;
    if (!isFirebaseConfigured() || !getFirebaseApp()) return null;
    try {
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        db = getFirestore(getFirebaseApp());
        return db;
    } catch { return null; }
}

// Set or update nickname
export async function setNickname(nickname) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Non autenticato.' };

    const firestore = await getDb();
    if (!firestore) return { success: false, error: 'Database non disponibile.' };

    try {
        const { doc, getDoc, setDoc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        // Check if nickname is already taken
        const nickDoc = doc(firestore, 'nicknames', nickname);
        const nickSnap = await getDoc(nickDoc);
        if (nickSnap.exists() && nickSnap.data().uid !== user.uid) {
            return { success: false, error: 'Nickname già in uso. Scegline un altro.' };
        }

        // Save nickname mapping
        await setDoc(nickDoc, { uid: user.uid, nickname });

        // Update user document
        const userDoc = doc(firestore, 'users', user.uid);
        await setDoc(userDoc, { nickname }, { merge: true });

        return { success: true };
    } catch (err) {
        console.error('Set nickname error:', err);
        return { success: false, error: 'Errore. Riprova.' };
    }
}

// Get current user's nickname
export async function getNickname() {
    const user = getCurrentUser();
    if (!user) return null;

    const firestore = await getDb();
    if (!firestore) return null;

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const userDoc = doc(firestore, 'users', user.uid);
        const snap = await getDoc(userDoc);
        return snap.exists() ? snap.data().nickname || null : null;
    } catch { return null; }
}

// Search user by nickname
export async function searchUserByNickname(nickname) {
    const firestore = await getDb();
    if (!firestore) return null;

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const nickDoc = doc(firestore, 'nicknames', nickname);
        const snap = await getDoc(nickDoc);
        if (snap.exists()) {
            return snap.data(); // { uid, nickname }
        }
        return null;
    } catch { return null; }
}

// Add friend by nickname
export async function addFriend(nickname) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Non autenticato.' };

    const firestore = await getDb();
    if (!firestore) return { success: false, error: 'Database non disponibile.' };

    try {
        const { doc, getDoc, setDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        // Find user by nickname
        const found = await searchUserByNickname(nickname);
        if (!found) return { success: false, error: 'Nickname non trovato.' };
        if (found.uid === user.uid) return { success: false, error: 'Non puoi aggiungere te stesso!' };

        // Add to friends list
        const userDoc = doc(firestore, 'users', user.uid);
        await setDoc(userDoc, {
            friends: arrayUnion({ uid: found.uid, nickname: found.nickname })
        }, { merge: true });

        return { success: true };
    } catch (err) {
        console.error('Add friend error:', err);
        return { success: false, error: 'Errore. Riprova.' };
    }
}

// Remove friend by nickname
export async function removeFriend(nickname) {
    const user = getCurrentUser();
    if (!user) return { success: false, error: 'Non autenticato.' };

    const firestore = await getDb();
    if (!firestore) return { success: false, error: 'Database non disponibile.' };

    try {
        const { doc, getDoc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

        const userDoc = doc(firestore, 'users', user.uid);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) return { success: false };

        const data = snap.data();
        const friends = (data.friends || []).filter(f => f.nickname !== nickname);
        await setDoc(userDoc, { friends }, { merge: true });

        return { success: true };
    } catch (err) {
        console.error('Remove friend error:', err);
        return { success: false, error: 'Errore. Riprova.' };
    }
}

// Get friend list
export async function getFriends() {
    const user = getCurrentUser();
    if (!user) return [];

    const firestore = await getDb();
    if (!firestore) return [];

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const userDoc = doc(firestore, 'users', user.uid);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) return [];
        return snap.data().friends || [];
    } catch { return []; }
}

// Get a friend's progress (public stats only)
export async function getFriendProgress(friendUid) {
    const firestore = await getDb();
    if (!firestore) return null;

    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
        const friendDoc = doc(firestore, 'users', friendUid);
        const snap = await getDoc(friendDoc);
        if (!snap.exists()) return null;

        const data = snap.data();
        return {
            nickname: data.nickname || '?',
            streakDays: data.streakDays || 0,
            totalExercises: data.totalExercises || 0,
            totalCorrect: data.totalCorrect || 0,
            completedLessons: data.progress ? Object.values(data.progress).filter(p => p.completed).length : 0
        };
    } catch { return null; }
}
