// ===== Firebase Configuration =====
// Replace these values with your Firebase project config.
// See SETUP_FIREBASE.md for instructions.

export const firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};

// Check if Firebase is configured
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "" && firebaseConfig.projectId !== "";
}
