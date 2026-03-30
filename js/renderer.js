// ===== DOM Rendering Utilities =====

const main = () => document.getElementById('app-main');

export function renderPage(html) {
    const container = main();
    container.innerHTML = `<div class="page" style="visibility:hidden">${html}</div>`;
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    const page = container.querySelector('.page');
    // rAF + setTimeout: guarantees browser has painted before animations are set.
    // Elements hidden via visibility:hidden → animations start from opacity:0 → no flash.
    requestAnimationFrame(() => setTimeout(() => {
        page.style.visibility = '';
        page.style.animation = 'pageIn 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
        page.querySelectorAll('.exercise-page').forEach(el => {
            el.style.animation = 'exerciseEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
        });
        page.querySelectorAll('.lesson-section').forEach((el, i) => {
            const d = Math.min(i * 0.06, 0.36);
            el.style.animation = `slideInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) ${d}s both`;
        });
        page.querySelectorAll('.mc-option').forEach((el, i) => {
            el.style.animation = `slideInUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.05}s both`;
            el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
        });
        page.querySelectorAll('.matching-item').forEach(el => {
            el.style.animation = 'popIn 0.3s ease both';
            el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
        });
        page.querySelectorAll('.summary-card').forEach(el => {
            el.style.animation = 'popIn 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        });
        page.querySelectorAll('.fc-hero').forEach(el => {
            el.style.animation = 'fadeIn 0.5s ease';
        });
    }, 0));
    return page;
}

export function setHeaderTitle(title) {
    document.getElementById('header-title').textContent = title;
}

export function showBackButton(show, onClick) {
    const btn = document.getElementById('back-btn');
    btn.classList.toggle('hidden', !show);
    // Remove old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.id = 'back-btn';
    if (show && onClick) {
        newBtn.addEventListener('click', onClick);
    }
}

export function formatMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '<br>• ')
        .replace(/\n/g, '<br>');
}

export function renderTable(table) {
    if (!table || !table.headers) return '';
    return `
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>${table.headers.map(h => `<th>${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${table.rows.map(row => `
                        <tr>${row.map(cell => `<td>${formatMarkdown(cell)}</td>`).join('')}</tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Cache for loaded JSON data
const dataCache = new Map();

export async function loadData(filePath) {
    if (dataCache.has(filePath)) {
        return dataCache.get(filePath);
    }
    try {
        const resp = await fetch(`data/${filePath}`);
        if (!resp.ok) throw new Error(`Failed to load ${filePath}`);
        const data = await resp.json();
        dataCache.set(filePath, data);
        return data;
    } catch (err) {
        console.error('Data load error:', err);
        return null;
    }
}

export async function loadCourseStructure() {
    return loadData('course-structure.json');
}

export function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Fuzzy comparison for German text
export function normalizeGerman(text) {
    return text
        .trim()
        .toLowerCase()
        .replace(/ß/g, 'ss')
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/[.,!?;:'"()]/g, '')
        .replace(/\s+/g, ' ');
}

export function checkTranslation(userAnswer, acceptableAnswers) {
    const normalized = normalizeGerman(userAnswer);
    for (const answer of acceptableAnswers) {
        if (normalizeGerman(answer) === normalized) return 'correct';
    }
    // Check if close (Levenshtein distance <= 2)
    for (const answer of acceptableAnswers) {
        if (levenshtein(normalizeGerman(answer), normalized) <= 2) return 'close';
    }
    return 'incorrect';
}

function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
