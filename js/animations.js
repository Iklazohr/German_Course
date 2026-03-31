// ===== Animation Module =====
// Uses Web Animations API (built-in, no CDN needed)

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
    el.animate([
        { opacity: 0, transform: 'translateX(60px)' },
        { opacity: 1, transform: 'translateX(0)' },
    ], { duration: 400, easing: EASE, fill: 'both' });
}

// ===== Exercise Animations =====

export function animateExerciseExit(el) {
    if (!el) return Promise.resolve();
    if (REDUCED_MOTION) {
        el.style.opacity = '0';
        return Promise.resolve();
    }
    const anim = el.animate([
        { opacity: 1, transform: 'translateX(0)' },
        { opacity: 0, transform: 'translateX(min(-80px, -15vw))' },
    ], { duration: 250, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    return anim.finished;
}

export function animateCorrectFeedback(el) {
    if (!el || REDUCED_MOTION) return;
    el.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.04)', offset: 0.3 },
        { transform: 'scale(0.98)', offset: 0.6 },
        { transform: 'scale(1.01)', offset: 0.8 },
        { transform: 'scale(1)' },
    ], { duration: 500, easing: 'ease' });
    el.animate([
        { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)' },
        { boxShadow: '0 0 0 8px rgba(34, 197, 94, 0.15)' },
        { boxShadow: '0 0 0 12px rgba(34, 197, 94, 0)' },
    ], { duration: 600, easing: 'ease' });
}

export function animateIncorrectFeedback(el) {
    if (!el || REDUCED_MOTION) return;
    el.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(-6px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(4px)' },
        { transform: 'translateX(0)' },
    ], { duration: 500, easing: 'ease' });
}

// ===== Flashcard Animations =====

export function animateCardExit(el, direction) {
    if (!el) return Promise.resolve();
    const tx = direction === 'left' ? '-80%' : '80%';
    const rot = direction === 'left' ? '-4deg' : '4deg';
    if (REDUCED_MOTION) {
        el.style.opacity = '0';
        return Promise.resolve();
    }
    const anim = el.animate([
        { transform: 'translateX(0) scale(1) rotate(0)', opacity: 1 },
        { transform: `translateX(${tx}) scale(0.9) rotate(${rot})`, opacity: 0 },
    ], { duration: 300, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
    return anim.finished;
}

export function animateCardEnter(el, direction) {
    if (!el || REDUCED_MOTION) return;
    const fromTx = direction === 'left' ? '60%' : '-60%';
    el.animate([
        { transform: `translateX(${fromTx}) scale(0.92)`, opacity: 0 },
        { transform: 'translateX(0) scale(1)', opacity: 1 },
    ], { duration: 350, easing: EASE, fill: 'both' });
}

// ===== Generic Animations =====

export function animateElements(container, selector, animationType = 'slideUp') {
    if (!container || REDUCED_MOTION) return;
    const elements = container.querySelectorAll(selector);
    if (!elements.length) return;

    const keyframes = {
        slideUp: [
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' },
        ],
        popIn: [
            { opacity: 0, transform: 'scale(0.85)' },
            { opacity: 1, transform: 'scale(1)' },
        ],
        fadeIn: [
            { opacity: 0 },
            { opacity: 1 },
        ],
    };

    const kf = keyframes[animationType] || keyframes.slideUp;

    elements.forEach((el, i) => {
        el.animate(kf, {
            duration: 400,
            delay: i * 50,
            easing: EASE,
            fill: 'both',
        });
    });
}
