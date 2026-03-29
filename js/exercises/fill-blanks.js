import { playCorrect, playIncorrect } from '../audio.js';

export function renderFillBlank(container, exercise, onReady, onDirectAnswer) {
    // Build sentence with blanks
    let sentenceHtml = exercise.sentence;
    const blanks = exercise.blanks || [];

    // Replace ___ with input fields
    let blankIdx = 0;
    sentenceHtml = sentenceHtml.replace(/___/g, () => {
        const hint = blanks[blankIdx]?.hint || '';
        const id = `blank-${blankIdx}`;
        blankIdx++;
        return `<input type="text" class="fill-blank-input" id="${id}" placeholder="${hint}" autocomplete="off" autocapitalize="sentences" spellcheck="false">`;
    });

    container.innerHTML = `
        <div class="exercise-question">${exercise.question || 'Completa la frase:'}</div>
        ${exercise.translation ? `<div class="exercise-translation">${exercise.translation}</div>` : ''}
        <div class="fill-sentence">${sentenceHtml}</div>
        <div id="fill-feedback"></div>
    `;

    const inputs = container.querySelectorAll('.fill-blank-input');
    const feedbackEl = container.querySelector('#fill-feedback');

    // Focus first input
    if (inputs.length > 0) inputs[0].focus();

    // Enable check when all blanks filled
    function checkReady() {
        const allFilled = Array.from(inputs).every(inp => inp.value.trim().length > 0);
        if (allFilled) {
            onReady(() => {
                let allCorrect = true;

                inputs.forEach((inp, i) => {
                    const blank = blanks[i];
                    if (!blank) return;

                    const userVal = inp.value.trim();
                    const correct = blank.correct || [];
                    const isCorrect = correct.some(c =>
                        c.toLowerCase() === userVal.toLowerCase()
                    );

                    inp.classList.add(isCorrect ? 'correct' : 'incorrect');
                    inp.disabled = true;

                    if (!isCorrect) allCorrect = false;
                });

                if (allCorrect) {
                    playCorrect();
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-correct">
                            <div class="feedback-title">✅ Corretto!</div>
                            ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                        </div>
                    `;
                } else {
                    playIncorrect();
                    const correctAnswers = blanks.map(b => (b.correct || [])[0] || b).join(', ');
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-incorrect">
                            <div class="feedback-title">❌ Non corretto</div>
                            <div class="feedback-explanation">Risposta corretta: <strong>${correctAnswers}</strong></div>
                            ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                        </div>
                    `;
                }

                return allCorrect;
            });
        }
    }

    inputs.forEach((inp, i) => {
        inp.addEventListener('input', checkReady);
        inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (i + 1 < inputs.length) {
                    inputs[i + 1].focus();
                } else {
                    checkReady();
                }
            }
        });
    });
}
