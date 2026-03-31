import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure, loadData, formatMarkdown, renderTable } from '../renderer.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { playClick, playComplete } from '../audio.js';

export async function renderLesson(lessonId) {
    const course = await loadCourseStructure();
    if (!course) return;

    // Find lesson in course structure
    let lessonMeta = null;
    let levelId = null;
    let nextLessonId = null;
    let nextLessonType = null;

    for (const level of course.levels) {
        for (const unit of level.units) {
            const allItems = [...unit.lessons, ...(unit.review ? [unit.review] : [])];
            for (let i = 0; i < allItems.length; i++) {
                if (allItems[i].id === lessonId) {
                    lessonMeta = allItems[i];
                    levelId = level.id;
                    if (i + 1 < allItems.length) {
                        nextLessonId = allItems[i + 1].id;
                        nextLessonType = allItems[i + 1].type;
                    }
                    break;
                }
            }
            if (lessonMeta) break;
        }
        if (lessonMeta) break;
    }

    if (!lessonMeta) { navigate('/levels'); return; }

    const data = await loadData(lessonMeta.file);
    if (!data) {
        renderPage('<div class="empty-state"><p>Contenuto non ancora disponibile.</p></div>');
        return;
    }

    setHeaderTitle(lessonMeta.title);
    showBackButton(true, () => navigate(`/level/${levelId}`));

    if (data.type === 'vocab') {
        renderVocabLesson(data, lessonId, levelId, nextLessonId, nextLessonType);
    } else {
        renderGrammarLesson(data, lessonId, levelId, nextLessonId, nextLessonType);
    }

    store.saveProgress(lessonId, { lastAccessed: new Date().toISOString() });
    store.setCurrentLesson(lessonId);
}

function renderGrammarLesson(data, lessonId, levelId, nextLessonId, nextLessonType) {
    const sectionsHtml = data.sections.map(section => {
        switch (section.type) {
            case 'intro':
                return `<div class="lesson-section"><div class="section-intro"><p>${formatMarkdown(section.content)}</p></div></div>`;

            case 'rule':
                return `
                    <div class="lesson-section">
                        <div class="section-rule">
                            <h3>${section.title}</h3>
                            <p>${formatMarkdown(section.content)}</p>
                            ${section.table ? renderTable(section.table) : ''}
                        </div>
                    </div>
                `;

            case 'tip':
                return `<div class="lesson-section"><div class="section-tip">${formatMarkdown(section.content)}</div></div>`;

            case 'example':
                return `
                    <div class="lesson-section">
                        <div class="example-pairs">
                            ${section.pairs.map(p => `
                                <div class="example-pair">
                                    <div class="example-de">${p.de}</div>
                                    <div class="example-it">${p.it}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;

            case 'comparison':
                return `
                    <div class="lesson-section">
                        <div class="section-comparison">
                            <h3>${section.title || 'Confronto italiano-tedesco'}</h3>
                            <p>${formatMarkdown(section.content)}</p>
                        </div>
                    </div>
                `;

            case 'quick-table':
                return `
                    <div class="lesson-section">
                        <div class="section-quick-table">
                            <h3>${section.title || 'Tabella rapida'}</h3>
                            ${section.description ? `<p class="quick-table-desc">${formatMarkdown(section.description)}</p>` : ''}
                            ${section.table ? renderTable(section.table) : ''}
                        </div>
                    </div>
                `;

            case 'warning':
                return `
                    <div class="lesson-section">
                        <div class="section-warning">${formatMarkdown(section.content)}</div>
                    </div>
                `;

            case 'summary':
                return `
                    <div class="lesson-section">
                        <div class="section-summary">
                            <h3>${section.title || 'Riepilogo'}</h3>
                            <ul class="summary-list">
                                ${(section.points || []).map(p => `<li>${formatMarkdown(p)}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;

            default:
                return '';
        }
    }).join('');

    const page = renderPage(`
        <div class="lesson-page">
            <div class="lesson-header">
                <h2>${data.title}</h2>
                ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
            </div>
            ${sectionsHtml}
        </div>
        <div class="lesson-footer">
            <button class="btn btn-outline" id="lesson-back">Indietro</button>
            <button class="btn btn-primary" id="lesson-complete">
                ${store.isCompleted(lessonId) ? 'Rivedi' : 'Ho capito!'}
            </button>
        </div>
    `);

    const backBtn = page.querySelector('#lesson-back');
    const completeBtn = page.querySelector('#lesson-complete');
    const lsnFooter1 = page.querySelector('.lesson-footer');
    if (lsnFooter1) page.parentElement.appendChild(lsnFooter1);

    backBtn.addEventListener('click', () => navigate(`/level/${levelId}`));
    completeBtn.addEventListener('click', () => {
        store.completeLesson(lessonId);
        playComplete();
        if (typeof window.applySettings === 'function') window.applySettings();
        if (nextLessonId) {
            const route = (nextLessonType === 'exercise' || nextLessonType === 'review')
                ? `/exercise/${nextLessonId}`
                : `/lesson/${nextLessonId}`;
            navigate(route);
        } else {
            navigate(`/level/${levelId}`);
        }
    });
}

function renderVocabLesson(data, lessonId, levelId, nextLessonId, nextLessonType) {
    const groupsHtml = data.groups.map(group => `
        <div class="vocab-group">
            <div class="vocab-group-title">${group.name}</div>
            <div class="vocab-grid">
                ${group.words.map((word, i) => `
                    <div class="vocab-card" data-idx="${i}">
                        ${word.emoji ? `<div class="vocab-emoji">${word.emoji}</div>` : ''}
                        <div style="flex:1">
                            <div class="vocab-de">${word.de}</div>
                            <div class="vocab-it">${word.it}</div>
                            <div class="vocab-example">
                                ${word.example_de ? `<div class="example-de" style="font-size:0.8125rem">${word.example_de}</div>` : ''}
                                ${word.example_it ? `<div class="example-it" style="font-size:0.75rem">${word.example_it}</div>` : ''}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    const page = renderPage(`
        <div class="lesson-page">
            <div class="lesson-header">
                <h2>${data.title}</h2>
                ${data.subtitle ? `<div class="subtitle">${data.subtitle}</div>` : ''}
                <p class="text-secondary mt-8" style="font-size:0.8125rem">Tocca una parola per vedere l'esempio</p>
            </div>
            ${groupsHtml}
        </div>
        <div class="lesson-footer">
            <button class="btn btn-outline" id="lesson-back">Indietro</button>
            <button class="btn btn-primary" id="lesson-complete">
                ${store.isCompleted(lessonId) ? 'Rivedi' : 'Ho studiato!'}
            </button>
        </div>
    `);

    const backBtn2 = page.querySelector('#lesson-back');
    const completeBtn2 = page.querySelector('#lesson-complete');
    const lsnFooter2 = page.querySelector('.lesson-footer');
    if (lsnFooter2) page.parentElement.appendChild(lsnFooter2);

    // Flip cards on click
    page.querySelectorAll('.vocab-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
            playClick();
        });
    });

    backBtn2.addEventListener('click', () => navigate(`/level/${levelId}`));
    completeBtn2.addEventListener('click', () => {
        store.completeLesson(lessonId);
        playComplete();
        if (typeof window.applySettings === 'function') window.applySettings();
        if (nextLessonId) {
            const route = (nextLessonType === 'exercise' || nextLessonType === 'review')
                ? `/exercise/${nextLessonId}`
                : `/lesson/${nextLessonId}`;
            navigate(route);
        } else {
            navigate(`/level/${levelId}`);
        }
    });
}
