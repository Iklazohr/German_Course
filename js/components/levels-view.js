import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { getTypeName } from './dashboard.js';

export async function renderLevels() {
    setHeaderTitle('Corso');
    showBackButton(false);

    const course = await loadCourseStructure();
    if (!course) return;

    const page = renderPage(`
        <h2 style="margin-bottom:16px">Scegli il tuo livello</h2>
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
                        <div class="progress-text">${completion}% completato</div>
                    </div>
                    <div class="level-arrow">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                    </div>
                </div>
            `;
        }).join('')}
    `);

    page.querySelectorAll('.level-card').forEach(card => {
        card.addEventListener('click', () => navigate(`/level/${card.dataset.level}`));
    });
}

export async function renderLevel(levelId) {
    const course = await loadCourseStructure();
    if (!course) return;

    const level = course.levels.find(l => l.id === levelId);
    if (!level) { navigate('/levels'); return; }

    setHeaderTitle(level.title);
    showBackButton(true, () => navigate('/levels'));

    const page = renderPage(`
        <div style="margin-bottom:20px;--level-color:var(--${level.id});--level-color-light:var(--${level.id}-light)">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                <div class="level-badge" style="width:44px;height:44px;border-radius:var(--radius-md);background:var(--level-color-light);color:var(--level-color);display:flex;align-items:center;justify-content:center;font-weight:700">${level.id.toUpperCase()}</div>
                <div>
                    <h2 style="font-size:1.25rem">${level.title}</h2>
                    <p class="text-secondary" style="font-size:0.875rem">${level.description}</p>
                </div>
            </div>
            <div class="progress-bar"><div class="progress-bar-fill" style="width:${store.getLevelCompletion(levelId, course)}%"></div></div>
        </div>

        ${level.units.map((unit, idx) => `
            <div class="unit-section" style="--level-color:var(--${level.id});--level-color-light:var(--${level.id}-light)">
                <div class="unit-header${idx === 0 ? ' open' : ''}" data-unit="${idx}">
                    <div class="unit-icon">${idx + 1}</div>
                    <div class="unit-title">${unit.title}</div>
                    <svg class="unit-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                </div>
                <div class="unit-lessons"${idx === 0 ? ' style="display:block"' : ''}>
                    ${unit.lessons.map(lesson => {
                        const completed = store.isCompleted(lesson.id);
                        const score = store.getScore(lesson.id);
                        return `
                            <div class="lesson-item" data-id="${lesson.id}" data-type="${lesson.type}">
                                <div class="lesson-icon ${completed ? 'completed' : lesson.type}">
                                    ${completed
                                        ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
                                        : getLessonTypeIcon(lesson.type)}
                                </div>
                                <div class="lesson-info">
                                    <div class="lesson-title">${lesson.title}</div>
                                    <div class="lesson-meta">${getTypeName(lesson.type)}${score !== null ? ` · ${score}%` : ''}</div>
                                </div>
                                ${completed ? '<span class="lesson-check"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></span>' : ''}
                            </div>
                        `;
                    }).join('')}
                    ${unit.review ? `
                        <div class="lesson-item" data-id="${unit.review.id}" data-type="review" style="border-top:1px solid var(--border);margin-top:4px;padding-top:12px">
                            <div class="lesson-icon ${store.isCompleted(unit.review.id) ? 'completed' : 'review'}">
                                ${store.isCompleted(unit.review.id)
                                    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
                                    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'}
                            </div>
                            <div class="lesson-info">
                                <div class="lesson-title">${unit.review.title}</div>
                                <div class="lesson-meta">Test di revisione${store.getScore(unit.review.id) !== null ? ` · ${store.getScore(unit.review.id)}%` : ''}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    `);

    // Accordion toggle
    page.querySelectorAll('.unit-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('open');
            const lessons = header.nextElementSibling;
            lessons.style.display = header.classList.contains('open') ? 'block' : 'none';
        });
    });

    // Lesson click
    page.querySelectorAll('.lesson-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const type = item.dataset.type;
            if (type === 'exercise' || type === 'review') {
                navigate(`/exercise/${id}`);
            } else {
                navigate(`/lesson/${id}`);
            }
        });
    });
}

function getLessonTypeIcon(type) {
    switch (type) {
        case 'grammar': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>';
        case 'vocab': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
        case 'exercise': return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
        default: return '';
    }
}
