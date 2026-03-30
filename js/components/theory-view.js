// ===== Theory Library View =====

import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { getTypeName } from './dashboard.js';

const LEVEL_ICONS = { a1: '🌱', a2: '🌿', b1: '🌳', b2: '🔥', c1: '🎓' };

export async function renderTheory() {
    setHeaderTitle('Teoria');
    showBackButton(false);

    const course = await loadCourseStructure();
    if (!course) return;

    // Collect all grammar and vocab lessons across all levels
    const levels = course.levels.map(level => {
        const theoryLessons = [];
        for (const unit of level.units) {
            for (const lesson of unit.lessons) {
                if (lesson.type === 'grammar' || lesson.type === 'vocab') {
                    theoryLessons.push({
                        ...lesson,
                        unitTitle: unit.title,
                        completed: store.isCompleted(lesson.id)
                    });
                }
            }
        }
        const completedCount = theoryLessons.filter(l => l.completed).length;
        return { ...level, theoryLessons, completedCount };
    });

    const totalTheory = levels.reduce((s, l) => s + l.theoryLessons.length, 0);
    const totalCompleted = levels.reduce((s, l) => s + l.completedCount, 0);

    const page = renderPage(`
        <div class="theory-hero">
            <div class="theory-hero-icon">📖</div>
            <h2>Libreria di Teoria</h2>
            <p>${totalCompleted} / ${totalTheory} lezioni completate</p>
            <div class="fc-progress-bar" style="max-width:300px;margin:12px auto 0">
                <div class="fc-progress-fill" style="width:${totalTheory ? Math.round(totalCompleted / totalTheory * 100) : 0}%;background:var(--primary)"></div>
            </div>
        </div>

        <div class="theory-filters" id="theory-filters">
            <button class="fc-filter-btn active" data-filter="all">Tutte</button>
            <button class="fc-filter-btn" data-filter="grammar">Grammatica</button>
            <button class="fc-filter-btn" data-filter="vocab">Vocabolario</button>
            <button class="fc-filter-btn" data-filter="completed">Completate</button>
            <button class="fc-filter-btn" data-filter="todo">Da fare</button>
        </div>

        <div class="theory-levels stagger-in" id="theory-list">
            ${levels.map(level => `
                <div class="theory-level-group" data-level="${level.id}">
                    <div class="theory-level-header" style="--level-color:var(--${level.id})">
                        <span class="theory-level-icon">${LEVEL_ICONS[level.id] || '📘'}</span>
                        <span class="theory-level-title">${level.title}</span>
                        <span class="theory-level-count">${level.completedCount}/${level.theoryLessons.length}</span>
                    </div>
                    <div class="theory-lesson-list">
                        ${level.theoryLessons.map(lesson => `
                            <div class="theory-lesson-item ${lesson.completed ? 'completed' : ''}"
                                 data-id="${lesson.id}" data-type="${lesson.type}">
                                <div class="theory-lesson-icon ${lesson.type}" style="--level-color:var(--${level.id})">
                                    ${lesson.completed
                                        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                                        : (lesson.type === 'grammar'
                                            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>'
                                            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>')}
                                </div>
                                <div class="theory-lesson-info">
                                    <div class="theory-lesson-title">${lesson.title}</div>
                                    <div class="theory-lesson-meta">${getTypeName(lesson.type)}</div>
                                </div>
                                <div class="theory-lesson-arrow">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `);

    // Filter logic
    let currentFilter = 'all';
    page.querySelectorAll('#theory-filters .fc-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            page.querySelectorAll('#theory-filters .fc-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            applyFilter();
        });
    });

    function applyFilter() {
        page.querySelectorAll('.theory-lesson-item').forEach(item => {
            const type = item.dataset.type;
            const isCompleted = item.classList.contains('completed');
            let show = true;
            if (currentFilter === 'grammar') show = type === 'grammar';
            else if (currentFilter === 'vocab') show = type === 'vocab';
            else if (currentFilter === 'completed') show = isCompleted;
            else if (currentFilter === 'todo') show = !isCompleted;
            item.style.display = show ? '' : 'none';
        });

        // Hide empty level groups
        page.querySelectorAll('.theory-level-group').forEach(group => {
            const visibleItems = group.querySelectorAll('.theory-lesson-item[style=""], .theory-lesson-item:not([style])');
            const hasVisible = Array.from(group.querySelectorAll('.theory-lesson-item')).some(i => i.style.display !== 'none');
            group.style.display = hasVisible ? '' : 'none';
        });
    }

    // Lesson click
    page.querySelectorAll('.theory-lesson-item').forEach(item => {
        item.addEventListener('click', () => {
            navigate(`/lesson/${item.dataset.id}`);
        });
    });
}
