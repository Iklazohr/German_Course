import { renderPage, setHeaderTitle, showBackButton, loadCourseStructure } from '../renderer.js';
import { store } from '../store.js';

export async function renderProgress() {
    setHeaderTitle('Progressi');
    showBackButton(false);

    const course = await loadCourseStructure();
    if (!course) return;

    const stats = store.getStats();

    const levelsHtml = course.levels.map(level => {
        const completion = store.getLevelCompletion(level.id, course);
        const lessons = [];
        for (const unit of level.units) {
            for (const l of unit.lessons) lessons.push(l);
            if (unit.review) lessons.push(unit.review);
        }

        const completedCount = lessons.filter(l => store.isCompleted(l.id)).length;

        return `
            <div class="progress-level-section">
                <div class="progress-level-header">
                    <div class="progress-level-badge" style="background:var(--${level.id}-light);color:var(--${level.id})">${level.id.toUpperCase()}</div>
                    <div style="flex:1">
                        <div style="font-weight:600;font-size:0.9375rem">${level.title}</div>
                        <div style="font-size:0.8125rem;color:var(--text-secondary)">${completedCount}/${lessons.length} lezioni completate</div>
                    </div>
                    <div style="font-weight:700;color:var(--${level.id})">${completion}%</div>
                </div>
                <div class="progress-bar" style="--level-color:var(--${level.id})">
                    <div class="progress-bar-fill" style="width:${completion}%"></div>
                </div>
                ${lessons.filter(l => store.isCompleted(l.id) && store.getScore(l.id) !== null).length > 0 ? `
                    <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px">
                        ${lessons.filter(l => store.getScore(l.id) !== null).map(l => {
                            const score = store.getScore(l.id);
                            const cls = score >= 90 ? 'badge-success' : score >= 60 ? 'badge-warning' : 'badge-error';
                            return `<span class="badge ${cls}">${l.title.replace('Esercizi: ', '')} ${score}%</span>`;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    renderPage(`
        <div class="stats-grid" style="margin-bottom:28px">
            <div class="stat-card">
                <div class="stat-value">${stats.streakDays}</div>
                <div class="stat-label">Giorni di fila</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.completedLessons}</div>
                <div class="stat-label">Lezioni</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalExercises}</div>
                <div class="stat-label">Esercizi</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalExercises > 0 ? Math.round((stats.totalCorrect / stats.totalExercises) * 100) : 0}%</div>
                <div class="stat-label">Precisione</div>
            </div>
        </div>

        <div class="section-title">Progresso per livello</div>
        ${levelsHtml}
    `);
}
