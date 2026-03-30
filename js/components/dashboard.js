import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

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
        <div class="hero">
            <h2>Willkommen! 🇩🇪</h2>
            <p>Impara il tedesco passo dopo passo, dal livello A1 al C1</p>
            ${nextLesson ? `
                <button class="btn btn-lg" style="background:#fff;color:var(--primary)" id="continue-btn">
                    ${stats.completedLessons > 0 ? '📚 Continua a studiare' : '🚀 Inizia il corso'}
                </button>
            ` : `
                <p style="font-weight:600">🎉 Hai completato tutto il materiale disponibile!</p>
            `}
            <button class="share-btn" id="share-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Condividi
            </button>
        </div>

        <div class="stats-grid stagger-in">
            <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-value">${stats.streakDays}</div>
                <div class="stat-label">Giorni di fila</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📖</div>
                <div class="stat-value">${stats.completedLessons}</div>
                <div class="stat-label">Lezioni completate</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✏️</div>
                <div class="stat-value">${stats.totalExercises}</div>
                <div class="stat-label">Esercizi svolti</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">${accuracy}%</div>
                <div class="stat-label">Precisione</div>
            </div>
        </div>

        ${nextLesson ? `
            <div class="section-title">Prossima lezione</div>
            <div class="card card-clickable" id="next-lesson-card" style="margin-bottom:24px;border-left:4px solid var(--${nextLesson.id.split('-')[0]})">
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

        <div class="section-title">📊 I livelli del corso</div>
        <div class="stagger-in">
        ${course.levels.map(level => {
            const completion = store.getLevelCompletion(level.id, course);
            const totalLessons = level.units.reduce((sum, u) => sum + u.lessons.length + (u.review ? 1 : 0), 0);
            return `
                <div class="card card-clickable level-card" data-level="${level.id}"
                     style="--level-color:var(--${level.id});--level-color-light:var(--${level.id}-light)">
                    <div class="level-badge">${level.id.toUpperCase()}</div>
                    <div class="level-info">
                        <div class="level-title">${level.title}</div>
                        <div class="level-desc">${level.description} · ${totalLessons} lezioni</div>
                        <div class="progress-bar" style="--level-color:var(--${level.id})">
                            <div class="progress-bar-fill" style="width:${completion}%"></div>
                        </div>
                    </div>
                    <div class="level-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                </div>
            `;
        }).join('')}
        </div>
    `);

    // Event listeners
    const continueBtn = page.querySelector('#continue-btn');
    if (continueBtn && nextLesson) {
        continueBtn.addEventListener('click', () => {
            const route = nextLesson.type === 'exercise' || nextLesson.type === 'review'
                ? `/exercise/${nextLesson.id}`
                : `/lesson/${nextLesson.id}`;
            navigate(route);
        });
    }

    const nextCard = page.querySelector('#next-lesson-card');
    if (nextCard && nextLesson) {
        nextCard.addEventListener('click', () => {
            const route = nextLesson.type === 'exercise' || nextLesson.type === 'review'
                ? `/exercise/${nextLesson.id}`
                : `/lesson/${nextLesson.id}`;
            navigate(route);
        });
    }

    page.querySelector('#share-btn')?.addEventListener('click', async () => {
        const shareData = {
            title: 'Tedesco Facile',
            text: 'Impara il tedesco dall\'italiano con questo corso gratuito da A1 a C1!',
            url: 'https://german-course-1cc9b.web.app'
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                const btn = page.querySelector('#share-btn');
                btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Link copiato!';
                setTimeout(() => {
                    btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg> Condividi';
                }, 2000);
            }
        } catch {}
    });

    page.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => {
            navigate(`/level/${card.dataset.level}`);
        });
    });
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
