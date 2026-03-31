import { speak, speakSlow, isTTSSupported, stopSpeaking } from '../speech.js';
import { checkTranslation, shuffleArray, escapeHtml } from '../renderer.js';
import { playCorrect, playIncorrect, playMatchPair, playClick } from '../audio.js';

export function renderListening(container, exercise, onReady, onDirectAnswer) {
    const subtype = exercise.subtype || 'listen-choose';

    switch (subtype) {
        case 'listen-choose':
            renderListenChoose(container, exercise, onReady, onDirectAnswer);
            break;
        case 'dictation':
            renderDictation(container, exercise, onReady, onDirectAnswer);
            break;
        case 'listen-match':
            renderListenMatch(container, exercise, onReady, onDirectAnswer);
            break;
        default:
            container.innerHTML = `<p>Sottotipo ascolto non supportato: ${subtype}</p>`;
    }
}

// --- Shared UI helpers ---

function createPlayButton(text, label = 'Ascolta') {
    const ttsOk = isTTSSupported();
    const wrapper = document.createElement('div');
    wrapper.className = 'listening-controls';
    wrapper.innerHTML = `
        ${ttsOk ? `
            <button class="listening-play-btn" title="${label}">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.5 8.5 0 0014 3.23z"/></svg>
            </button>
            <button class="listening-slow-btn" title="Rallenta">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Lento
            </button>
        ` : `
            <div class="speech-unsupported-banner">
                Il tuo browser non supporta la sintesi vocale. Il testo viene mostrato direttamente.
            </div>
        `}
    `;

    if (ttsOk) {
        const playBtn = wrapper.querySelector('.listening-play-btn');
        const slowBtn = wrapper.querySelector('.listening-slow-btn');

        playBtn.addEventListener('click', () => {
            playBtn.classList.add('playing');
            speak(text).finally(() => playBtn.classList.remove('playing'));
        });

        slowBtn.addEventListener('click', () => {
            playBtn.classList.add('playing');
            speakSlow(text).finally(() => playBtn.classList.remove('playing'));
        });
    }

    return { wrapper, ttsOk };
}

// --- Listen & Choose ---

function renderListenChoose(container, exercise, onReady, onDirectAnswer) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    const { wrapper: controls, ttsOk } = createPlayButton(exercise.audio_text);

    container.innerHTML = `
        <div class="exercise-question">${exercise.question || 'Ascolta e scegli la risposta corretta:'}</div>
        <div id="listening-controls-slot"></div>
        ${!ttsOk ? `<div class="listening-fallback-text">"${escapeHtml(exercise.audio_text)}"</div>` : ''}
        <div class="mc-options">
            ${exercise.options.map((opt, i) => `
                <div class="mc-option" data-idx="${i}">
                    <div class="mc-marker">${letters[i]}</div>
                    <div>${escapeHtml(opt)}</div>
                </div>
            `).join('')}
        </div>
        <div id="listen-feedback"></div>
    `;

    container.querySelector('#listening-controls-slot').appendChild(controls);

    // Auto-play on load
    if (ttsOk) speak(exercise.audio_text);

    const options = container.querySelectorAll('.mc-option');
    const feedbackEl = container.querySelector('#listen-feedback');

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            stopSpeaking();
            const idx = parseInt(opt.dataset.idx);
            const isCorrect = idx === exercise.correct;

            options.forEach(o => {
                o.classList.add('disabled');
                if (parseInt(o.dataset.idx) === exercise.correct) o.classList.add('correct');
            });
            if (!isCorrect) opt.classList.add('incorrect');

            if (isCorrect) {
                playCorrect();
                feedbackEl.innerHTML = `
                    <div class="feedback feedback-correct">
                        <div class="feedback-title">✅ Corretto!</div>
                        ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                    </div>
                `;
            } else {
                playIncorrect();
                feedbackEl.innerHTML = `
                    <div class="feedback feedback-incorrect">
                        <div class="feedback-title">❌ Non corretto</div>
                        <div class="feedback-explanation">La risposta corretta è: <strong>${escapeHtml(exercise.options[exercise.correct])}</strong></div>
                        ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                    </div>
                `;
            }

            onDirectAnswer(isCorrect);
        });
    });
}

// --- Dictation ---

function renderDictation(container, exercise, onReady, onDirectAnswer) {
    const { wrapper: controls, ttsOk } = createPlayButton(exercise.audio_text);

    container.innerHTML = `
        <div class="exercise-question">${exercise.question || 'Ascolta e scrivi quello che senti:'}</div>
        <div id="listening-controls-slot"></div>
        ${!ttsOk ? `<div class="listening-fallback-text">"${escapeHtml(exercise.audio_text)}"</div>` : ''}
        ${exercise.hint ? `
            <div class="translation-hint" id="show-hint" style="cursor:pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Mostra suggerimento</span>
            </div>
        ` : ''}
        <textarea class="listening-dictation-input" placeholder="Scrivi quello che senti..." rows="2" autocomplete="off" spellcheck="false"></textarea>
        <div id="dictation-feedback"></div>
    `;

    container.querySelector('#listening-controls-slot').appendChild(controls);

    // Auto-play on load
    if (ttsOk) speak(exercise.audio_text);

    const textarea = container.querySelector('.listening-dictation-input');
    const feedbackEl = container.querySelector('#dictation-feedback');
    const hintEl = container.querySelector('#show-hint');

    if (hintEl) {
        hintEl.addEventListener('click', () => {
            hintEl.innerHTML = `<span style="font-style:italic">${escapeHtml(exercise.hint)}</span>`;
            hintEl.style.cursor = 'default';
        });
    }

    textarea.addEventListener('input', () => {
        if (textarea.value.trim().length > 0) {
            onReady(() => {
                stopSpeaking();
                const acceptable = exercise.acceptable || [exercise.audio_text];
                const result = checkTranslation(textarea.value, acceptable);
                textarea.disabled = true;

                if (result === 'correct' || result === 'close') {
                    playCorrect();
                    textarea.classList.add('correct');
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-correct">
                            <div class="feedback-title">${result === 'correct' ? '✅ Perfetto!' : '✅ Quasi perfetto!'}</div>
                            <div class="feedback-explanation">Testo: <strong>${escapeHtml(exercise.audio_text)}</strong></div>
                            ${exercise.translation ? `<div class="feedback-explanation">Traduzione: ${escapeHtml(exercise.translation)}</div>` : ''}
                        </div>
                    `;
                    return true;
                } else {
                    playIncorrect();
                    textarea.classList.add('incorrect');
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-incorrect">
                            <div class="feedback-title">❌ Non corretto</div>
                            <div class="feedback-explanation">Testo corretto: <strong>${escapeHtml(exercise.audio_text)}</strong></div>
                            ${exercise.translation ? `<div class="feedback-explanation">Traduzione: ${escapeHtml(exercise.translation)}</div>` : ''}
                        </div>
                    `;
                    return false;
                }
            });
        }
    });
}

// --- Listen & Match ---

function renderListenMatch(container, exercise, onReady, onDirectAnswer) {
    const pairs = exercise.pairs;
    const rightItems = shuffleArray(pairs.map((p, i) => ({ text: p.meaning, idx: i })));

    let selectedLeft = null;
    let matchedCount = 0;
    const totalPairs = pairs.length;

    container.innerHTML = `
        <div class="exercise-question">${exercise.instruction || 'Ascolta e abbina al significato corretto:'}</div>
        <div class="matching-container">
            <div class="matching-column" id="match-left">
                ${pairs.map((p, i) => `
                    <div class="matching-item listening-match-item" data-side="left" data-idx="${i}">
                        <button class="listening-play-btn-small" data-text="${escapeHtml(p.audio_text)}" title="Ascolta">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5z"/></svg>
                        </button>
                        ${!isTTSSupported() ? `<span class="listening-match-fallback">${escapeHtml(p.audio_text)}</span>` : `<span class="listening-match-label">Audio ${i + 1}</span>`}
                    </div>
                `).join('')}
            </div>
            <div class="matching-column" id="match-right">
                ${rightItems.map(item => `
                    <div class="matching-item" data-side="right" data-idx="${item.idx}">${escapeHtml(item.text)}</div>
                `).join('')}
            </div>
        </div>
        <div id="match-feedback"></div>
    `;

    // Play buttons
    container.querySelectorAll('.listening-play-btn-small').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isTTSSupported()) {
                btn.classList.add('playing');
                speak(btn.dataset.text).finally(() => btn.classList.remove('playing'));
            }
        });
    });

    const allItems = container.querySelectorAll('.matching-item');

    allItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('matched')) return;

            const side = item.dataset.side;
            const idx = parseInt(item.dataset.idx);

            if (side === 'left') {
                container.querySelectorAll('[data-side="left"]').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedLeft = idx;
                // Auto-play audio for selected item
                if (isTTSSupported()) {
                    const btn = item.querySelector('.listening-play-btn-small');
                    if (btn) speak(btn.dataset.text);
                }
            } else if (selectedLeft !== null) {
                if (idx === selectedLeft) {
                    item.classList.add('matched');
                    const leftEl = container.querySelector(`[data-side="left"][data-idx="${selectedLeft}"]`);
                    leftEl.classList.add('matched');
                    leftEl.classList.remove('selected');
                    matchedCount++;
                    selectedLeft = null;
                    playMatchPair();

                    if (matchedCount === totalPairs) {
                        playCorrect();
                        container.querySelector('#match-feedback').innerHTML =
                            '<div class="feedback feedback-correct">Tutte le coppie abbinate correttamente!</div>';
                        onDirectAnswer(true);
                    }
                } else {
                    playIncorrect();
                    item.classList.add('wrong');
                    setTimeout(() => item.classList.remove('wrong'), 400);
                }
            }
        });
    });
}
