// ===== Theory Library View =====

import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { getTypeName } from './dashboard.js';

const LEVEL_ICONS = { a1: 'A1', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1' };

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
                        completed: store.isCompleted(lesson.id),
                        favorite: store.isFavorite(lesson.id)
                    });
                }
            }
        }
        const completedCount = theoryLessons.filter(l => l.completed).length;
        return { ...level, theoryLessons, completedCount };
    });

    const totalTheory = levels.reduce((s, l) => s + l.theoryLessons.length, 0);
    const totalCompleted = levels.reduce((s, l) => s + l.completedCount, 0);

    let currentFilter = 'all';
    let searchQuery = '';

    function render() {
        // Re-read favorites from store each render
        levels.forEach(level => {
            level.theoryLessons.forEach(l => { l.favorite = store.isFavorite(l.id); });
        });
        const totalFavorites = levels.reduce((s, l) => s + l.theoryLessons.filter(x => x.favorite).length, 0);

        const page = renderPage(`
            <div class="theory-hero">
                <h2>Libreria di Teoria</h2>
                <p>${totalCompleted} / ${totalTheory} lezioni completate</p>
                <div class="fc-progress-bar" style="max-width:300px;margin:12px auto 0">
                    <div class="fc-progress-fill" style="width:${totalTheory ? Math.round(totalCompleted / totalTheory * 100) : 0}%;background:var(--primary)"></div>
                </div>
            </div>

            <div class="theory-search">
                <div class="theory-search-wrap">
                    <svg class="theory-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                    </svg>
                    <input type="text" class="theory-search-input" id="theory-search" placeholder="Cerca lezioni..." value="${searchQuery}">
                </div>
            </div>

            <div class="theory-filters" id="theory-filters">
                <button class="fc-filter-btn ${currentFilter === 'all' ? 'active' : ''}" data-filter="all">Tutte</button>
                <button class="fc-filter-btn ${currentFilter === 'favorites' ? 'active' : ''}" data-filter="favorites">Preferiti${totalFavorites > 0 ? ` (${totalFavorites})` : ''}</button>
                <button class="fc-filter-btn ${currentFilter === 'grammar' ? 'active' : ''}" data-filter="grammar">Grammatica</button>
                <button class="fc-filter-btn ${currentFilter === 'vocab' ? 'active' : ''}" data-filter="vocab">Vocabolario</button>
                <button class="fc-filter-btn ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">Completate</button>
                <button class="fc-filter-btn ${currentFilter === 'todo' ? 'active' : ''}" data-filter="todo">Da fare</button>
            </div>

            ${renderTheoryList(levels, currentFilter, searchQuery, totalFavorites)}
        `);

        // Search input
        const searchInput = page.querySelector('#theory-search');
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const wrap = document.querySelector('#theory-list-wrap');
                if (wrap) {
                    wrap.innerHTML = renderTheoryListInner(levels, currentFilter, searchQuery, totalFavorites);
                    attachLessonListeners(document);
                }
            }, 150);
        });
        if (searchQuery) {
            searchInput.focus();
            searchInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }

        // Filter buttons
        page.querySelectorAll('#theory-filters .fc-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentFilter = btn.dataset.filter;
                render();
            });
        });

        attachLessonListeners(page);
    }

    function attachLessonListeners(page) {
        // Favorite toggle
        page.querySelectorAll('.theory-fav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                store.toggleFavorite(btn.dataset.fav);
                render();
            });
        });

        // Lesson click
        page.querySelectorAll('.theory-lesson-item').forEach(item => {
            item.addEventListener('click', () => {
                navigate(`/lesson/${item.dataset.id}`);
            });
        });
    }

    render();
}

function renderTheoryListInner(levels, currentFilter, searchQuery, totalFavorites) {
    const q = searchQuery.toLowerCase().trim();

    if (currentFilter === 'favorites' && totalFavorites === 0 && !q) {
        return `<div class="theory-empty">
            <h3>Nessun preferito</h3>
            <p>Tocca la stella accanto a una lezione per aggiungerla ai preferiti.</p>
        </div>`;
    }

    const html = levels.map(level => {
        const filtered = level.theoryLessons.filter(l => {
            if (!matchFilter(l, currentFilter)) return false;
            if (q && !l.title.toLowerCase().includes(q) && !l.unitTitle.toLowerCase().includes(q)) return false;
            return true;
        });
        if (filtered.length === 0) return '';
        return `
            <div class="theory-level-group" data-level="${level.id}">
                <div class="theory-level-header" style="--level-color:var(--${level.id})">
                    <span class="theory-level-icon">${LEVEL_ICONS[level.id] || 'A1'}</span>
                    <span class="theory-level-title">${level.title}</span>
                    <span class="theory-level-count">${level.completedCount}/${level.theoryLessons.length}</span>
                </div>
                <div class="theory-lesson-list">
                    ${filtered.map(lesson => `
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
                            <button class="theory-fav-btn ${lesson.favorite ? 'active' : ''}" data-fav="${lesson.id}" title="Preferito">
                                ${lesson.favorite ? '★' : '☆'}
                            </button>
                            <div class="theory-lesson-arrow">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    if (!html.trim()) {
        return `<div class="theory-empty">
            <h3>Nessun risultato</h3>
            <p>${searchQuery ? 'Prova a cercare con altre parole.' : 'Nessuna lezione in questa categoria.'}</p>
        </div>`;
    }

    return `<div class="theory-levels" id="theory-list">${html}</div>`;
}

function renderTheoryList(levels, currentFilter, searchQuery, totalFavorites) {
    return `<div id="theory-list-wrap">${renderTheoryListInner(levels, currentFilter, searchQuery, totalFavorites)}</div>`;
}

function matchFilter(lesson, filter) {
    switch (filter) {
        case 'grammar': return lesson.type === 'grammar';
        case 'vocab': return lesson.type === 'vocab';
        case 'completed': return lesson.completed;
        case 'todo': return !lesson.completed;
        case 'favorites': return lesson.favorite;
        default: return true;
    }
}
