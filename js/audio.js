// ===== Audio Effects using Web Audio API =====
// Rich, satisfying synthesized sounds — no external files needed

let audioCtx = null;
let enabled = true;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function ensureResumed() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

export function setAudioEnabled(val) { enabled = val; }
export function isAudioEnabled() { return enabled; }

// --- Helpers ---

function createReverb(ctx, duration = 1.5, decay = 2) {
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
}

function playTone(ctx, freq, type, startTime, duration, volume, dest) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + duration);
}

// --- Sound Definitions ---

export function playCorrect() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Warm major chord arpeggio with reverb
    const reverb = createReverb(ctx, 0.8, 3);
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.value = 0.7;
    wet.gain.value = 0.3;
    dry.connect(ctx.destination);
    reverb.connect(wet);
    wet.connect(ctx.destination);

    const mix = ctx.createGain();
    mix.connect(dry);
    mix.connect(reverb);

    // C5 → E5 → G5 with harmonics
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
        const t = now + i * 0.09;
        playTone(ctx, freq, 'sine', t, 0.45, 0.22, mix);
        playTone(ctx, freq * 2, 'sine', t, 0.3, 0.06, mix); // octave harmonic
    });
    // Sparkle on top
    playTone(ctx, 1567.98, 'sine', now + 0.27, 0.35, 0.08, mix);
}

export function playIncorrect() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Gentle descending minor second — not harsh
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(330, now);
    osc1.frequency.linearRampToValueAtTime(250, now + 0.25);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.18, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(g1);
    g1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Subtle low thud
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(150, now);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc2.connect(g2);
    g2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.2);
}

export function playComplete() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    const reverb = createReverb(ctx, 1.2, 2.5);
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.value = 0.65;
    wet.gain.value = 0.35;
    dry.connect(ctx.destination);
    reverb.connect(wet);
    wet.connect(ctx.destination);

    const mix = ctx.createGain();
    mix.connect(dry);
    mix.connect(reverb);

    // Triumphant fanfare — C major arpeggio up to high C
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        playTone(ctx, freq, 'sine', t, 0.6, 0.2, mix);
        playTone(ctx, freq * 1.5, 'sine', t + 0.02, 0.4, 0.05, mix); // fifth harmonic
    });

    // Final shimmer chord
    const shimmerTime = now + 0.5;
    [1046.5, 1318.5, 1567.98].forEach(f => {
        playTone(ctx, f, 'sine', shimmerTime, 0.8, 0.07, mix);
    });
}

export function playClick() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Crisp tactile tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
}

export function playStreak() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    const reverb = createReverb(ctx, 1.5, 2);
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.value = 0.6;
    wet.gain.value = 0.4;
    dry.connect(ctx.destination);
    reverb.connect(wet);
    wet.connect(ctx.destination);

    const mix = ctx.createGain();
    mix.connect(dry);
    mix.connect(reverb);

    // Achievement sparkle cascade
    const sparkleNotes = [784, 988, 1175, 1318, 1568, 1760];
    sparkleNotes.forEach((freq, i) => {
        const t = now + i * 0.07;
        playTone(ctx, freq, 'sine', t, 0.4, 0.12, mix);
        playTone(ctx, freq * 0.5, 'sine', t, 0.5, 0.04, mix); // sub-octave warmth
    });

    // Final chord bloom
    const bloom = now + 0.45;
    [1568, 1976, 2349].forEach(f => {
        playTone(ctx, f, 'sine', bloom, 1.0, 0.05, mix);
    });
}

export function playMatchPair() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Satisfying pop with resonance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    // Tiny harmonic ping
    playTone(ctx, 1600, 'sine', now + 0.04, 0.1, 0.06, ctx.destination);
}

export function playCardFlip() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Soft whoosh + click
    const noise = ctx.createBufferSource();
    const bufLen = ctx.sampleRate * 0.08;
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);

    // Tiny pitched click
    playTone(ctx, 900, 'sine', now, 0.03, 0.08, ctx.destination);
}

export function playNavTap() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Very subtle soft tap
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 700;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
}

export function playLevelUp() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    const reverb = createReverb(ctx, 1.5, 2);
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    dry.gain.value = 0.6;
    wet.gain.value = 0.4;
    dry.connect(ctx.destination);
    reverb.connect(wet);
    wet.connect(ctx.destination);

    const mix = ctx.createGain();
    mix.connect(dry);
    mix.connect(reverb);

    // Majestic ascending power chord
    const chords = [
        { time: 0, freqs: [261.6, 329.6, 392] },       // C major
        { time: 0.2, freqs: [349.2, 440, 523.25] },     // F major
        { time: 0.4, freqs: [392, 493.9, 587.3] },      // G major
        { time: 0.6, freqs: [523.25, 659.25, 783.99] }, // C major (octave up)
    ];

    chords.forEach(({ time, freqs }) => {
        freqs.forEach(f => {
            playTone(ctx, f, 'sine', now + time, 0.7, 0.12, mix);
        });
    });

    // Final high sparkle
    playTone(ctx, 2093, 'sine', now + 0.8, 0.6, 0.06, mix);
    playTone(ctx, 2637, 'sine', now + 0.85, 0.5, 0.04, mix);
}

export function playXpGain() {
    if (!enabled) return;
    const ctx = ensureResumed();
    const now = ctx.currentTime;

    // Quick ascending ping — coin collect feel
    const notes = [880, 1108, 1318];
    notes.forEach((freq, i) => {
        const t = now + i * 0.06;
        playTone(ctx, freq, 'sine', t, 0.18, 0.14, ctx.destination);
    });
}
