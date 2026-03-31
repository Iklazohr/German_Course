// ===== Animation Module =====
// Uses Web Animations API for page transitions only
// Exercise and flashcard animations remain CSS @keyframes (proven stable)

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

export function animatePageIn(page) {
    if (!page || REDUCED_MOTION) return;
    page.animate([
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 350, easing: EASE, fill: 'both' });
}

export function animateStaggerChildren(container, selector, opts = {}) {
    if (!container) return;
    const children = container.querySelectorAll(selector);
    if (!children.length) return;
    if (REDUCED_MOTION) return;

    const delay = (opts.delay || 0.06) * 1000;
    const startDelay = (opts.startDelay || 0) * 1000;

    children.forEach((el, i) => {
        el.style.opacity = '0';
        el.animate([
            { opacity: 0, transform: 'translateY(20px)', filter: 'blur(4px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
        ], {
            duration: 500,
            delay: startDelay + (i * delay),
            easing: EASE,
            fill: 'both',
        });
    });
}

export function animateHeroEntrance(hero) {
    if (!hero || REDUCED_MOTION) return;

    const badge = hero.querySelector('.hero-badge');
    const h2 = hero.querySelector('h2');
    const actions = hero.querySelector('.hero-actions');
    const elements = [badge, h2, actions].filter(Boolean);

    elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.animate([
            { opacity: 0, transform: 'translateY(16px)', filter: 'blur(8px)' },
            { opacity: 1, transform: 'translateY(0)', filter: 'blur(0px)' },
        ], {
            duration: 600,
            delay: 100 + (i * 120),
            easing: EASE,
            fill: 'both',
        });
    });
}

export function animateExerciseEnter(el) {
    if (!el || REDUCED_MOTION) return;
    // Fallback: use CSS animation which is set in renderer.js
    el.style.animation = 'exerciseEnter 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
}

export function animateElements(container, selector, animationType = 'slideUp') {
    if (!container || REDUCED_MOTION) return;
    const elements = container.querySelectorAll(selector);
    if (!elements.length) return;

    const cssAnimations = {
        slideUp: 'slideInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
        popIn: 'popIn 0.3s ease both',
        fadeIn: 'fadeIn 0.5s ease',
    };

    const cssAnim = cssAnimations[animationType];

    elements.forEach((el, i) => {
        const d = Math.min(i * 0.05, 0.36);
        el.style.animation = `${cssAnim} ${d}s both`;
        el.addEventListener('animationend', () => { el.style.animation = ''; }, { once: true });
    });
}
