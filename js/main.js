// ===== Theme Management =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    // Default is dark (no data-theme attribute = dark in CSS)
    // Only set 'light' if explicitly saved
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    // If no saved theme, dark is default (no attribute needed)
    updateThemeIcon();
}

function toggleTheme() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    }
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    themeToggle.textContent = isLight ? '🌙' : '☀️';
}

// ===== Active Nav Highlight on Scroll =====
function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, {
        rootMargin: '-30% 0px -60% 0px',
        threshold: 0
    });

    sections.forEach(section => observer.observe(section));
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollSpy();

    // Initialize Mermaid if present
    if (typeof mermaid !== 'undefined') {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        mermaid.initialize({
            startOnLoad: true,
            theme: isLight ? 'default' : 'dark',
            securityLevel: 'loose'
        });
    }
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
        updateThemeIcon();
    }
});
