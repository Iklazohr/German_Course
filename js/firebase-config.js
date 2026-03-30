// ===== Firebase Configuration =====
// Replace these values with your Firebase project config.
// See SETUP_FIREBASE.md for instructions.

export const firebaseConfig = {
    apiKey: "AIzaSyAR-tD9yujNHGgDk-fgf869-7QMsXFU-eQ",
    authDomain: "german-course-1cc9b.firebaseapp.com",
    projectId: "german-course-1cc9b",
    storageBucket: "german-course-1cc9b.firebasestorage.app",
    messagingSenderId: "571911578084",
    appId: "1:571911578084:web:63f7ccc8f6f406ad04a7f1",
    measurementId: "G-54YEJPXV65"
};

// Check if Firebase is configured
export function isFirebaseConfigured() {
    return firebaseConfig.apiKey !== "" && firebaseConfig.projectId !== "";
}
