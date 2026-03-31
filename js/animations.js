// ===== Motion.js Animation Module =====
// Lazy-loads Motion.js from CDN with offline fallback

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let motionModule = null;

async function getMotion() {
    if (motionModule) return motionModule;
    if (REDUCED_MOTION) return null;
    try {
        motionModule = await import('https://cdn.jsdelivr.net/npm/motion@12.38.0/+esm');
        return motionModule;
    } catch {
        return null;
    }
}

function showImmediately(elements) {
    if (typeof elements === 'string') return;
    const els = elements instanceof NodeList || Array.isArray(elements)
        ? elements : [elements];
    els.forEach(el => {
        if (el) {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.filter = 'none';
        }
    });
}

export async function animatePageIn(page) {
    if (!page) return;
    const motion = await getMotion();
    if (!motion) {
        page.style.opacity = '1';
        return;
    }
    motion.animate(page, {
        opacity: [0, 1],
        y: [6, 0],
    }, {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
    });
}

export async function animateStaggerChildren(container, selector, opts = {}) {
    if (!container) return;
    const children = container.querySelectorAll(selector);
    if (!children.length) return;

    // Hide elements immediately before animation starts
    children.forEach(el => { el.style.opacity = '0'; });

    const motion = await getMotion();
    if (!motion) {
        children.forEach(el => { el.style.opacity = ''; });
        return;
    }

    const delay = opts.delay || 0.06;
    const startDelay = opts.startDelay || 0;

    children.forEach((el, i) => {
        motion.animate(el, {
            opacity: [0, 1],
            y: [20, 0],
            filter: ['blur(4px)', 'blur(0px)'],
        }, {
            duration: 0.5,
            delay: startDelay + (i * delay),
            ease: [0.22, 1, 0.36, 1],
        }).then(() => {
            el.classList.add('animated');
        });
    });
}

export async function animateHeroEntrance(hero) {
    if (!hero) return;

    const badge = hero.querySelector('.hero-badge');
    const h2 = hero.querySelector('h2');
    const p = hero.querySelector('p');
    const actions = hero.querySelector('.hero-actions');
    const elements = [badge, h2, p, actions].filter(Boolean);

    // Hide elements immediately before animation starts
    elements.forEach(el => { el.style.opacity = '0'; });

    const motion = await getMotion();
    if (!motion) {
        elements.forEach(el => { el.style.opacity = ''; });
        return;
    }

    elements.forEach((el, i) => {
        motion.animate(el, {
            opacity: [0, 1],
            y: [16, 0],
            filter: ['blur(8px)', 'blur(0px)'],
        }, {
            duration: 0.6,
            delay: 0.1 + (i * 0.12),
            ease: [0.22, 1, 0.36, 1],
        }).then(() => {
            el.classList.add('animated');
        });
    });
}

export async function animateExerciseEnter(el) {
    if (!el) return;
    const motion = await getMotion();
    if (!motion) return;
    motion.animate(el, {
        opacity: [0, 1],
        x: [60, 0],
    }, {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
    });
}

export async function animateElements(container, selector, animationType = 'slideUp') {
    if (!container) return;
    const elements = container.querySelectorAll(selector);
    if (!elements.length) return;

    const motion = await getMotion();
    if (!motion) {
        showImmediately(elements);
        return;
    }

    const animations = {
        slideUp: { opacity: [0, 1], y: [20, 0] },
        popIn: { opacity: [0, 1], scale: [0.85, 1] },
        fadeIn: { opacity: [0, 1] },
    };

    const anim = animations[animationType] || animations.slideUp;

    elements.forEach((el, i) => {
        motion.animate(el, anim, {
            duration: 0.4,
            delay: i * 0.05,
            ease: [0.22, 1, 0.36, 1],
        });
    });
}
