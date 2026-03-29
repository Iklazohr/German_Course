export function renderMultipleChoice(container, exercise, onReady, onDirectAnswer) {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

    container.innerHTML = `
        <div class="exercise-question">${exercise.question}</div>
        <div class="mc-options">
            ${exercise.options.map((opt, i) => `
                <div class="mc-option" data-idx="${i}">
                    <div class="mc-marker">${letters[i]}</div>
                    <div>${opt}</div>
                </div>
            `).join('')}
        </div>
        <div id="mc-feedback"></div>
    `;

    const options = container.querySelectorAll('.mc-option');
    const feedbackEl = container.querySelector('#mc-feedback');

    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const idx = parseInt(opt.dataset.idx);
            const isCorrect = idx === exercise.correct;

            // Disable all options
            options.forEach(o => {
                o.classList.add('disabled');
                if (parseInt(o.dataset.idx) === exercise.correct) {
                    o.classList.add('correct');
                }
            });

            if (!isCorrect) {
                opt.classList.add('incorrect');
            }

            // Show feedback
            if (isCorrect) {
                feedbackEl.innerHTML = `<div class="feedback feedback-correct">Corretto!</div>`;
            } else {
                feedbackEl.innerHTML = `
                    <div class="feedback feedback-incorrect">
                        <div class="feedback-title">Non corretto</div>
                        ${exercise.explanation ? `<div class="feedback-explanation">${exercise.explanation}</div>` : ''}
                    </div>
                `;
            }

            onDirectAnswer(isCorrect);
        });
    });
}
