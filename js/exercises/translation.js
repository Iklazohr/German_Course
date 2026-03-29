import { checkTranslation } from '../renderer.js';
import { playCorrect, playIncorrect } from '../audio.js';

export function renderTranslation(container, exercise, onReady, onDirectAnswer) {
    const direction = exercise.direction || 'it-to-de';
    const sourceLabel = direction === 'it-to-de' ? 'Traduci in tedesco:' : 'Traduci in italiano:';

    container.innerHTML = `
        <div class="exercise-question">${sourceLabel}</div>
        <div class="translation-source">${exercise.source}</div>
        <textarea class="translation-input" placeholder="Scrivi la traduzione qui..." rows="2" autocomplete="off" spellcheck="false"></textarea>
        ${exercise.hint ? `
            <div class="translation-hint" id="show-hint" style="cursor:pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>Mostra suggerimento</span>
            </div>
        ` : ''}
        <div id="trans-feedback"></div>
    `;

    const textarea = container.querySelector('.translation-input');
    const feedbackEl = container.querySelector('#trans-feedback');
    const hintEl = container.querySelector('#show-hint');

    if (hintEl) {
        hintEl.addEventListener('click', () => {
            hintEl.innerHTML = `<span style="font-style:italic">${exercise.hint}</span>`;
            hintEl.style.cursor = 'default';
        });
    }

    textarea.focus();

    textarea.addEventListener('input', () => {
        if (textarea.value.trim().length > 0) {
            onReady(() => {
                const result = checkTranslation(textarea.value, exercise.acceptable);
                textarea.disabled = true;

                if (result === 'correct') {
                    playCorrect();
                    textarea.classList.add('correct');
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-correct">
                            <div class="feedback-title">✅ Corretto!</div>
                            ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                        </div>
                    `;
                    return true;
                } else if (result === 'close') {
                    playCorrect();
                    textarea.classList.add('correct');
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-correct">
                            <div class="feedback-title">✅ Quasi perfetto!</div>
                            <div class="feedback-explanation">La risposta esatta è: <strong>${exercise.acceptable[0]}</strong></div>
                            ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                        </div>
                    `;
                    return true;
                } else {
                    playIncorrect();
                    textarea.classList.add('incorrect');
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-incorrect">
                            <div class="feedback-title">❌ Non corretto</div>
                            <div class="feedback-explanation">Risposta corretta: <strong>${exercise.acceptable[0]}</strong></div>
                            ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                        </div>
                    `;
                    return false;
                }
            });
        }
    });
}
