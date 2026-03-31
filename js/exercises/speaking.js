import { speak, startListening, stopListening, isSTTSupported, isTTSSupported } from '../speech.js';
import { normalizeGerman, escapeHtml } from '../renderer.js';
import { playCorrect, playIncorrect, playClick } from '../audio.js';

export function renderSpeaking(container, exercise, onReady, onDirectAnswer) {
    const subtype = exercise.subtype || 'read-aloud';

    switch (subtype) {
        case 'read-aloud':
            renderReadAloud(container, exercise, onReady, onDirectAnswer);
            break;
        case 'repeat-after-me':
            renderRepeatAfterMe(container, exercise, onReady, onDirectAnswer);
            break;
        case 'answer-vocally':
            renderAnswerVocally(container, exercise, onReady, onDirectAnswer);
            break;
        default:
            container.innerHTML = `<p>Sottotipo parlato non supportato: ${subtype}</p>`;
    }
}

// --- Shared helpers ---

function compareResult(transcript, acceptable) {
    const norm = normalizeGerman(transcript);
    for (const ans of acceptable) {
        const normAns = normalizeGerman(ans);
        if (norm === normAns) return 'correct';
    }
    // Close match: check if at least 80% of words match
    const userWords = norm.split(' ').filter(w => w.length > 0);
    for (const ans of acceptable) {
        const ansWords = normalizeGerman(ans).split(' ').filter(w => w.length > 0);
        if (ansWords.length === 0) continue;
        const matched = ansWords.filter(w => userWords.includes(w)).length;
        if (matched / ansWords.length >= 0.8) return 'close';
    }
    return 'incorrect';
}

function partialMatch(transcript, patterns) {
    const norm = normalizeGerman(transcript);
    return patterns.some(p => norm.includes(normalizeGerman(p)));
}

function createMicButton() {
    const btn = document.createElement('button');
    btn.className = 'speaking-mic-btn';
    btn.title = 'Parla';
    btn.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
    `;
    return btn;
}

function createFallbackInput(placeholder = 'Scrivi la risposta qui...') {
    const wrapper = document.createElement('div');
    wrapper.className = 'speaking-fallback';
    wrapper.innerHTML = `
        <div class="speech-unsupported-banner">
            Il riconoscimento vocale non è disponibile. Scrivi la risposta.
        </div>
        <textarea class="speaking-fallback-input" placeholder="${placeholder}" rows="2" autocomplete="off" spellcheck="false"></textarea>
    `;
    return wrapper;
}

function showSpeakingFeedback(feedbackEl, result, transcript, correctText, explanation) {
    if (result === 'correct') {
        playCorrect();
        feedbackEl.innerHTML = `
            <div class="feedback feedback-correct">
                <div class="feedback-title">✅ Perfetto!</div>
                ${transcript ? `<div class="feedback-explanation">Hai detto: "${escapeHtml(transcript)}"</div>` : ''}
                ${explanation ? `<div class="feedback-explanation">${escapeHtml(explanation)}</div>` : ''}
            </div>
        `;
    } else if (result === 'close') {
        playCorrect();
        feedbackEl.innerHTML = `
            <div class="feedback feedback-correct">
                <div class="feedback-title">✅ Quasi perfetto!</div>
                ${transcript ? `<div class="feedback-explanation">Hai detto: "${escapeHtml(transcript)}"</div>` : ''}
                <div class="feedback-explanation">Testo corretto: <strong>${escapeHtml(correctText)}</strong></div>
                ${explanation ? `<div class="feedback-explanation">${escapeHtml(explanation)}</div>` : ''}
            </div>
        `;
    } else {
        playIncorrect();
        feedbackEl.innerHTML = `
            <div class="feedback feedback-incorrect">
                <div class="feedback-title">❌ Riprova</div>
                ${transcript ? `<div class="feedback-explanation">Hai detto: "${escapeHtml(transcript)}"</div>` : ''}
                <div class="feedback-explanation">Testo corretto: <strong>${escapeHtml(correctText)}</strong></div>
                ${explanation ? `<div class="feedback-explanation">${escapeHtml(explanation)}</div>` : ''}
            </div>
        `;
    }
}

// --- Read Aloud ---

function renderReadAloud(container, exercise, onReady, onDirectAnswer) {
    const sttOk = isSTTSupported();

    container.innerHTML = `
        <div class="exercise-question">${exercise.question || 'Leggi ad alta voce:'}</div>
        <div class="speaking-text">${escapeHtml(exercise.text)}</div>
        ${exercise.translation ? `<div class="speaking-translation">${escapeHtml(exercise.translation)}</div>` : ''}
        ${exercise.hint ? `<div class="speaking-hint">${escapeHtml(exercise.hint)}</div>` : ''}
        ${isTTSSupported() ? `
            <button class="listening-play-btn-small speaking-listen-btn" title="Ascolta la pronuncia">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5z"/></svg>
                Ascolta prima
            </button>
        ` : ''}
        <div id="speaking-action"></div>
        <div id="speaking-status"></div>
        <div id="speaking-feedback"></div>
    `;

    const actionSlot = container.querySelector('#speaking-action');
    const statusEl = container.querySelector('#speaking-status');
    const feedbackEl = container.querySelector('#speaking-feedback');
    const listenBtn = container.querySelector('.speaking-listen-btn');

    if (listenBtn) {
        listenBtn.addEventListener('click', () => {
            listenBtn.classList.add('playing');
            speak(exercise.text).finally(() => listenBtn.classList.remove('playing'));
        });
    }

    const acceptable = exercise.acceptable || [exercise.text];

    if (sttOk) {
        const micBtn = createMicButton();
        actionSlot.appendChild(micBtn);
        let answered = false;

        micBtn.addEventListener('click', () => {
            if (answered) return;
            playClick();
            micBtn.classList.add('recording');
            statusEl.innerHTML = '<div class="speaking-status-text">Sto ascoltando...</div>';

            startListening('de-DE')
                .then(transcript => {
                    micBtn.classList.remove('recording');
                    statusEl.innerHTML = '';
                    const result = compareResult(transcript, acceptable);
                    answered = true;
                    showSpeakingFeedback(feedbackEl, result, transcript, exercise.text, exercise.explanation);
                    onDirectAnswer(result === 'correct' || result === 'close');
                })
                .catch(err => {
                    micBtn.classList.remove('recording');
                    if (err.message === 'NO_SPEECH') {
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Nessun suono rilevato. Riprova.</div>';
                    } else if (err.message === 'MIC_NOT_ALLOWED') {
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Permesso microfono negato. Abilita il microfono nelle impostazioni del browser.</div>';
                    } else {
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Errore nel riconoscimento vocale. Riprova.</div>';
                    }
                });
        });
    } else {
        // Fallback: text input
        const fallback = createFallbackInput('Scrivi la frase in tedesco...');
        actionSlot.appendChild(fallback);
        const textarea = fallback.querySelector('textarea');

        textarea.addEventListener('input', () => {
            if (textarea.value.trim().length > 0) {
                onReady(() => {
                    const result = compareResult(textarea.value, acceptable);
                    textarea.disabled = true;
                    showSpeakingFeedback(feedbackEl, result, null, exercise.text, exercise.explanation);
                    return result === 'correct' || result === 'close';
                });
            }
        });
    }
}

// --- Repeat After Me ---

function renderRepeatAfterMe(container, exercise, onReady, onDirectAnswer) {
    const sttOk = isSTTSupported();
    const ttsOk = isTTSSupported();

    container.innerHTML = `
        <div class="exercise-question">${exercise.question || 'Ascolta e ripeti:'}</div>
        ${exercise.translation ? `<div class="speaking-translation">${escapeHtml(exercise.translation)}</div>` : ''}
        <div id="repeat-phase"></div>
        <div id="speaking-status"></div>
        <div id="speaking-feedback"></div>
    `;

    const phaseEl = container.querySelector('#repeat-phase');
    const statusEl = container.querySelector('#speaking-status');
    const feedbackEl = container.querySelector('#speaking-feedback');
    const acceptable = exercise.acceptable || [exercise.text];

    if (ttsOk) {
        // Phase 1: Listen
        phaseEl.innerHTML = `
            <div class="repeat-phase-label">Fase 1: Ascolta</div>
            <button class="listening-play-btn repeat-play-btn" title="Ascolta">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.5 8.5 0 0014 3.23z"/></svg>
            </button>
        `;

        const playBtn = phaseEl.querySelector('.repeat-play-btn');

        // Auto-play
        playBtn.classList.add('playing');
        speak(exercise.text).then(() => {
            playBtn.classList.remove('playing');
            showPhase2();
        }).catch(() => {
            playBtn.classList.remove('playing');
            showPhase2();
        });

        playBtn.addEventListener('click', () => {
            playBtn.classList.add('playing');
            speak(exercise.text).finally(() => playBtn.classList.remove('playing'));
        });

        function showPhase2() {
            const phase2 = document.createElement('div');
            phase2.innerHTML = `
                <div class="repeat-phase-label">Fase 2: Ripeti</div>
                <div class="speaking-text">${escapeHtml(exercise.text)}</div>
            `;
            phaseEl.appendChild(phase2);

            if (sttOk) {
                const micBtn = createMicButton();
                phase2.appendChild(micBtn);
                let answered = false;

                micBtn.addEventListener('click', () => {
                    if (answered) return;
                    playClick();
                    micBtn.classList.add('recording');
                    statusEl.innerHTML = '<div class="speaking-status-text">Sto ascoltando...</div>';

                    startListening('de-DE')
                        .then(transcript => {
                            micBtn.classList.remove('recording');
                            statusEl.innerHTML = '';
                            const result = compareResult(transcript, acceptable);
                            answered = true;
                            showSpeakingFeedback(feedbackEl, result, transcript, exercise.text, exercise.explanation);
                            onDirectAnswer(result === 'correct' || result === 'close');
                        })
                        .catch(err => {
                            micBtn.classList.remove('recording');
                            if (err.message === 'NO_SPEECH') {
                                statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Nessun suono rilevato. Riprova.</div>';
                            } else {
                                statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Errore. Riprova.</div>';
                            }
                        });
                });
            } else {
                const fallback = createFallbackInput('Scrivi la frase...');
                phase2.appendChild(fallback);
                const textarea = fallback.querySelector('textarea');

                textarea.addEventListener('input', () => {
                    if (textarea.value.trim().length > 0) {
                        onReady(() => {
                            const result = compareResult(textarea.value, acceptable);
                            textarea.disabled = true;
                            showSpeakingFeedback(feedbackEl, result, null, exercise.text, exercise.explanation);
                            return result === 'correct' || result === 'close';
                        });
                    }
                });
            }
        }
    } else {
        // No TTS: just show text directly and let user speak/type
        phaseEl.innerHTML = `
            <div class="speaking-text">${escapeHtml(exercise.text)}</div>
        `;

        if (sttOk) {
            const micBtn = createMicButton();
            phaseEl.appendChild(micBtn);
            let answered = false;

            micBtn.addEventListener('click', () => {
                if (answered) return;
                playClick();
                micBtn.classList.add('recording');
                statusEl.innerHTML = '<div class="speaking-status-text">Sto ascoltando...</div>';

                startListening('de-DE')
                    .then(transcript => {
                        micBtn.classList.remove('recording');
                        statusEl.innerHTML = '';
                        const result = compareResult(transcript, acceptable);
                        answered = true;
                        showSpeakingFeedback(feedbackEl, result, transcript, exercise.text, exercise.explanation);
                        onDirectAnswer(result === 'correct' || result === 'close');
                    })
                    .catch(() => {
                        micBtn.classList.remove('recording');
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Errore. Riprova.</div>';
                    });
            });
        } else {
            const fallback = createFallbackInput('Scrivi la frase...');
            phaseEl.appendChild(fallback);
            const textarea = fallback.querySelector('textarea');

            textarea.addEventListener('input', () => {
                if (textarea.value.trim().length > 0) {
                    onReady(() => {
                        const result = compareResult(textarea.value, acceptable);
                        textarea.disabled = true;
                        showSpeakingFeedback(feedbackEl, result, null, exercise.text, exercise.explanation);
                        return result === 'correct' || result === 'close';
                    });
                }
            });
        }
    }
}

// --- Answer Vocally ---

function renderAnswerVocally(container, exercise, onReady, onDirectAnswer) {
    const sttOk = isSTTSupported();
    const ttsOk = isTTSSupported();

    container.innerHTML = `
        <div class="exercise-question">${exercise.question || 'Rispondi a voce in tedesco:'}</div>
        ${exercise.prompt_audio && ttsOk ? `
            <div class="listening-controls">
                <button class="listening-play-btn" id="prompt-play" title="Ascolta la domanda">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 8.5v7a4.47 4.47 0 002.5-3.5zM14 3.23v2.06a6.51 6.51 0 010 13.42v2.06A8.5 8.5 0 0014 3.23z"/></svg>
                </button>
            </div>
        ` : ''}
        ${exercise.prompt_audio && !ttsOk ? `<div class="listening-fallback-text">"${escapeHtml(exercise.prompt_audio)}"</div>` : ''}
        <div id="speaking-action"></div>
        <div id="speaking-status"></div>
        <div id="speaking-feedback"></div>
    `;

    const actionSlot = container.querySelector('#speaking-action');
    const statusEl = container.querySelector('#speaking-status');
    const feedbackEl = container.querySelector('#speaking-feedback');

    // Play prompt audio
    const promptPlayBtn = container.querySelector('#prompt-play');
    if (promptPlayBtn && exercise.prompt_audio) {
        speak(exercise.prompt_audio);
        promptPlayBtn.addEventListener('click', () => {
            promptPlayBtn.classList.add('playing');
            speak(exercise.prompt_audio).finally(() => promptPlayBtn.classList.remove('playing'));
        });
    }

    if (sttOk) {
        const micBtn = createMicButton();
        actionSlot.appendChild(micBtn);
        let answered = false;

        micBtn.addEventListener('click', () => {
            if (answered) return;
            playClick();
            micBtn.classList.add('recording');
            statusEl.innerHTML = '<div class="speaking-status-text">Sto ascoltando...</div>';

            startListening('de-DE')
                .then(transcript => {
                    micBtn.classList.remove('recording');
                    statusEl.innerHTML = '';
                    answered = true;

                    const isCorrect = partialMatch(transcript, exercise.acceptable);
                    if (isCorrect) {
                        playCorrect();
                        feedbackEl.innerHTML = `
                            <div class="feedback feedback-correct">
                                <div class="feedback-title">✅ Bravo!</div>
                                <div class="feedback-explanation">Hai detto: "${escapeHtml(transcript)}"</div>
                                ${exercise.explanation ? `<div class="feedback-explanation">${escapeHtml(exercise.explanation)}</div>` : ''}
                            </div>
                        `;
                    } else {
                        playIncorrect();
                        feedbackEl.innerHTML = `
                            <div class="feedback feedback-incorrect">
                                <div class="feedback-title">❌ Non corretto</div>
                                <div class="feedback-explanation">Hai detto: "${escapeHtml(transcript)}"</div>
                                ${exercise.explanation ? `<div class="feedback-explanation">${escapeHtml(exercise.explanation)}</div>` : ''}
                            </div>
                        `;
                    }
                    onDirectAnswer(isCorrect);
                })
                .catch(err => {
                    micBtn.classList.remove('recording');
                    if (err.message === 'NO_SPEECH') {
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Nessun suono rilevato. Riprova.</div>';
                    } else if (err.message === 'MIC_NOT_ALLOWED') {
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Permesso microfono negato.</div>';
                    } else {
                        statusEl.innerHTML = '<div class="speaking-status-text speaking-status-error">Errore. Riprova.</div>';
                    }
                });
        });
    } else {
        const fallback = createFallbackInput('Scrivi la risposta in tedesco...');
        actionSlot.appendChild(fallback);
        const textarea = fallback.querySelector('textarea');

        textarea.addEventListener('input', () => {
            if (textarea.value.trim().length > 0) {
                onReady(() => {
                    textarea.disabled = true;
                    const isCorrect = partialMatch(textarea.value, exercise.acceptable);
                    if (isCorrect) {
                        playCorrect();
                        feedbackEl.innerHTML = `
                            <div class="feedback feedback-correct">
                                <div class="feedback-title">✅ Bravo!</div>
                                ${exercise.explanation ? `<div class="feedback-explanation">${escapeHtml(exercise.explanation)}</div>` : ''}
                            </div>
                        `;
                    } else {
                        playIncorrect();
                        feedbackEl.innerHTML = `
                            <div class="feedback feedback-incorrect">
                                <div class="feedback-title">❌ Non corretto</div>
                                ${exercise.explanation ? `<div class="feedback-explanation">${escapeHtml(exercise.explanation)}</div>` : ''}
                            </div>
                        `;
                    }
                    return isCorrect;
                });
            }
        });
    }
}
