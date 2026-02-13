const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// ====== CONFIG ======
const OPERATORLINKS_URL = 'https://www.operatorlinks.com';
const OUTPUT_FILE = path.join(__dirname, '..', 'news-data.json');
const MAX_DAYS = 7;

// ====== HELPERS ======
function fetch(url, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
        }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                const loc = res.headers.location.startsWith('http')
                    ? res.headers.location
                    : new URL(res.headers.location, url).href;
                return resolve(fetch(loc, maxRedirects - 1));
            }
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
        }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('Timeout')); });
    });
}

function extractOGImage(html) {
    // Try og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) return ogMatch[1];

    // Try twitter:image
    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twMatch) return twMatch[1];

    return null;
}

function extractDescription(html) {
    // Try og:description
    const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
    if (ogMatch) return ogMatch[1];

    // Try meta description
    const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
    if (metaMatch) return metaMatch[1];

    return '';
}

function getDomain(url) {
    try { return new URL(url).hostname.replace('www.', ''); }
    catch { return ''; }
}

// ====== OPERATORLINKS SCRAPER ======
async function scrapeOperatorLinks() {
    console.log('Fetching operatorlinks.com...');

    // Try to get the page HTML
    const { body: pageHtml } = await fetch(OPERATORLINKS_URL);

    // operatorlinks.com is likely a Next.js app with __NEXT_DATA__
    const nextDataMatch = pageHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);

    let links = [];

    if (nextDataMatch) {
        console.log('Found __NEXT_DATA__, parsing...');
        try {
            const nextData = JSON.parse(nextDataMatch[1]);
            // Extract links from Next.js data
            links = extractLinksFromNextData(nextData);
        } catch (e) {
            console.log('Failed to parse __NEXT_DATA__:', e.message);
        }
    }

    // Fallback: Try parsing HTML directly for links
    if (links.length === 0) {
        console.log('Trying HTML link extraction...');
        links = extractLinksFromHTML(pageHtml);
    }

    // Fallback: Try common API patterns
    if (links.length === 0) {
        console.log('Trying API patterns...');
        for (const apiPath of ['/api/links', '/api/posts', '/api/feed']) {
            try {
                const { body, status } = await fetch(OPERATORLINKS_URL + apiPath);
                if (status === 200) {
                    const data = JSON.parse(body);
                    if (Array.isArray(data)) {
                        links = data;
                        console.log(`Found ${links.length} links from ${apiPath}`);
                        break;
                    }
                }
            } catch (e) { /* skip */ }
        }
    }

    return links;
}

function extractLinksFromNextData(data) {
    const links = [];
    // Walk the data looking for arrays of links
    function walk(obj, depth = 0) {
        if (depth > 10) return;
        if (Array.isArray(obj)) {
            for (const item of obj) {
                if (item && typeof item === 'object' && (item.url || item.link || item.href)) {
                    links.push({
                        url: item.url || item.link || item.href,
                        title: item.title || item.name || '',
                        description: item.description || item.desc || item.summary || '',
                        image: item.image || item.thumbnail || item.og_image || item.ogImage || '',
                        date: item.date || item.created_at || item.publishedAt || '',
                        source: item.source || item.domain || ''
                    });
                }
                if (typeof item === 'object') walk(item, depth + 1);
            }
        } else if (obj && typeof obj === 'object') {
            for (const key of Object.keys(obj)) {
                walk(obj[key], depth + 1);
            }
        }
    }
    walk(data);
    return links;
}

function extractLinksFromHTML(html) {
    const links = [];
    // Find all anchor tags with external links
    const anchorRegex = /<a[^>]*href=["'](https?:\/\/(?!www\.operatorlinks)[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = anchorRegex.exec(html)) !== null) {
        const url = match[1];
        const text = match[2].replace(/<[^>]+>/g, '').trim();
        if (text.length > 10 && !url.includes('twitter.com') && !url.includes('x.com/hnshah')) {
            links.push({ url, title: text, description: '', image: '', date: '', source: getDomain(url) });
        }
    }
    return links;
}

// ====== FALLBACK: HN AI STORIES ======

// Keywords that need word-boundary matching (short words that appear inside other words)
// e.g. "ai" appears in "emails", "Gail", "ertain" — must match as whole word only
const WORD_BOUNDARY_KEYWORDS = [
    'ai', 'ml', 'nlp', 'rag', 'mcp', 'gpu', 'tpu',
    'agent', 'agents'
];

// Keywords safe for substring matching (long enough to not cause false positives)
const SUBSTRING_KEYWORDS = [
    'artificial intelligence', 'machine learning', 'deep learning',
    'neural network', 'llm', 'gpt', 'chatgpt', 'openai', 'anthropic', 'claude',
    'gemini', 'transformer', 'langchain', 'vector database',
    'embedding', 'fine-tuning', 'fine tuning', 'hugging face', 'diffusion',
    'llama', 'mistral', 'copilot', 'agentic', 'nvidia', 'pytorch', 'tensorflow',
    'inference', 'benchmark', 'reasoning model',
    'sora', 'deepseek', 'perplexity', 'cursor ai', 'devin', 'multimodal',
    'foundation model', 'language model', 'text-to-', 'image generation',
    'stable diffusion', 'midjourney', 'dall-e', 'computer vision',
    'generative ai', 'gen ai', 'genai', 'large language',
    'ai agent', 'ai model', 'ai tool', 'ai code', 'ai startup'
];

// Build regex patterns for word-boundary keywords
const WORD_BOUNDARY_PATTERNS = WORD_BOUNDARY_KEYWORDS.map(kw => new RegExp(`\\b${kw}\\b`, 'i'));

function isAIRelated(title) {
    const t = title.toLowerCase();
    // Check word-boundary keywords first
    for (const pattern of WORD_BOUNDARY_PATTERNS) {
        if (pattern.test(title)) return true;
    }
    // Check substring keywords
    return SUBSTRING_KEYWORDS.some(kw => t.includes(kw));
}

const HIGH_VALUE = {
    'openai': 3, 'gpt': 2, 'claude': 3, 'gemini': 3, 'anthropic': 3,
    'deepseek': 3, 'llama': 2, 'agentic': 2, 'reasoning': 2
};

async function fetchHNAIStories() {
    console.log('Using Hacker News AI stories as source...');

    // Fetch story IDs
    const topRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const bestRes = await fetch('https://hacker-news.firebaseio.com/v0/beststories.json');
    const newRes = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');

    const topIds = JSON.parse(topRes.body).slice(0, 150);
    const bestIds = JSON.parse(bestRes.body).slice(0, 100);
    const newIds = JSON.parse(newRes.body).slice(0, 100);

    const allIds = [...new Set([...topIds, ...bestIds, ...newIds])];
    console.log(`Fetching ${allIds.length} stories...`);

    const stories = [];
    const batchSize = 30;
    for (let i = 0; i < allIds.length; i += batchSize) {
        const batch = allIds.slice(i, i + batchSize);
        const results = await Promise.all(
            batch.map(async id => {
                try {
                    const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
                    return JSON.parse(r.body);
                } catch { return null; }
            })
        );
        stories.push(...results.filter(Boolean));
    }

    // Filter AI stories from last 7 days using strict keyword matching
    const sevenDaysAgo = Date.now() - MAX_DAYS * 24 * 60 * 60 * 1000;
    const aiStories = stories.filter(s => {
        if (!s || !s.title || !s.time || s.time * 1000 < sevenDaysAgo) return false;
        return isAIRelated(s.title);
    });

    // Score stories
    const scored = aiStories.map(s => {
        const hoursOld = (Date.now() - s.time * 1000) / 3.6e6;
        const titleLow = s.title.toLowerCase();
        let kwBonus = 1;
        for (const [kw, bonus] of Object.entries(HIGH_VALUE)) {
            if (titleLow.includes(kw)) kwBonus += bonus * 0.1;
        }
        const recency = Math.max(0.3, 1 - hoursOld / 168);
        const engagement = Math.log10((s.descendants || 0) + 1) * 0.15 + 1;
        return {
            ...s,
            smartScore: ((s.score || 0) * recency * kwBonus * engagement) / Math.sqrt(hoursOld + 2)
        };
    });

    // Group by day (IST / PST — we'll use UTC date for grouping)
    const grouped = {};
    scored.forEach(s => {
        const d = new Date(s.time * 1000);
        const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(s);
    });

    // Sort each day, keep top 5
    for (const key in grouped) {
        grouped[key].sort((a, b) => b.smartScore - a.smartScore);
        grouped[key] = grouped[key].slice(0, 5);
    }

    // Sort days newest first
    const sortedDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // Flatten into link objects
    const allLinks = [];
    for (const day of sortedDays) {
        for (const s of grouped[day]) {
            allLinks.push({
                url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
                title: s.title,
                description: `${s.score} points · ${s.descendants || 0} comments`,
                image: '',
                date: day,
                source: getDomain(s.url || 'news.ycombinator.com'),
                hn_id: s.id,
                score: s.score,
                comments: s.descendants || 0
            });
        }
    }

    return allLinks;
}

// ====== OG IMAGE FETCHER ======
async function enrichWithOGImages(links) {
    console.log(`Enriching ${links.length} links with OG images and descriptions...`);

    const enriched = [];
    for (const link of links) {
        try {
            if (!link.url || link.url.includes('news.ycombinator.com')) {
                enriched.push(link);
                continue;
            }
            console.log(`  Fetching OG data for: ${link.source || link.url}`);
            const { body } = await fetch(link.url);

            if (!link.image) {
                const ogImg = extractOGImage(body);
                if (ogImg) {
                    // Make absolute URL
                    link.image = ogImg.startsWith('http') ? ogImg : new URL(ogImg, link.url).href;
                }
            }

            if (!link.description || link.description.includes('points')) {
                const desc = extractDescription(body);
                if (desc) {
                    // Keep HN stats + add OG description
                    const stats = link.description || '';
                    link.description = desc;
                    if (stats) link.stats = stats;
                }
            }
        } catch (e) {
            console.log(`  Failed for ${link.source}: ${e.message}`);
        }
        enriched.push(link);
    }
    return enriched;
}

// ====== MAIN ======
async function main() {
    console.log('===== Daily AI News Scraper =====');
    console.log(`Time: ${new Date().toISOString()}`);

    let links = [];

    // Try operatorlinks first
    try {
        links = await scrapeOperatorLinks();
        if (links.length > 0) {
            console.log(`Got ${links.length} links from operatorlinks.com`);
        }
    } catch (e) {
        console.log(`operatorlinks.com scrape failed: ${e.message}`);
    }

    // Fallback to Hacker News
    if (links.length === 0) {
        links = await fetchHNAIStories();
        console.log(`Got ${links.length} links from Hacker News`);
    }

    // Enrich with OG images
    links = await enrichWithOGImages(links);

    // Load existing data to merge (keep last 7 days)
    let existingData = { days: {}, lastUpdated: '' };
    try {
        if (fs.existsSync(OUTPUT_FILE)) {
            existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        }
    } catch (e) { /* start fresh */ }

    // Group new links by day
    const newDays = {};
    links.forEach(link => {
        const day = link.date || new Date().toISOString().split('T')[0];
        if (!newDays[day]) newDays[day] = [];
        newDays[day].push({
            url: link.url,
            title: link.title,
            description: link.description || '',
            image: link.image || '',
            source: link.source || getDomain(link.url),
            stats: link.stats || ''
        });
    });

    // Merge with existing — new data overwrites same-day entries
    const mergedDays = { ...existingData.days, ...newDays };

    // Keep only last 7 days
    const allDates = Object.keys(mergedDays).sort((a, b) => b.localeCompare(a));
    const recentDates = allDates.slice(0, MAX_DAYS);
    const finalDays = {};
    recentDates.forEach(d => { finalDays[d] = mergedDays[d]; });

    const output = {
        lastUpdated: new Date().toISOString(),
        days: finalDays
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`\nSaved ${recentDates.length} days to news-data.json`);
    console.log('Done!');
}

main().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
