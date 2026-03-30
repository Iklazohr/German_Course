// ===== Flashcards View =====

import { renderPage, setHeaderTitle, showBackButton, shuffleArray } from '../renderer.js';
import { navigate } from '../router.js';
import { store } from '../store.js';
import { playCorrect } from '../audio.js';

const FLASHCARD_DECKS = [
    { id: 'a1-nomen', level: 'a1', type: 'nomen', file: 'flashcards/a1-nomen.json', icon: '📦', label: 'Sostantivi' },
    { id: 'a1-verben', level: 'a1', type: 'verben', file: 'flashcards/a1-verben.json', icon: '⚡', label: 'Verbi' },
    { id: 'a2-nomen', level: 'a2', type: 'nomen', file: 'flashcards/a2-nomen.json', icon: '📦', label: 'Sostantivi' },
    { id: 'a2-verben', level: 'a2', type: 'verben', file: 'flashcards/a2-verben.json', icon: '⚡', label: 'Verbi' },
    { id: 'b1-nomen', level: 'b1', type: 'nomen', file: 'flashcards/b1-nomen.json', icon: '📦', label: 'Sostantivi' },
    { id: 'b1-verben', level: 'b1', type: 'verben', file: 'flashcards/b1-verben.json', icon: '⚡', label: 'Verbi' },
    { id: 'b2-nomen', level: 'b2', type: 'nomen', file: 'flashcards/b2-nomen.json', icon: '📦', label: 'Sostantivi' },
    { id: 'b2-verben', level: 'b2', type: 'verben', file: 'flashcards/b2-verben.json', icon: '⚡', label: 'Verbi' },
    { id: 'c1-nomen', level: 'c1', type: 'nomen', file: 'flashcards/c1-nomen.json', icon: '📦', label: 'Sostantivi' },
    { id: 'c1-verben', level: 'c1', type: 'verben', file: 'flashcards/c1-verben.json', icon: '⚡', label: 'Verbi' },
];

const LEVEL_NAMES = {
    a1: 'A1 - Principiante',
    a2: 'A2 - Elementare',
    b1: 'B1 - Intermedio',
    b2: 'B2 - Intermedio avanzato',
    c1: 'C1 - Avanzato'
};

const LEVEL_COLORS = {
    a1: 'var(--a1)', a2: 'var(--a2)', b1: 'var(--b1)', b2: 'var(--b2)', c1: 'var(--c1)'
};

const LEVEL_COLORS_LIGHT = {
    a1: 'var(--a1-light)', a2: 'var(--a2-light)', b1: 'var(--b1-light)', b2: 'var(--b2-light)', c1: 'var(--c1-light)'
};

// Get flashcard progress from localStorage
function getFlashcardProgress(deckId) {
    try {
        const raw = localStorage.getItem(`fc_${deckId}`);
        return raw ? JSON.parse(raw) : { known: [], index: 0 };
    } catch { return { known: [], index: 0 }; }
}

function saveFlashcardProgress(deckId, progress) {
    try {
        localStorage.setItem(`fc_${deckId}`, JSON.stringify(progress));
    } catch {}
}

// ===== Main Flashcards List View =====
export async function renderFlashcards() {
    setHeaderTitle('Flashcards');
    showBackButton(false);

    const levels = ['a1', 'a2', 'b1', 'b2', 'c1'];

    const page = renderPage(`
        <div class="fc-hero">
            <div class="fc-hero-icon">🃏</div>
            <h2>Flashcards</h2>
            <p>Impara nomi con articoli e verbi con coniugazione</p>
        </div>
        <div class="fc-levels stagger-in">
            ${levels.map(level => {
                const decks = FLASHCARD_DECKS.filter(d => d.level === level);
                return `
                    <div class="fc-level-group">
                        <h3 class="fc-level-title" style="color: ${LEVEL_COLORS[level]}">${LEVEL_NAMES[level]}</h3>
                        <div class="fc-deck-grid">
                            ${decks.map(deck => {
                                const progress = getFlashcardProgress(deck.id);
                                const knownCount = progress.known.length;
                                return `
                                    <div class="fc-deck-card card card-clickable" data-deck="${deck.id}" style="border-top: 3px solid ${LEVEL_COLORS[level]}">
                                        <div class="fc-deck-icon">${deck.icon}</div>
                                        <div class="fc-deck-info">
                                            <div class="fc-deck-label">${deck.label}</div>
                                            <div class="fc-deck-level" style="color: ${LEVEL_COLORS[level]}">${level.toUpperCase()}</div>
                                        </div>
                                        ${knownCount > 0 ? `<div class="fc-deck-badge" style="background: ${LEVEL_COLORS[level]}">${knownCount}</div>` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `);

    page.querySelectorAll('.fc-deck-card').forEach(card => {
        card.addEventListener('click', () => {
            navigate(`/flashcards/${card.dataset.deck}`);
        });
    });
}

// ===== Individual Deck View =====
export async function renderFlashcardDeck(deckId) {
    const deckMeta = FLASHCARD_DECKS.find(d => d.id === deckId);
    if (!deckMeta) { navigate('/flashcards'); return; }

    setHeaderTitle(`${deckMeta.icon} ${deckMeta.label} ${deckMeta.level.toUpperCase()}`);
    showBackButton(true, () => navigate('/flashcards'));

    // Show loading
    const page = renderPage(`<div class="fc-loading"><div class="fc-spinner"></div><p>Caricamento...</p></div>`);

    let deckData;
    try {
        const resp = await fetch(`data/${deckMeta.file}`);
        if (!resp.ok) throw new Error('Failed');
        deckData = await resp.json();
    } catch {
        page.innerHTML = `<div class="fc-error"><p>Impossibile caricare il mazzo.</p><button class="btn btn-primary" id="fc-back">Torna indietro</button></div>`;
        page.querySelector('#fc-back')?.addEventListener('click', () => navigate('/flashcards'));
        return;
    }

    const cards = deckData.cards;
    if (!cards || cards.length === 0) {
        page.innerHTML = `<div class="fc-error"><p>Nessuna carta trovata.</p></div>`;
        return;
    }

    const progress = getFlashcardProgress(deckId);
    const levelColor = LEVEL_COLORS[deckMeta.level];
    const isNomen = deckMeta.type === 'nomen';

    // State
    let currentIndex = 0;
    let isFlipped = false;
    let shuffledCards = shuffleArray(cards);
    let knownSet = new Set(progress.known);
    let mode = 'all'; // 'all', 'unknown', 'known'

    function getFilteredCards() {
        if (mode === 'unknown') return shuffledCards.filter(c => !knownSet.has(c.de));
        if (mode === 'known') return shuffledCards.filter(c => knownSet.has(c.de));
        return shuffledCards;
    }

    function renderCard() {
        const filtered = getFilteredCards();
        if (filtered.length === 0) {
            page.innerHTML = `
                <div class="fc-empty-state">
                    <div class="fc-empty-icon">${mode === 'unknown' ? '🎉' : '📭'}</div>
                    <h3>${mode === 'unknown' ? 'Hai imparato tutte le carte!' : 'Nessuna carta in questa categoria'}</h3>
                    <p>${mode === 'unknown' ? 'Tutte le carte sono segnate come conosciute.' : 'Cambia filtro per vedere le carte.'}</p>
                    <div class="fc-empty-actions">
                        <button class="btn btn-primary" id="fc-show-all">Mostra tutte</button>
                        <button class="btn btn-secondary" id="fc-reset">Ricomincia</button>
                    </div>
                </div>
            `;
            page.querySelector('#fc-show-all')?.addEventListener('click', () => { mode = 'all'; currentIndex = 0; renderCard(); });
            page.querySelector('#fc-reset')?.addEventListener('click', () => {
                knownSet.clear();
                saveFlashcardProgress(deckId, { known: [], index: 0 });
                mode = 'all';
                currentIndex = 0;
                shuffledCards = shuffleArray(cards);
                renderCard();
            });
            return;
        }

        if (currentIndex >= filtered.length) currentIndex = 0;
        const card = filtered[currentIndex];
        const isKnown = knownSet.has(card.de);
        isFlipped = false;

        const articleColor = isNomen ? getArticleColor(card.article) : '';

        page.innerHTML = `
            <div class="fc-toolbar">
                <div class="fc-counter">${currentIndex + 1} / ${filtered.length}</div>
                <div class="fc-filters">
                    <button class="fc-filter-btn ${mode === 'all' ? 'active' : ''}" data-mode="all">Tutte</button>
                    <button class="fc-filter-btn ${mode === 'unknown' ? 'active' : ''}" data-mode="unknown">Da imparare</button>
                    <button class="fc-filter-btn ${mode === 'known' ? 'active' : ''}" data-mode="known">Sapute</button>
                </div>
            </div>

            <div class="fc-progress-bar">
                <div class="fc-progress-fill" style="width: ${Math.round(knownSet.size / cards.length * 100)}%; background: ${levelColor}"></div>
            </div>
            <div class="fc-progress-text">${knownSet.size} / ${cards.length} sapute</div>

            <div class="fc-card-container">
                <div class="fc-card ${isFlipped ? 'flipped' : ''}" id="fc-main-card" style="--level-color: ${levelColor}">
                    <div class="fc-card-front">
                        ${isNomen ? `
                            <div class="fc-article" style="color: ${articleColor}">${card.article}</div>
                            <div class="fc-word">${card.de}</div>
                            <div class="fc-hint">Tocca per girare</div>
                        ` : `
                            <div class="fc-verb-type">${card.type || ''}</div>
                            <div class="fc-word">${card.de}</div>
                            <div class="fc-hint">Tocca per girare</div>
                        `}
                    </div>
                    <div class="fc-card-back">
                        ${isNomen ? renderNounBack(card) : renderVerbBack(card)}
                    </div>
                </div>
            </div>

            <div class="fc-actions">
                <button class="fc-action-btn fc-btn-unknown ${!isKnown ? 'active' : ''}" id="fc-mark-unknown" title="Non la so">
                    <span class="fc-action-icon">🔄</span>
                    <span>Ripeti</span>
                </button>
                <button class="fc-action-btn fc-btn-prev" id="fc-prev" title="Precedente">
                    <span class="fc-action-icon">◀</span>
                    <span>Indietro</span>
                </button>
                <button class="fc-action-btn fc-btn-next" id="fc-next" title="Prossima">
                    <span class="fc-action-icon">▶</span>
                    <span>Avanti</span>
                </button>
                <button class="fc-action-btn fc-btn-known ${isKnown ? 'active' : ''}" id="fc-mark-known" title="La so">
                    <span class="fc-action-icon">✅</span>
                    <span>Saputa</span>
                </button>
            </div>

            <div class="fc-shuffle-row">
                <button class="btn btn-secondary fc-shuffle-btn" id="fc-shuffle">🔀 Mescola</button>
            </div>
        `;

        // Event listeners
        page.querySelector('#fc-main-card').addEventListener('click', () => {
            isFlipped = !isFlipped;
            page.querySelector('#fc-main-card').classList.toggle('flipped', isFlipped);
        });

        page.querySelector('#fc-next').addEventListener('click', () => {
            currentIndex++;
            renderCard();
        });

        page.querySelector('#fc-prev').addEventListener('click', () => {
            currentIndex = currentIndex <= 0 ? getFilteredCards().length - 1 : currentIndex - 1;
            renderCard();
        });

        page.querySelector('#fc-mark-known').addEventListener('click', () => {
            knownSet.add(card.de);
            saveFlashcardProgress(deckId, { known: [...knownSet], index: currentIndex });
            playCorrect();
            currentIndex++;
            renderCard();
        });

        page.querySelector('#fc-mark-unknown').addEventListener('click', () => {
            knownSet.delete(card.de);
            saveFlashcardProgress(deckId, { known: [...knownSet], index: currentIndex });
            renderCard();
        });

        page.querySelector('#fc-shuffle').addEventListener('click', () => {
            shuffledCards = shuffleArray(cards);
            currentIndex = 0;
            renderCard();
        });

        page.querySelectorAll('.fc-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                mode = btn.dataset.mode;
                currentIndex = 0;
                renderCard();
            });
        });

        // Keyboard navigation
        const keyHandler = (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                isFlipped = !isFlipped;
                page.querySelector('#fc-main-card')?.classList.toggle('flipped', isFlipped);
            } else if (e.key === 'ArrowRight') {
                currentIndex++;
                renderCard();
            } else if (e.key === 'ArrowLeft') {
                currentIndex = currentIndex <= 0 ? getFilteredCards().length - 1 : currentIndex - 1;
                renderCard();
            }
        };
        document.addEventListener('keydown', keyHandler);
        page._keyHandler = keyHandler;

        // Swipe support
        let touchStartX = 0;
        const cardEl = page.querySelector('.fc-card-container');
        cardEl.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
        cardEl.addEventListener('touchend', (e) => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 60) {
                if (dx < 0) { currentIndex++; renderCard(); }
                else { currentIndex = currentIndex <= 0 ? getFilteredCards().length - 1 : currentIndex - 1; renderCard(); }
            }
        }, { passive: true });
    }

    renderCard();

    return () => {
        if (page._keyHandler) document.removeEventListener('keydown', page._keyHandler);
    };
}

function getArticleColor(article) {
    switch (article) {
        case 'der': return '#1a73e8';
        case 'die': return '#ea4335';
        case 'das': return '#34a853';
        default: return 'var(--text)';
    }
}

function renderNounBack(card) {
    return `
        <div class="fc-back-article" style="color: ${getArticleColor(card.article)}">${card.article} ${card.de}</div>
        <div class="fc-back-plural">Pl: die ${card.plural || '—'}</div>
        <div class="fc-back-translation">${card.it}</div>
        ${card.example ? `<div class="fc-back-example">${card.example}</div>` : ''}
        ${card.category ? `<div class="fc-back-category">${card.category}</div>` : ''}
    `;
}

function renderVerbBack(card) {
    const conj = card.conjugation || {};
    return `
        <div class="fc-back-translation">${card.it}</div>
        <table class="fc-conj-table">
            <tbody>
                ${Object.entries(conj).map(([pron, form]) => `
                    <tr><td class="fc-conj-pron">${pron}</td><td class="fc-conj-form">${form}</td></tr>
                `).join('')}
            </tbody>
        </table>
        ${card.perfekt ? `<div class="fc-back-perfekt"><strong>Perfekt:</strong> ${card.perfekt}</div>` : ''}
        ${card.praeteritum ? `<div class="fc-back-praeteritum"><strong>Präteritum:</strong> ${card.praeteritum}</div>` : ''}
        ${card.example ? `<div class="fc-back-example">${card.example}</div>` : ''}
        ${card.note ? `<div class="fc-back-note">${card.note}</div>` : ''}
    `;
}
