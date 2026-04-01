import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { animateHeroEntrance, animateStaggerChildren } from '../animations.js';

export async function renderDashboard() {
    setHeaderTitle('Tedesco Facile');
    showBackButton(false);

    const course = await loadCourseStructure();
    if (!course) {
        renderPage('<div class="empty-state"><p>Errore nel caricamento del corso.</p></div>');
        return;
    }

    const stats = store.getStats();
    const currentLesson = store.getCurrentLesson();

    // Find next lesson to study
    let nextLesson = null;
    let nextLessonTitle = '';
    let nextLessonLevel = '';
    outer:
    for (const level of course.levels) {
        for (const unit of level.units) {
            for (const lesson of unit.lessons) {
                if (!store.isCompleted(lesson.id)) {
                    nextLesson = lesson;
                    nextLessonLevel = level.id.toUpperCase();
                    nextLessonTitle = lesson.title;
                    break outer;
                }
            }
        }
    }

    const accuracy = stats.totalExercises > 0 ? Math.round((stats.totalCorrect / stats.totalExercises) * 100) : 0;

    const page = renderPage(`
        <div class="dashboard-content">
            <div class="hero">
                <div class="hero-glow"></div>
                <div class="hero-content">
                    <div class="hero-badge">Corso A1–C1</div>
                    <h2>Impara il tedesco,<br>una lezione alla volta.</h2>
                    ${!nextLesson ? `
                        <p class="hero-complete">Hai completato tutto il materiale disponibile!</p>
                    ` : ''}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.streakDays}</div>
                    <div class="stat-label">Giorni di fila</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.completedLessons}</div>
                    <div class="stat-label">Lezioni completate</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalExercises}</div>
                    <div class="stat-label">Esercizi svolti</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${accuracy}%</div>
                    <div class="stat-label">Precisione</div>
                </div>
            </div>

            ${nextLesson ? `
                <div class="section-title">Prossima lezione</div>
                <div class="card card-clickable level-card" id="next-lesson-card" style="--level-color:var(--${nextLesson.id.split('-')[0]});margin-bottom:24px">
                    <div style="display:flex;align-items:center;gap:12px">
                        <div class="lesson-icon ${nextLesson.type}">
                            ${getTypeIcon(nextLesson.type)}
                        </div>
                        <div class="lesson-info">
                            <div class="lesson-title">${nextLessonTitle}</div>
                            <div class="lesson-meta">${nextLessonLevel} · ${getTypeName(nextLesson.type)}</div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                </div>
            ` : ''}
        </div>
    `);

    // Disable scroll on app-main for dashboard (content fits in viewport)
    const appMain = document.getElementById('app-main');
    appMain.classList.add('no-scroll');

    // Trigger Motion.js animations
    animateHeroEntrance(page.querySelector('.hero'));
    animateStaggerChildren(page, '.stat-card', { delay: 0.08, startDelay: 0.3 });
    // Event listeners
    const nextCard = page.querySelector('#next-lesson-card');
    if (nextCard && nextLesson) {
        nextCard.addEventListener('click', () => {
            const route = nextLesson.type === 'exercise' || nextLesson.type === 'review'
                ? `/exercise/${nextLesson.id}`
                : `/lesson/${nextLesson.id}`;
            navigate(route);
        });
    }

}

function getTypeIcon(type) {
    switch (type) {
        case 'grammar': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
        case 'vocab': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
        case 'exercise': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
        case 'review': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        default: return '';
    }
}

export function getTypeName(type) {
    switch (type) {
        case 'grammar': return 'Grammatica';
        case 'vocab': return 'Vocabolario';
        case 'exercise': return 'Esercizi';
        case 'review': return 'Test di revisione';
        default: return '';
    }
}
