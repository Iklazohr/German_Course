import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure, loadData } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { playComplete, playStreak } from '../audio.js';
import { renderMultipleChoice } from '../exercises/multiple-choice.js';
import { renderFillBlank } from '../exercises/fill-blanks.js';
import { renderMatching } from '../exercises/matching.js';
import { renderTranslation } from '../exercises/translation.js';
import { renderReorder } from '../exercises/reorder.js';
import { renderSelectArticle } from '../exercises/select-article.js';
import { renderListening } from '../exercises/listening.js';
import { renderSpeaking } from '../exercises/speaking.js';

export async function renderExercise(exerciseId) {
    const course = await loadCourseStructure();
    if (!course) return;

    // Find exercise in course structure
    let exerciseMeta = null;
    let levelId = null;

    for (const level of course.levels) {
        for (const unit of level.units) {
            const allItems = [...unit.lessons, ...(unit.review ? [unit.review] : [])];
            for (const item of allItems) {
                if (item.id === exerciseId) {
                    exerciseMeta = item;
                    levelId = level.id;
                    break;
                }
            }
            if (exerciseMeta) break;
        }
        if (exerciseMeta) break;
    }

    if (!exerciseMeta) { navigate('/levels'); return; }

    const data = await loadData(exerciseMeta.file);
    if (!data || !data.exercises || data.exercises.length === 0) {
        renderPage('<div class="empty-state"><p>Esercizi non ancora disponibili.</p></div>');
        return;
    }

    setHeaderTitle(exerciseMeta.title);
    showBackButton(true, () => navigate(`/level/${levelId}`));

    let currentIdx = 0;
    let correctCount = 0;
    const total = data.exercises.length;

    function showExercise(idx) {
        if (idx >= total) {
            showSummary();
            return;
        }

        const exercise = data.exercises[idx];
        const page = renderPage(`
            <div class="exercise-page">
                <div class="exercise-header">
                    <div class="exercise-progress">
                        <div class="exercise-progress-bar">
                            <div class="exercise-progress-fill" style="width:${Math.round((idx / total) * 100)}%"></div>
                        </div>
                        <div class="exercise-count">${idx + 1}/${total}</div>
                    </div>
                </div>
                <div id="exercise-content"></div>
            </div>
            <div class="exercise-footer">
                <button class="btn btn-primary btn-block" id="exercise-check" disabled>Controlla</button>
            </div>
        `);

        const content = page.querySelector('#exercise-content');
        const checkBtn = page.querySelector('#exercise-check');
        let answered = false;
        let userCorrect = false;
        let checkAnswer = null;

        function onReady(checkFn) {
            checkAnswer = checkFn;
            checkBtn.disabled = false;
        }

        function onDirectAnswer(isCorrect) {
            if (answered) return;
            answered = true;
            userCorrect = isCorrect;
            if (isCorrect) correctCount++;
            checkBtn.textContent = 'Avanti';
            checkBtn.disabled = false;
        }

        // Render exercise by type
        switch (exercise.type) {
            case 'multiple-choice':
                renderMultipleChoice(content, exercise, onReady, onDirectAnswer);
                break;
            case 'fill-blank':
                renderFillBlank(content, exercise, onReady, onDirectAnswer);
                break;
            case 'matching':
                renderMatching(content, exercise, onReady, onDirectAnswer);
                break;
            case 'translation':
                renderTranslation(content, exercise, onReady, onDirectAnswer);
                break;
            case 'reorder':
                renderReorder(content, exercise, onReady, onDirectAnswer);
                break;
            case 'select-article':
                renderSelectArticle(content, exercise, onReady, onDirectAnswer);
                break;
            case 'listening':
                renderListening(content, exercise, onReady, onDirectAnswer);
                break;
            case 'speaking':
                renderSpeaking(content, exercise, onReady, onDirectAnswer);
                break;
            default:
                content.innerHTML = `<p>Tipo di esercizio non supportato: ${exercise.type}</p>`;
                checkBtn.disabled = false;
        }

        checkBtn.addEventListener('click', () => {
            if (!answered && checkAnswer) {
                answered = true;
                userCorrect = checkAnswer();
                if (userCorrect) correctCount++;
                checkBtn.textContent = 'Avanti';
            } else if (answered) {
                // Animate exercise out, then show next
                const exercisePage = page.querySelector('.exercise-page');
                if (exercisePage) {
                    exercisePage.classList.add('exercise-exit');
                    setTimeout(() => {
                        currentIdx++;
                        showExercise(currentIdx);
                    }, 250);
                } else {
                    currentIdx++;
                    showExercise(currentIdx);
                }
            }
        });

        // Enter key triggers check/advance
        page.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !checkBtn.disabled) {
                e.preventDefault();
                checkBtn.click();
            }
        });
    }

    function showSummary() {
        const pct = Math.round((correctCount / total) * 100);
        let scoreClass, message;

        let emoji;
        if (pct >= 90) {
            scoreClass = 'excellent';
            message = 'Eccellente! Ottimo lavoro!';
            emoji = '🏆';
        } else if (pct >= 70) {
            scoreClass = 'good';
            message = 'Molto bene! Continua così!';
            emoji = '⭐';
        } else if (pct >= 50) {
            scoreClass = 'needs-work';
            message = 'Non male, ma puoi migliorare!';
            emoji = '💪';
        } else {
            scoreClass = 'poor';
            message = 'Rivedi la lezione e riprova!';
            emoji = '📚';
        }

        store.completeLesson(exerciseId, pct);
        store.addExerciseStats(total, correctCount);
        if (typeof window.applySettings === 'function') window.applySettings();

        if (pct >= 90) playStreak(); else playComplete();

        const page = renderPage(`
            <div class="summary-card card">
                <div class="summary-emoji">${emoji}</div>
                <div class="summary-score ${scoreClass}">
                    ${pct}%
                    <span>${correctCount}/${total} corrette</span>
                </div>
                <div class="summary-message">${message}</div>
                <div class="summary-detail">Hai risposto correttamente a ${correctCount} domande su ${total}.</div>
                <div class="summary-actions">
                    <button class="btn btn-primary btn-block" id="summary-continue">Continua</button>
                    ${pct < 90 ? '<button class="btn btn-outline btn-block" id="summary-retry">Riprova</button>' : ''}
                </div>
            </div>
        `);

        page.querySelector('#summary-continue').addEventListener('click', () => {
            navigate(`/level/${levelId}`);
        });

        const retryBtn = page.querySelector('#summary-retry');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                currentIdx = 0;
                correctCount = 0;
                showExercise(0);
            });
        }
    }

    showExercise(0);
}
