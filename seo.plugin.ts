import fs from 'fs';
import path from 'path';
import { createServer, type Plugin } from 'vite';
import { POSTS, type Post } from './lib/posts';

/*
 * Search + answer-engine output, generated after every build from lib/posts.ts and the
 * article components themselves (server-rendered, so the text is never kept twice):
 *   /articles/<id>/index.html  the app's page for one article, its full text inside for crawlers
 *   /articles/index.html       every article, plain HTML, no JavaScript
 *   /about/index.html          who, work, projects, contact, plain HTML, no JavaScript
 *   /sitemap.xml               every indexable URL
 *   /robots.txt                open to search and AI crawlers, points at the sitemap
 *   /llms.txt                  a plain-markdown summary for LLMs (llmstxt.org)
 *   /llms-full.txt             the same, with every article's full text
 */

export const SITE = 'https://syed-subhan.vercel.app';
const PERSON = `${SITE}/#person`;

/* --- One source for every page that describes the person --- */

const BIO = 'Syed Subhan is a design engineer from India, building interfaces, motion and component systems in the open. Creator of Amicro and Oxygen UI.';
const WORK = [
    { role: 'Design Engineer', at: 'a US-based product company', when: 'present', what: 'Builds interfaces, motion and component systems.' },
    { role: 'AI/ML Intern', at: 'IBM SkillsBuild', when: 'Jun to Jul 2024', what: 'Built and deployed an AI chatbot with IBM Watson Assistant, reducing manual query workload by about 40%. Developed a diabetes prediction ML model with 75% accuracy.' },
];
const PROJECTS = [
    { name: 'Amicro', href: 'https://amicro.dev', what: 'Open-source micro-interactions for React. 2.7K+ GitHub stars, 5M+ views, Vercel OSS ’26.' },
    { name: 'Oxygen UI', href: 'https://oxygenui.xyz', what: 'Solana UI primitives, backed by Solana Foundation India.' },
    { name: 'Monocharts', href: 'https://github.com/Subhan-code/Monocharts', what: 'Charts for React.' },
    { name: 'Aizen Verse', href: 'https://aizen-verse.vercel.app/', what: 'Anime streaming.' },
];
const CONTACT = [
    { name: 'Email', href: 'mailto:syednotion@gmail.com', label: 'syednotion@gmail.com' },
    { name: 'X', href: 'https://x.com/SubhanHQ', label: '@SubhanHQ' },
    { name: 'GitHub', href: 'https://github.com/Subhan-code', label: 'Subhan-code' },
];

const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// The calendar date as written ("Apr 02, 2024" → 2024-04-02), never shifted by the build machine's timezone
const iso = (d: string) => {
    const t = new Date(d);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
};
const url = (p: Post) => `${SITE}/articles/${p.id}`;
const byNewest = [...POSTS].sort((a, b) => +new Date(b.date) - +new Date(a.date));

const postList = () =>
    `<ul>\n${byNewest.map((p) => `          <li><a href="/articles/${p.id}">${esc(p.title)}</a>: ${esc(p.excerpt)}</li>`).join('\n')}\n        </ul>`;

/* --- Article text, rendered from the real components --- */

/** "design-systems" → the DesignSystems export of components/articles/DesignSystems.tsx */
const componentName = (id: string) => id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');

/** The article body as plain semantic HTML: headings, paragraphs, lists, code. No classes, no demos. */
const cleanArticle = (markup: string) => {
    const body = markup.match(/<article[^>]*>([\s\S]*)<\/article>/)?.[1] ?? '';
    return body
        .replace(/<svg[\s\S]*?<\/svg>/g, '')
        .replace(/\s(?:class|style|id|data-[\w-]+|aria-[\w-]+|role|tabindex)="[^"]*"/g, '')
        .replace(/<\/?(?:div|span)\b[^>]*>/g, '')
        .replace(/<(p|h[2-4]|li)>\s*<\/\1>/g, '')
        .replace(/\s*\n\s*/g, '\n')
        .trim();
};

/** The same body as Markdown-ish text, for llms-full.txt */
const toText = (html: string) =>
    html
        .replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '\n```\n$1\n```\n')
        .replace(/<h[2-4]>([\s\S]*?)<\/h[2-4]>/g, '\n### $1\n')
        .replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n')
        .replace(/<\/p>/g, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, '&')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

/** Server-render each article once, through Vite so TSX, aliases and assets resolve as in the app */
const renderArticles = async (root: string) => {
    const server = await createServer({
        root,
        configFile: false,
        logLevel: 'silent',
        appType: 'custom',
        server: { middlewareMode: true, hmr: false, watch: null },
        resolve: { alias: { '@': root } },
    });
    const out: Record<string, string> = {};
    try {
        // Plain Node imports: the same React copy the externalised article modules resolve to
        const { createElement } = await import('react');
        const { renderToStaticMarkup } = await import('react-dom/server');
        for (const p of POSTS) {
            const name = componentName(p.id);
            try {
                const mod = await server.ssrLoadModule(`/components/articles/${name}.tsx`);
                const markup = renderToStaticMarkup(createElement(mod[name], { onNavigate() {}, toggleTheme() {}, isDark: true }));
                out[p.id] = cleanArticle(markup);
            } catch (e) {
                // A broken article shouldn't sink the build; its page falls back to the excerpt
                console.warn(`[portfolio-seo] couldn't render ${p.id}: ${(e as Error).message}`);
            }
        }
    } finally {
        await server.close();
    }
    return out;
};

/* --- The app's own page for an article (head + crawlable body swapped in) --- */

const articleHead = (p: Post) => {
    const title = `${p.title} | Syed Subhan`;
    const ld = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'BlogPosting',
                '@id': `${url(p)}#article`,
                headline: p.title,
                description: p.excerpt,
                articleSection: p.category,
                datePublished: iso(p.date),
                timeRequired: `PT${parseInt(p.readTime, 10) || 5}M`,
                url: url(p),
                mainEntityOfPage: url(p),
                image: `${SITE}/og-preview.png`,
                inLanguage: 'en',
                author: { '@id': PERSON },
                publisher: { '@id': PERSON },
                isPartOf: { '@id': `${SITE}/#website` },
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Syed Subhan', item: `${SITE}/` },
                    { '@type': 'ListItem', position: 2, name: 'Articles', item: `${SITE}/articles` },
                    { '@type': 'ListItem', position: 3, name: p.title, item: url(p) },
                ],
            },
        ],
    };
    return `<!-- SEO:START -->
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(p.excerpt)}" />
  <link rel="canonical" href="${url(p)}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${url(p)}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(p.excerpt)}" />
  <meta property="article:published_time" content="${iso(p.date)}" />
  <meta property="article:author" content="${SITE}/" />
  <meta property="article:section" content="${esc(p.category)}" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(p.excerpt)}" />
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <!-- SEO:END -->`;
};

/** One article as readable HTML: title, a plain byline sentence, the full text */
const articleArticle = (p: Post, body?: string) => `<article>
        <h1>${esc(p.title)}</h1>
        <p>By <a href="/about">Syed Subhan</a>, published <time datetime="${iso(p.date)}">${esc(p.date)}</time>, ${esc(p.readTime)}.</p>
        ${body ?? `<p>${esc(p.excerpt)}</p>`}
      </article>`;

const articleBody = (p: Post, body?: string) => `<!-- SEO-BODY:START -->
    <main class="seo-fallback">
      ${articleArticle(p, body)}
      <nav>
        <h2>More articles</h2>
        ${postList()}
        <p><a href="/">Syed Subhan</a>, <a href="/about">about</a>, <a href="/articles">all articles</a>.</p>
      </nav>
    </main>
    <!-- SEO-BODY:END -->`;

const between = (html: string, tag: string, replacement: string) =>
    html.replace(new RegExp(`<!-- ${tag}:START[\\s\\S]*?<!-- ${tag}:END -->`), replacement);

/* --- Standalone content pages: plain HTML that reads well with or without a browser --- */

// Two colours, one surface, no edges, no rules, no labels, no negative tracking
const PAGE_CSS = `
:root { color-scheme: dark; }
body { margin: 0; background: #000; color: #a1a1a1; font: 16px/28px Inter, system-ui, -apple-system, "Segoe UI", sans-serif; -webkit-font-smoothing: antialiased; }
main { max-width: 640px; margin: 0 auto; padding: 72px 20px 96px; }
h1, h2, h3, strong { color: #fafafa; font-weight: 600; }
h1 { font-size: 28px; line-height: 34px; margin: 0 0 12px; }
h2 { font-size: 17px; line-height: 24px; margin: 48px 0 8px; }
h3 { font-size: 16px; line-height: 24px; margin: 32px 0 8px; }
p { margin: 0 0 16px; }
ul { margin: 0 0 16px; padding-left: 20px; }
li { margin: 6px 0; }
a { color: #fafafa; text-decoration: underline; text-decoration-color: #a1a1a1; text-underline-offset: 4px; }
pre { background: #171717; color: #fafafa; border-radius: 16px; padding: 20px; overflow-x: auto; font-size: 13px; line-height: 22px; }
.top { margin-bottom: 56px; }
.top a { margin-right: 16px; }
`.trim();

const page = ({ title, description, canonical, ld, body }: { title: string; description: string; canonical: string; ld: object; body: string }) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow, max-snippet:-1" />
  <meta name="author" content="Syed Subhan" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${SITE}/og-preview.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="theme-color" content="#000000" />
  <link rel="icon" type="image/png" href="/Favicon.png" />
  <link rel="alternate" type="text/markdown" title="LLM-readable summary" href="/llms.txt" />
  <style>${PAGE_CSS}</style>
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
  <main>
    <nav class="top" aria-label="Site"><a href="/">Syed Subhan</a><a href="/about">About</a><a href="/articles">Articles</a></nav>
    ${body}
  </main>
</body>
</html>
`;

const aboutPage = () => page({
    title: 'About Syed Subhan | Design Engineer',
    description: BIO,
    canonical: `${SITE}/about`,
    ld: {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        '@id': `${SITE}/about#page`,
        url: `${SITE}/about`,
        name: 'About Syed Subhan',
        mainEntity: { '@id': PERSON },
        isPartOf: { '@id': `${SITE}/#website` },
    },
    body: `<h1>Syed Subhan</h1>
    <p>${esc(BIO)}</p>
    <h2>Work</h2>
    <ul>
      ${WORK.map((w) => `<li><strong>${esc(w.role)}</strong> at ${esc(w.at)}, ${esc(w.when)}. ${esc(w.what)}</li>`).join('\n      ')}
    </ul>
    <h2>Projects</h2>
    <ul>
      ${PROJECTS.map((p) => `<li><a href="${p.href}">${esc(p.name)}</a>: ${esc(p.what)}</li>`).join('\n      ')}
    </ul>
    <h2>Writing</h2>
    ${postList()}
    <h2>Contact</h2>
    <p>${CONTACT.map((c) => `${c.name} <a href="${c.href}">${esc(c.label)}</a>`).join(', ')}.</p>`,
});

const articlesPage = (bodies: Record<string, string>) => page({
    title: 'Articles | Syed Subhan',
    description: 'Writing by Syed Subhan on interface design, motion, design systems and engineering.',
    canonical: `${SITE}/articles`,
    ld: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${SITE}/articles#page`,
        url: `${SITE}/articles`,
        name: 'Articles by Syed Subhan',
        author: { '@id': PERSON },
        isPartOf: { '@id': `${SITE}/#website` },
        hasPart: byNewest.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: url(p), datePublished: iso(p.date) })),
    },
    body: `<h1>Articles</h1>
    <p>Writing on interface design, motion, design systems and engineering. Each article below is in full.</p>
    ${byNewest.map((p) => `<article>
      <h2><a href="/articles/${p.id}">${esc(p.title)}</a></h2>
      <p>Published <time datetime="${iso(p.date)}">${esc(p.date)}</time>, ${esc(p.readTime)}.</p>
      ${bodies[p.id] ? bodies[p.id].replace(/<(\/?)h[2-4]>/g, '<$1h3>') : `<p>${esc(p.excerpt)}</p>`}
    </article>`).join('\n    ')}`,
});

/* --- Sitemap, robots, llms --- */

const sitemap = () => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
        `  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
        `  <url><loc>${SITE}/about</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>`,
        `  <url><loc>${SITE}/articles</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
        ...byNewest.map((p) => `  <url><loc>${url(p)}</loc><lastmod>${iso(p.date)}</lastmod><changefreq>yearly</changefreq><priority>0.7</priority></url>`),
    ];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
};

// Named so it's an explicit welcome, not an accident of a wildcard
const AI_CRAWLERS = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
    'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot', 'DuckAssistBot',
];
const robots = () =>
    `# Search engines and AI answer engines are welcome here.\nUser-agent: *\nAllow: /\nDisallow: /api/\n\n${AI_CRAWLERS.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /api/`).join('\n\n')}\n\nSitemap: ${SITE}/sitemap.xml\n`;

const llms = () => `# Syed Subhan

> ${BIO}

## About

${WORK.map((w) => `- ${w.role} at ${w.at} (${w.when}). ${w.what}`).join('\n')}
- Focus: design engineering, interaction and motion design, micro-interactions, component and design systems, React, TypeScript.
- Full profile: ${SITE}/about

## Projects

${PROJECTS.map((p) => `- [${p.name}](${p.href}): ${p.what}`).join('\n')}

## Articles

${byNewest.map((p) => `- [${p.title}](${url(p)}): ${p.excerpt}`).join('\n')}
- Every article in full: ${SITE}/llms-full.txt

## Contact

${CONTACT.map((c) => `- ${c.name}: ${c.href.replace('mailto:', '')}`).join('\n')}
- Website: ${SITE}/
`;

const llmsFull = (bodies: Record<string, string>) => `${llms()}
## Full articles
${byNewest.map((p) => `
## ${p.title}

URL: ${url(p)}
Published: ${iso(p.date)}

${bodies[p.id] ? toText(bodies[p.id]) : p.excerpt}
`).join('')}`;

export const seoPlugin = (): Plugin => {
    let outDir = 'dist';
    let root = process.cwd();
    return {
        name: 'portfolio-seo',
        apply: 'build',
        configResolved(config) {
            root = config.root;
            outDir = path.resolve(config.root, config.build.outDir);
        },
        // Keep the home page's static article list in step with lib/posts.ts
        transformIndexHtml(html) {
            return between(html, 'POSTS', `<!-- POSTS:START -->\n        ${postList()}\n        <!-- POSTS:END -->`);
        },
        async closeBundle() {
            const bodies = await renderArticles(root);
            const home = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
            for (const p of POSTS) {
                const dir = path.join(outDir, 'articles', p.id);
                fs.mkdirSync(dir, { recursive: true });
                const html = between(between(home, 'SEO', articleHead(p)), 'SEO-BODY', articleBody(p, bodies[p.id]));
                fs.writeFileSync(path.join(dir, 'index.html'), html);
            }
            fs.writeFileSync(path.join(outDir, 'articles', 'index.html'), articlesPage(bodies));
            fs.mkdirSync(path.join(outDir, 'about'), { recursive: true });
            fs.writeFileSync(path.join(outDir, 'about', 'index.html'), aboutPage());
            fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemap());
            fs.writeFileSync(path.join(outDir, 'robots.txt'), robots());
            fs.writeFileSync(path.join(outDir, 'llms.txt'), llms());
            fs.writeFileSync(path.join(outDir, 'llms-full.txt'), llmsFull(bodies));
            console.log(`[portfolio-seo] ${Object.keys(bodies).length}/${POSTS.length} articles rendered in full`);
        },
    };
};
