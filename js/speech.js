// speech.js — Web Speech API wrapper for German TTS and STT

let germanVoice = null;
let voicesLoaded = false;

function loadVoices() {
    const voices = speechSynthesis.getVoices();
    germanVoice = voices.find(v => v.lang.startsWith('de')) || null;
    voicesLoaded = voices.length > 0;
}

export function isTTSSupported() {
    return 'speechSynthesis' in window;
}

export function isSTTSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function getGermanVoice() {
    if (!isTTSSupported()) return null;
    if (!voicesLoaded) loadVoices();
    return germanVoice;
}

// Initialize voices (they load asynchronously in some browsers)
if (isTTSSupported()) {
    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/**
 * Speak German text using SpeechSynthesis.
 * Returns a Promise that resolves when speech ends.
 */
export function speak(text, lang = 'de-DE', rate = 1.0) {
    return new Promise((resolve, reject) => {
        if (!isTTSSupported()) {
            reject(new Error('TTS_NOT_SUPPORTED'));
            return;
        }

        // Cancel any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Prefer a German voice if available
        const voice = getGermanVoice();
        if (voice) utterance.voice = voice;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => {
            if (e.error === 'canceled') resolve();
            else reject(new Error(e.error || 'TTS_ERROR'));
        };

        speechSynthesis.speak(utterance);

        // Chrome bug: long utterances get stuck. Resume periodically.
        const keepAlive = setInterval(() => {
            if (!speechSynthesis.speaking) {
                clearInterval(keepAlive);
            } else {
                speechSynthesis.pause();
                speechSynthesis.resume();
            }
        }, 10000);

        utterance.onend = () => { clearInterval(keepAlive); resolve(); };
    });
}

/**
 * Speak text slowly (rate 0.7).
 */
export function speakSlow(text) {
    return speak(text, 'de-DE', 0.7);
}

/**
 * Stop any ongoing speech.
 */
export function stopSpeaking() {
    if (isTTSSupported()) speechSynthesis.cancel();
}

// --- Speech-to-Text ---

let activeRecognition = null;

/**
 * Start listening for German speech.
 * Returns a Promise that resolves with the transcript string.
 */
export function startListening(lang = 'de-DE') {
    return new Promise((resolve, reject) => {
        if (!isSTTSupported()) {
            reject(new Error('STT_NOT_SUPPORTED'));
            return;
        }

        // Stop any previous session
        stopListening();

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = lang;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        activeRecognition = recognition;

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            activeRecognition = null;
            resolve(transcript);
        };

        recognition.onerror = (event) => {
            activeRecognition = null;
            if (event.error === 'no-speech') {
                reject(new Error('NO_SPEECH'));
            } else if (event.error === 'network') {
                reject(new Error('STT_OFFLINE'));
            } else if (event.error === 'not-allowed') {
                reject(new Error('MIC_NOT_ALLOWED'));
            } else {
                reject(new Error(event.error || 'STT_ERROR'));
            }
        };

        recognition.onend = () => {
            // If no result was returned, onresult won't fire
            if (activeRecognition === recognition) {
                activeRecognition = null;
                reject(new Error('NO_SPEECH'));
            }
        };

        recognition.start();
    });
}

/**
 * Stop active speech recognition.
 */
export function stopListening() {
    if (activeRecognition) {
        try { activeRecognition.abort(); } catch (e) { /* ignore */ }
        activeRecognition = null;
    }
}
