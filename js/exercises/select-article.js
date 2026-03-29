import { playCorrect, playIncorrect, playClick } from '../audio.js';

export function renderSelectArticle(container, exercise, onReady, onDirectAnswer) {
    let answeredCount = 0;
    let correctCount = 0;
    const totalItems = exercise.items.length;

    container.innerHTML = `
        <div class="exercise-question">${exercise.instruction || 'Scegli l\'articolo corretto per ogni sostantivo:'}</div>
        <div class="article-items">
            ${exercise.items.map((item, i) => `
                <div class="article-item" data-item="${i}">
                    <div class="article-noun">___ ${item.noun}</div>
                    <div class="article-options">
                        ${item.options.map(opt => `
                            <button class="article-btn" data-item="${i}" data-article="${opt}">${opt}</button>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        <div id="article-feedback"></div>
    `;

    const feedbackEl = container.querySelector('#article-feedback');

    container.querySelectorAll('.article-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const itemIdx = parseInt(btn.dataset.item);
            const item = exercise.items[itemIdx];
            const article = btn.dataset.article;
            const isCorrect = article === item.correct;

            // Disable all buttons for this item
            const itemEl = container.querySelector(`.article-item[data-item="${itemIdx}"]`);
            itemEl.querySelectorAll('.article-btn').forEach(b => {
                b.classList.add('disabled');
                if (b.dataset.article === item.correct) {
                    b.classList.add('correct');
                }
            });

            if (!isCorrect) {
                btn.classList.add('incorrect');
            }

            // Update noun display
            const nounEl = itemEl.querySelector('.article-noun');
            nounEl.textContent = `${item.correct} ${item.noun}`;
            nounEl.style.color = isCorrect ? 'var(--success)' : 'var(--error)';

            answeredCount++;
            if (isCorrect) correctCount++;

            playClick();
            if (answeredCount === totalItems) {
                const allCorrect = correctCount === totalItems;
                if (allCorrect) {
                    playCorrect();
                } else {
                    playIncorrect();
                }
                if (allCorrect) {
                    feedbackEl.innerHTML = '<div class="feedback feedback-correct">Tutti gli articoli sono corretti!</div>';
                } else {
                    feedbackEl.innerHTML = `
                        <div class="feedback feedback-incorrect">
                            <div class="feedback-title">${correctCount}/${totalItems} corretti</div>
                            <div class="feedback-explanation">Rivedi gli articoli evidenziati in rosso.</div>
                        </div>
                    `;
                }
                onDirectAnswer(allCorrect);
            }
        });
    });
}
