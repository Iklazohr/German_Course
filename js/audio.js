// ===== Audio Effects using Web Audio API =====
// No external files needed - all sounds are synthesized

let audioCtx = null;
let enabled = true;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

// Resume audio context on first user interaction (required by browsers)
function ensureResumed() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    return ctx;
}

export function setAudioEnabled(val) {
    enabled = val;
}

export function isAudioEnabled() {
    return enabled;
}

// --- Sound Definitions ---

export function playCorrect() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Ascending two-tone chime
    [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.4);
    });
}

export function playIncorrect() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Low buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(185, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.3);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
}

export function playComplete() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Fanfare: ascending arpeggio
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + i * 0.1;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    });
}

export function playClick() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Subtle tick
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
}

export function playStreak() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Achievement sparkle
    [784, 988, 1175, 1318, 1568].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = now + i * 0.08;
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    });
}

export function playMatchPair() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Quick pop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
}
