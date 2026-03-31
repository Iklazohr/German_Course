// ===== Hash-Based SPA Router =====

const routes = [];
let currentCleanup = null;

export function addRoute(pattern, handler) {
    // Convert pattern like '/level/:id' to regex
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
    });
    routes.push({
        pattern,
        regex: new RegExp(`^${regexStr}$`),
        paramNames,
        handler
    });
}

export function navigate(path) {
    window.location.hash = path;
}

export function getCurrentPath() {
    return window.location.hash.slice(1) || '/';
}

function matchRoute(path) {
    for (const route of routes) {
        const match = path.match(route.regex);
        if (match) {
            const params = {};
            route.paramNames.forEach((name, i) => {
                params[name] = decodeURIComponent(match[i + 1]);
            });
            return { handler: route.handler, params };
        }
    }
    return null;
}

export function handleRoute() {
    const path = getCurrentPath();

    // Cleanup previous view
    if (currentCleanup && typeof currentCleanup === 'function') {
        currentCleanup();
        currentCleanup = null;
    }

    const result = matchRoute(path);
    if (result) {
        currentCleanup = result.handler(result.params);
    } else {
        // Fallback to home
        navigate('/');
    }

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(item => {
        const route = item.dataset.route;
        const isActive =
            (route === 'home' && (path === '/' || path === '')) ||
            (route === 'levels' && path.startsWith('/level')) ||
            (route === 'theory' && path === '/theory') ||
            (route === 'flashcards' && path.startsWith('/flashcards'));
        item.classList.toggle('active', isActive);
    });
}

export function startRouter() {
    window.addEventListener('hashchange', handleRoute);
    handleRoute();
}
