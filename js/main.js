// ===== Theme Management =====
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }
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
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    sections.forEach(section => observer.observe(section));
}

// ===== Typewriter Effect =====
function initTypewriter() {
    const el = document.getElementById('typewriter');
    if (!el) return;

    const text = 'Building the harness that lets AI agents self-improve at scale.';
    let i = 0;
    el.innerHTML = '<span class="cursor"></span>';

    function type() {
        if (i < text.length) {
            el.innerHTML = text.substring(0, i + 1) + '<span class="cursor"></span>';
            i++;
            setTimeout(type, 35 + Math.random() * 25);
        }
    }

    setTimeout(type, 800);
}

// ===== Animated Counters =====
function initCounters() {
    const counters = document.querySelectorAll('.bento-metric-num');
    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (el.dataset.counted) return;
            el.dataset.counted = 'true';

            if (el.dataset.static) {
                el.textContent = el.dataset.static;
                return;
            }

            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const decimals = parseInt(el.dataset.decimals) || 0;
            const duration = 1800;
            const start = performance.now();

            function easeOut(t) {
                return 1 - Math.pow(1 - t, 3);
            }

            function update(now) {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                const value = target * easeOut(progress);

                el.textContent = value.toFixed(decimals) + suffix;

                if (progress < 1) {
                    requestAnimationFrame(update);
                } else {
                    el.textContent = target.toFixed(decimals) + suffix;
                }
            }

            requestAnimationFrame(update);
        });
    }, { threshold: 0.3 });

    counters.forEach(c => observer.observe(c));
}

// ===== 3D Tilt on Bento Boxes =====
function initTilt() {
    if (window.matchMedia('(hover: none)').matches) return;

    document.querySelectorAll('.bento-box').forEach(box => {
        box.addEventListener('mousemove', (e) => {
            const rect = box.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
            const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
            box.style.transform = `perspective(800px) rotateY(${x * 2.5}deg) rotateX(${-y * 2.5}deg) scale(1.01)`;
            box.style.transition = 'transform 0.08s ease';
        });

        box.addEventListener('mouseleave', () => {
            box.style.transform = '';
            box.style.transition = 'transform 0.35s ease';
        });
    });
}

// ===== Command Palette =====
const CMD_ITEMS = [
    { title: 'AI Agent Building Blocks', sub: 'Blog - Feb 2026', icon: '📄', url: 'blog/ai-agent-building-blocks.html' },
    { title: 'When CI/CD Breaks First', sub: 'Blog - Feb 2026', icon: '📄', url: 'blog/cicd-breaks-first.html' },
    { title: 'Building Production-Ready AI Agents', sub: 'Blog - Feb 2026', icon: '📄', url: 'blog/building-production-ai-agents.html' },
    { title: 'MCP Servers in Enterprise', sub: 'Blog - Jan 2026', icon: '📄', url: 'blog/mcp-servers-enterprise.html' },
    { title: 'DevSecOps in the AI Era', sub: 'Blog - Jan 2026', icon: '📄', url: 'blog/devsecops-ai-era.html' },
    { title: 'Kubernetes for ML Workloads', sub: 'Blog - Dec 2025', icon: '📄', url: 'blog/kubernetes-ml-workloads.html' },
    { title: 'RAG Architectures for Enterprise', sub: 'Blog - Nov 2025', icon: '📄', url: 'blog/rag-architectures.html' },
    { title: 'LangChain Quick Start', sub: 'Blog - Dec 2023', icon: '📄', url: 'blog/langchain-quick-start.html' },
    { title: 'LangChain Introduction', sub: 'Blog - Dec 2023', icon: '📄', url: 'blog/langchain-introduction.html' },
    { title: 'Kubernetes Container Runtime', sub: 'Blog - Nov 2022', icon: '📄', url: 'blog/kubernetes-container-runtime.html' },
    { title: 'Service Mesh: Istio', sub: 'Blog - Nov 2022', icon: '📄', url: 'blog/service-mesh-kubernetes-istio.html' },
    { title: 'Deep Container Runtime', sub: 'Blog - Nov 2022', icon: '📄', url: 'blog/deep-container-runtime.html' },
    { title: 'SQL vs NoSQL Guide', sub: 'Blog - Jul 2022', icon: '📄', url: 'blog/sql-vs-nosql-guide.html' },
    { title: 'Daily AI News', sub: 'Page', icon: '📰', url: 'news.html' },
    { title: 'Projects', sub: 'Page', icon: '🛠️', url: 'projects.html' },
    { title: 'All Blog Posts', sub: 'Section', icon: '📚', url: '#blog-archive' },
    { title: 'LinkedIn', sub: 'External', icon: '🔗', url: 'https://www.linkedin.com/in/sushant-s-31b799224/' },
    { title: 'GitHub', sub: 'External', icon: '🔗', url: 'https://github.com/sushant24-ai' },
    { title: 'X (Twitter)', sub: 'External', icon: '🔗', url: 'https://x.com/SikareSushant' },
    { title: 'Email', sub: 'Contact', icon: '✉️', url: 'mailto:sushantshikare24@gmail.com' },
];

let cmdActive = -1;

function openCommandPalette() {
    const palette = document.getElementById('cmdPalette');
    if (!palette) return;
    palette.classList.add('open');
    const input = document.getElementById('cmdInput');
    input.value = '';
    input.focus();
    cmdActive = -1;
    renderCmdResults('');
}

function closeCommandPalette() {
    const palette = document.getElementById('cmdPalette');
    if (palette) palette.classList.remove('open');
}

function filterCommands() {
    const query = document.getElementById('cmdInput').value;
    cmdActive = -1;
    renderCmdResults(query);
}

function renderCmdResults(query) {
    const container = document.getElementById('cmdResults');
    if (!container) return;

    const q = query.toLowerCase().trim();
    const filtered = q
        ? CMD_ITEMS.filter(item =>
            item.title.toLowerCase().includes(q) ||
            item.sub.toLowerCase().includes(q))
        : CMD_ITEMS;

    container.innerHTML = filtered.map((item, i) => `
        <a href="${item.url}" class="cmd-result${i === cmdActive ? ' active' : ''}"
           ${item.url.startsWith('http') ? 'target="_blank"' : ''}
           onclick="closeCommandPalette()">
            <span class="cmd-result-icon">${item.icon}</span>
            <span class="cmd-result-text">
                <span class="cmd-result-title">${item.title}</span>
                <span class="cmd-result-sub">${item.sub}</span>
            </span>
        </a>
    `).join('');
}

function initCommandPalette() {
    document.addEventListener('keydown', (e) => {
        const palette = document.getElementById('cmdPalette');
        if (!palette) return;
        const isOpen = palette.classList.contains('open');

        if (e.key === '/' && !isOpen && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            openCommandPalette();
            return;
        }

        if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !isOpen) {
            e.preventDefault();
            openCommandPalette();
            return;
        }

        if (!isOpen) return;

        if (e.key === 'Escape') {
            closeCommandPalette();
            return;
        }

        const results = palette.querySelectorAll('.cmd-result');
        if (results.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            cmdActive = Math.min(cmdActive + 1, results.length - 1);
            results.forEach((r, i) => r.classList.toggle('active', i === cmdActive));
            results[cmdActive].scrollIntoView({ block: 'nearest' });
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            cmdActive = Math.max(cmdActive - 1, 0);
            results.forEach((r, i) => r.classList.toggle('active', i === cmdActive));
            results[cmdActive].scrollIntoView({ block: 'nearest' });
        }

        if (e.key === 'Enter' && cmdActive >= 0) {
            e.preventDefault();
            results[cmdActive].click();
        }
    });
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initScrollSpy();
    initTypewriter();
    initCounters();
    initTilt();
    initCommandPalette();

    if (typeof mermaid !== 'undefined') {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        mermaid.initialize({
            startOnLoad: true,
            theme: isLight ? 'default' : 'dark',
            securityLevel: 'loose'
        });
    }
});

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
