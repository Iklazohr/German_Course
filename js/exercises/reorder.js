import { shuffleArray } from '../renderer.js';
import { playCorrect, playIncorrect, playClick } from '../audio.js';

export function renderReorder(container, exercise, onReady, onDirectAnswer) {
    const words = shuffleArray(exercise.words);
    let answerWords = [];

    container.innerHTML = `
        <div class="exercise-question">${exercise.instruction || 'Metti le parole nell\'ordine corretto:'}</div>
        ${exercise.translation ? `<div class="exercise-translation">${exercise.translation}</div>` : ''}
        <div class="reorder-answer" id="reorder-answer"></div>
        <div style="margin:8px 0;text-align:center;font-size:0.75rem;color:var(--text-tertiary)">Tocca le parole per aggiungerle alla frase</div>
        <div class="reorder-words" id="reorder-source">
            ${words.map((w, i) => `<span class="reorder-word" data-idx="${i}" data-word="${w}">${w}</span>`).join('')}
        </div>
        <div id="reorder-feedback"></div>
    `;

    const sourceEl = container.querySelector('#reorder-source');
    const answerEl = container.querySelector('#reorder-answer');
    const feedbackEl = container.querySelector('#reorder-feedback');

    function updateAnswer() {
        answerEl.innerHTML = answerWords.map((w, i) =>
            `<span class="reorder-word" data-answer-idx="${i}">${w}</span>`
        ).join('');

        // Add click to remove from answer
        answerEl.querySelectorAll('.reorder-word').forEach(el => {
            el.addEventListener('click', () => {
                const aidx = parseInt(el.dataset.answerIdx);
                const word = answerWords[aidx];
                answerWords.splice(aidx, 1);

                // Unplace in source
                const sourceWord = sourceEl.querySelector(`.reorder-word.placed[data-word="${CSS.escape(word)}"]`);
                if (sourceWord) sourceWord.classList.remove('placed');

                updateAnswer();
            });
        });

        // Check if all words are placed
        if (answerWords.length === words.length) {
            onReady(() => {
                const userSentence = answerWords.join(' ');
                const isCorrect = userSentence === exercise.correct;

                answerEl.classList.add(isCorrect ? 'correct' : 'incorrect');

                if (isCorrect) {
                    playCorrect();
                    feedbackEl.innerHTML = '<div class="feedback feedback-correct">Corretto!</div>';
                } else {
                    playIncorrect();
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-incorrect">
                            <div class="feedback-title">Non corretto</div>
                            <div class="feedback-explanation">Ordine corretto: <strong>${exercise.correct}</strong></div>
                        </div>
                    `;
                }

                return isCorrect;
            });
        }
    }

    // Click to add word to answer
    sourceEl.querySelectorAll('.reorder-word').forEach(el => {
        el.addEventListener('click', () => {
            if (el.classList.contains('placed')) return;
            playClick();
            el.classList.add('placed');
            answerWords.push(el.dataset.word);
            updateAnswer();
        });
    });
}
