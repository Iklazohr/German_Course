import { shuffleArray } from '../renderer.js';
import { playMatchPair, playCorrect, playIncorrect } from '../audio.js';

export function renderMatching(container, exercise, onReady, onDirectAnswer) {
    const pairs = exercise.pairs;
    const leftItems = pairs.map((p, i) => ({ text: p.left, idx: i }));
    const rightItems = shuffleArray(pairs.map((p, i) => ({ text: p.right, idx: i })));

    let selectedLeft = null;
    let matchedCount = 0;
    const totalPairs = pairs.length;

    container.innerHTML = `
        <div class="exercise-question">${exercise.instruction || 'Collega le coppie corrette:'}</div>
        <div class="matching-container">
            <div class="matching-column" id="match-left">
                ${leftItems.map(item => `
                    <div class="matching-item" data-side="left" data-idx="${item.idx}">${item.text}</div>
                `).join('')}
            </div>
            <div class="matching-column" id="match-right">
                ${rightItems.map(item => `
                    <div class="matching-item" data-side="right" data-idx="${item.idx}">${item.text}</div>
                `).join('')}
            </div>
        </div>
        <div id="match-feedback"></div>
    `;

    const allItems = container.querySelectorAll('.matching-item');

    allItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('matched')) return;

            const side = item.dataset.side;
            const idx = parseInt(item.dataset.idx);

            if (side === 'left') {
                // Select left item
                container.querySelectorAll('[data-side="left"]').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                selectedLeft = idx;
            } else if (selectedLeft !== null) {
                // Try to match
                if (idx === selectedLeft) {
                    // Correct match
                    item.classList.add('matched');
                    container.querySelector(`[data-side="left"][data-idx="${selectedLeft}"]`).classList.add('matched');
                    container.querySelector(`[data-side="left"][data-idx="${selectedLeft}"]`).classList.remove('selected');
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
                    // Wrong match
                    playIncorrect();
                    item.classList.add('wrong');
                    setTimeout(() => item.classList.remove('wrong'), 400);
                }
            }
        });
    });
}
