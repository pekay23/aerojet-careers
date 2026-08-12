#!/usr/bin/env node
/**
 * Build static HTML for every markdown file under `docs/`.
 *
 * Output: `docs/html/<section>/<slug>.html` mirroring the MD source tree,
 *         plus a top-level `docs/html/index.html` linking everything.
 *         Top-level markdown files (e.g. AUDIT_REPORT, README) are rendered
 *         directly into `docs/html/`.
 *
 * Self-contained: the editorial design tokens + site CSS are written into
 * `docs/html/` by this script, so there are no external skill dependencies.
 *
 * Run with: `bun run docs:html`  (or `node scripts/build-docs-html.mjs`)
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')
const DOCS = path.join(ROOT, 'docs')
const OUT = path.join(DOCS, 'html')

const SECTIONS = [
  { dir: 'architecture', title: 'Architecture', blurb: 'System reference — overview, database, security, API.' },
  { dir: 'guides', title: 'Guides', blurb: 'Operational how-tos — setup, deployment, migration, handover.' },
]

// Top-level markdown files rendered directly into docs/html/
const TOP_LEVEL = [
  { file: 'AUDIT_DECISIONS.md', title: 'Audit Decisions', eyebrow: 'Audit' },
  { file: 'AUDIT_REPORT_2026-08-11.md', title: 'Full Codebase Audit Report', eyebrow: 'Audit' },
  { file: 'LLM_COUNCIL_AUDIT_REPORT.md', title: 'LLM Council Audit Report', eyebrow: 'Audit' },
  { file: 'LLM_COUNCIL_FRAMEWORK.md', title: 'LLM Council Framework', eyebrow: 'Framework' },
  { file: 'README.md', title: 'Documentation Index', eyebrow: 'Docs' },
  { file: 'UNDONE_ISSUES_2026-08-11.md', title: 'Undone Issues Tracker', eyebrow: 'Tracker' },
]

// ── HTML helpers ─────────────────────────────────────────────────────────
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&', '<': '<', '>': '>', '"': '"' }[c]))
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// ── Marked renderer overrides ────────────────────────────────────────────
function buildRenderer() {
  const renderer = new marked.Renderer()
  let h2Counter = 0

  renderer.heading = ({ tokens, depth }) => {
    const text = marked.Parser.parseInline(tokens)
    const plain = tokens.map((t) => t.text || '').join('')
    const id = slugify(plain)
    if (depth === 2) {
      h2Counter += 1
      const num = String(h2Counter).padStart(2, '0')
      return `
<section class="he-section" id="${id}">
  <div class="he-section__num">${num} · ${escapeHtml(plain)}</div>
  <h2 class="he-section__title">${text}</h2>`
    }
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }

  renderer.link = ({ href, title, tokens }) => {
    const text = marked.Parser.parseInline(tokens)
    let finalHref = href
    if (finalHref && /\.md(#|$)/i.test(finalHref) && !/^https?:/i.test(finalHref)) {
      finalHref = finalHref.replace(/\.md(?=#|$)/i, '.html')
    }
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : ''
    return `<a href="${escapeHtml(finalHref)}"${titleAttr}>${text}</a>`
  }

  renderer.codespan = ({ text }) => `<code>${escapeHtml(text)}</code>`

  renderer.blockquote = ({ tokens }) => {
    const body = marked.Parser.parse(tokens)
    const isPull = /^<p><strong>/.test(body.trim())
    return isPull
      ? `<blockquote class="he-pull">${body}</blockquote>`
      : `<blockquote>${body}</blockquote>`
  }

  return { renderer, resetCounter: () => { h2Counter = 0 } }
}

// ── TOC extraction ───────────────────────────────────────────────────────
function extractToc(md) {
  const out = []
  let inFence = false
  for (const line of md.split('\n')) {
    if (/^```/.test(line.trim())) { inFence = !inFence; continue }
    if (inFence) continue
    const m = line.match(/^(##|###)\s+(.+?)\s*$/)
    if (m) {
      const depth = m[1].length
      const text = m[2].replace(/^[#`*\s]+|[`*\s]+$/g, '')
      out.push({ depth, text, id: slugify(text) })
    }
  }
  return out
}

function parseHeader(md, slug, section) {
  const h1Match = md.match(/^#\s+(.+)$/m)
  const title = h1Match ? h1Match[1].trim() : slug
  const afterH1 = h1Match ? md.slice((h1Match.index ?? 0) + h1Match[0].length) : md
  const paragraphs = afterH1.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const deckCandidate = paragraphs.find(
    (p) => !p.startsWith('#') && !p.startsWith('```') && !p.startsWith('|') && !p.startsWith('- ') && !p.startsWith('> ')
  )
  let deckMarkdown = ''
  if (deckCandidate) {
    const oneLine = deckCandidate.replace(/\s+/g, ' ')
    const sentenceEnd = oneLine.match(/^([^.!?`]+(?:`[^`]*`[^.!?`]*)*[.!?])(?=\s|$)/)
    deckMarkdown = sentenceEnd ? sentenceEnd[1] : oneLine.slice(0, 200)
  }
  const eyebrow = section ? section.title : 'Document'
  return { title, deckMarkdown, eyebrow }
}

function stripHeader(md) {
  let out = md.replace(/^#\s+[^\n]+\n+/, '')
  // Non-greedy: only strip the first paragraph (up to the first blank line),
  // not everything up to the last blank line in the file.
  const m = out.match(/^([^\n]+(?:\n[^\n]+)*?)\n\s*\n/)
  if (m) {
    const first = m[1].trimStart()
    if (
      !first.startsWith('#') &&
      !first.startsWith('```') &&
      !first.startsWith('|') &&
      !first.startsWith('- ') &&
      !first.startsWith('* ') &&
      !first.startsWith('> ')
    ) {
      out = out.slice(m[0].length)
    }
  }
  return out
}

// ── Page template ────────────────────────────────────────────────────────
function pageHtml({ title, eyebrow, deckHtml, body, toc, project, basePathToHtml, isIndex }) {
  const nav = `
<nav class="he-nav">
  <a class="he-nav__brand" href="${basePathToHtml}index.html">${escapeHtml(project)} <small>docs</small></a>
  <div class="he-nav__links">
    <a href="${basePathToHtml}index.html">Index</a>
    <a href="${basePathToHtml}architecture/system-overview.html">Architecture</a>
    <a href="${basePathToHtml}guides/setup.html">Guides</a>
    <a href="${basePathToHtml}AUDIT_REPORT_2026-08-11.html">Audit</a>
    <a href="${basePathToHtml}UNDONE_ISSUES_2026-08-11.html">Issues</a>
  </div>
</nav>`

  const tocHtml =
    toc && toc.length >= 3
      ? `
<aside class="he-toc" aria-label="On this page">
  <p class="he-toc__label">On this page</p>
  <ul>
    ${toc.map((t) => `<li class="he-toc__l${t.depth}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('\n    ')}
  </ul>
</aside>`
      : ''

  const useTwoCol = !!tocHtml && !isIndex
  const layoutOpen = useTwoCol ? '<div class="he-layout">' : ''
  const layoutClose = useTwoCol ? '</div>' : ''
  const mainOpen = useTwoCol ? '<main class="he-main">' : '<main>'
  const mainClose = '</main>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)} · ${escapeHtml(project)}</title>
<link rel="stylesheet" href="${basePathToHtml}design-tokens.css">
<link rel="stylesheet" href="${basePathToHtml}docs.css">
</head>
<body>
<div class="he-shell ${useTwoCol ? 'he-shell--wide' : ''}">
${nav}
${layoutOpen}
${mainOpen}
<header>
  <p class="he-eyebrow">${escapeHtml(eyebrow)}</p>
  <h1 class="he-title">${escapeHtml(title)}</h1>
  ${deckHtml ? `<p class="he-deck">${deckHtml}</p>` : ''}
</header>
${body}
${mainClose}
${tocHtml}
${layoutClose}
<footer class="he-foot">
  Generated from Markdown · rebuild with <code>bun run docs:html</code>
</footer>
</div>
</body>
</html>
`
}

// ── File walking ─────────────────────────────────────────────────────────
async function walkMd(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const ent of entries) {
    if (ent.isDirectory()) continue
    if (ent.name.endsWith('.md')) out.push(path.join(dir, ent.name))
  }
  return out.sort()
}

async function buildPage({ src, outPath, section, project, basePathToHtml }) {
  const md = await fs.readFile(src, 'utf8')
  const { title, deckMarkdown, eyebrow } = parseHeader(md, path.basename(src, '.md'), section)
  const toc = extractToc(md)
  const stripped = stripHeader(md)

  const { renderer, resetCounter } = buildRenderer()
  resetCounter()
  const body = marked.parse(stripped, { gfm: true, renderer })
  const deckHtml = deckMarkdown ? marked.parseInline(deckMarkdown, { gfm: true }) : ''

  const html = pageHtml({ title, eyebrow, deckHtml, body, toc, project, basePathToHtml, isIndex: false })
  await fs.mkdir(path.dirname(outPath), { recursive: true })
  await fs.writeFile(outPath, html, 'utf8')
  return {
    slug: path.basename(src, '.md'),
    title,
    deck: deckMarkdown,
    srcRelative: path.relative(ROOT, src).replaceAll('\\', '/'),
  }
}

async function buildIndex({ project, sectionResults, topLevelResults }) {
  const sectionsHtml = sectionResults
    .map((s) => {
      const cards = s.files
        .map(
          (f) => `
    <a class="he-card" href="./${s.dir}/${f.slug}.html">
      <div class="he-card__eyebrow">${escapeHtml(s.title)}</div>
      <h3>${escapeHtml(f.title)}</h3>
      <p>${escapeHtml((f.deck || '').slice(0, 160))}</p>
      <div class="he-card__meta"><span>${escapeHtml(f.srcRelative)}</span></div>
    </a>`
        )
        .join('')
      return `
<section class="he-index-section" id="${s.dir}">
  <div class="he-index-section__head">
    <h2>${escapeHtml(s.title)}</h2>
    <p class="he-index-section__blurb">${escapeHtml(s.blurb)}</p>
  </div>
  <div class="he-grid">${cards}
  </div>
</section>`
    })
    .join('\n')

  // Top-level reports section
  const topLevelCards = topLevelResults
    .map(
      (f) => `
    <a class="he-card" href="./${f.slug}.html">
      <div class="he-card__eyebrow">${escapeHtml(f.eyebrow)}</div>
      <h3>${escapeHtml(f.title)}</h3>
      <p>${escapeHtml((f.deck || '').slice(0, 160))}</p>
      <div class="he-card__meta"><span>${escapeHtml(f.srcRelative)}</span></div>
    </a>`
    )
    .join('')

  const topLevelSection = topLevelResults.length > 0 ? `
<section class="he-index-section" id="reports">
  <div class="he-index-section__head">
    <h2>Reports & Trackers</h2>
    <p class="he-index-section__blurb">Audit reports, decisions, frameworks, and issue trackers.</p>
  </div>
  <div class="he-grid">${topLevelCards}
  </div>
</section>` : ''

  const total = sectionResults.reduce((s, sec) => s + sec.files.length, 0) + topLevelResults.length
  const body = `
<div class="he-kpis">
  <div class="he-kpi"><div class="he-kpi__value">${total}</div><div class="he-kpi__label">Generated pages</div></div>
  <div class="he-kpi"><div class="he-kpi__value">${sectionResults.length + (topLevelResults.length > 0 ? 1 : 0)}</div><div class="he-kpi__label">Sections</div></div>
</div>
${topLevelSection}
${sectionsHtml}
`

  const html = pageHtml({
    title: 'Documentation',
    eyebrow: `${project} · docs`,
    deckHtml:
      'All project documentation, organised by purpose. Markdown sources live in <code>docs/architecture</code>, <code>docs/guides</code>, and at the top level of <code>docs/</code>.',
    body,
    toc: [],
    project,
    basePathToHtml: './',
    isIndex: true,
  })
  await fs.writeFile(path.join(OUT, 'index.html'), html, 'utf8')
}

async function readProjectName() {
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'))
    if (pkg.name) {
      return pkg.name
        .split(/[-_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  } catch {}
  return 'Project'
}

async function main() {
  const project = await readProjectName()
  await fs.mkdir(OUT, { recursive: true })

  await fs.writeFile(path.join(OUT, 'design-tokens.css'), DESIGN_TOKENS_CSS, 'utf8')
  await fs.writeFile(path.join(OUT, 'docs.css'), SITE_CSS, 'utf8')

  const sectionResults = []
  for (const section of SECTIONS) {
    const srcDir = path.join(DOCS, section.dir)
    const outDir = path.join(OUT, section.dir)
    const files = await walkMd(srcDir)
    const built = []
    for (const src of files) {
      const slug = path.basename(src, '.md')
      const outPath = path.join(outDir, `${slug}.html`)
      built.push(await buildPage({ src, outPath, section, project, basePathToHtml: '../' }))
    }
    sectionResults.push({ ...section, files: built })
  }

  // Build top-level markdown files directly into docs/html/
  const topLevelResults = []
  for (const tl of TOP_LEVEL) {
    const src = path.join(DOCS, tl.file)
    const stat = await fs.stat(src).catch(() => null)
    if (!stat) continue
    const slug = path.basename(tl.file, '.md')
    const outPath = path.join(OUT, `${slug}.html`)
    const md = await fs.readFile(src, 'utf8')
    const { title, deckMarkdown, eyebrow } = parseHeader(md, slug, { title: tl.eyebrow })
    const toc = extractToc(md)
    const stripped = stripHeader(md)

    const { renderer, resetCounter } = buildRenderer()
    resetCounter()
    const body = marked.parse(stripped, { gfm: true, renderer })
    const deckHtml = deckMarkdown ? marked.parseInline(deckMarkdown, { gfm: true }) : ''

    const html = pageHtml({ title, eyebrow, deckHtml, body, toc, project, basePathToHtml: './', isIndex: false })
    await fs.writeFile(outPath, html, 'utf8')
    topLevelResults.push({
      slug,
      title,
      deck: deckMarkdown,
      eyebrow: tl.eyebrow,
      srcRelative: path.relative(ROOT, src).replaceAll('\\', '/'),
    })
  }

  await buildIndex({ project, sectionResults, topLevelResults })

  const total = sectionResults.reduce((s, sec) => s + sec.files.length, 0) + topLevelResults.length
  console.log(
    `[build-docs-html] generated ${total} HTML pages + index across ${SECTIONS.length} sections + ${topLevelResults.length} top-level reports (design-tokens + docs.css written into docs/html/)`
  )
}

// ── Embedded CSS (editorial design tokens + doc-site extensions) ──────────
const DESIGN_TOKENS_CSS = `/* Editorial design tokens for the Aerojet Careers docs site. */
:root {
  --clay: #D97757; --clay-soft: #E8A584; --slate: #141413; --ivory: #FAF9F5; --oat: #E3DACC;
  --white: #FFFFFF; --gray-100: #F0EEE6; --gray-300: #D1CFC5; --gray-500: #87867F; --gray-700: #3D3D3A;
  --success: #788C5D; --warning: #C78E3F; --danger: #B04A4A; --info: #5C7CA3;
  --success-soft: #EAEFE0; --warning-soft: #F5E9D2; --danger-soft: #F1DEDE; --info-soft: #DCE5F0;
  --bg: var(--ivory); --surface: var(--white); --surface-2: var(--gray-100);
  --border: var(--oat); --border-strong: var(--gray-300);
  --fg: var(--slate); --fg-muted: var(--gray-500); --fg-strong: var(--slate); --link: var(--clay);
  --font-sans: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "JetBrains Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --font-serif: ui-serif, Georgia, "Iowan Old Style", serif;
  --t-display-size: 48px; --t-h1-size: 32px; --t-h2-size: 24px; --t-h3-size: 18px;
  --t-body-size: 16px; --t-small-size: 14px; --t-caption-size: 12px; --t-caption-tracking: 0.08em;
  --t-body-weight: 430;
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px; --sp-7: 48px; --sp-8: 64px;
  --r-xs: 4px; --r-sm: 8px; --r-md: 12px; --r-lg: 20px; --r-pill: 999px;
  --col-narrow: 720px; --col-default: 880px; --col-wide: 1080px;
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font-family: var(--font-sans); font-size: var(--t-body-size); font-weight: var(--t-body-weight);
  line-height: 1.55; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
h1, h2, h3, h4 { color: var(--fg-strong); letter-spacing: -0.01em; margin: 0; }
h1 { font-size: var(--t-h1-size); font-weight: 500; line-height: 1.2; }
h2 { font-size: var(--t-h2-size); font-weight: 500; line-height: 1.3; }
h3 { font-size: var(--t-h3-size); font-weight: 500; line-height: 1.35; }
p { margin: var(--sp-3) 0; }
a { color: var(--link); text-decoration: none; border-bottom: 1px solid transparent; transition: border-color 120ms; }
a:hover { border-bottom-color: currentColor; }
code, kbd, samp { font-family: var(--font-mono); font-size: 0.92em; background: var(--surface-2); color: var(--fg-strong); padding: 1px 6px; border-radius: var(--r-xs); }
pre { font-family: var(--font-mono); font-size: var(--t-small-size); background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-sm); padding: var(--sp-4) var(--sp-5); overflow-x: auto; line-height: 1.5; }
pre code { background: transparent; padding: 0; }
blockquote { margin: var(--sp-5) 0; padding: var(--sp-4) var(--sp-5); background: var(--surface-2); border-left: 3px solid var(--clay); border-radius: 0 var(--r-sm) var(--r-sm) 0; color: var(--fg-muted); }
hr { border: 0; border-top: 1px solid var(--border); margin: var(--sp-6) 0; }
table { width: 100%; border-collapse: collapse; font-size: var(--t-small-size); margin: var(--sp-4) 0; }
th, td { padding: var(--sp-3) var(--sp-4); text-align: left; vertical-align: top; border-bottom: 1px solid var(--border); }
th { font-weight: 500; color: var(--fg-muted); font-size: var(--t-caption-size); text-transform: uppercase; letter-spacing: var(--t-caption-tracking); }
ul, ol { padding-left: var(--sp-5); margin: var(--sp-3) 0; }
li { margin: var(--sp-2) 0; }
::selection { background: var(--clay); color: var(--ivory); }
.he-shell { max-width: var(--col-default); margin: 0 auto; padding: var(--sp-6) var(--sp-5) var(--sp-8); }
.he-shell--wide { max-width: var(--col-wide); }
.he-nav { display: flex; align-items: baseline; gap: var(--sp-4); padding-bottom: var(--sp-4); margin-bottom: var(--sp-6); border-bottom: 1px solid var(--border); flex-wrap: wrap; }
.he-nav__brand { font-weight: 500; letter-spacing: -0.02em; color: var(--fg-strong); border-bottom: 0; }
.he-nav__brand small { color: var(--clay); margin-left: var(--sp-2); }
.he-nav__links { margin-left: auto; display: flex; gap: var(--sp-5); font-size: var(--t-small-size); }
.he-nav__links a { color: var(--fg-muted); }
.he-nav__links a:hover { color: var(--fg-strong); border-bottom-color: var(--fg-strong); }
.he-eyebrow { font-size: var(--t-caption-size); font-weight: 500; letter-spacing: var(--t-caption-tracking); text-transform: uppercase; color: var(--fg-muted); margin-bottom: var(--sp-3); }
.he-title { font-size: var(--t-display-size); font-weight: 500; line-height: 1.1; letter-spacing: -0.02em; margin: 0 0 var(--sp-3); }
.he-deck { font-size: var(--t-h3-size); color: var(--fg-muted); margin: 0 0 var(--sp-6); max-width: 60ch; }
.he-section { margin-top: var(--sp-7); padding-top: var(--sp-5); border-top: 1px solid var(--border); }
.he-section__num { display: inline-block; font-family: var(--font-mono); font-size: var(--t-caption-size); letter-spacing: 0.05em; color: var(--clay); margin-bottom: var(--sp-2); }
.he-section__title { font-size: var(--t-h2-size); font-weight: 500; margin: 0 0 var(--sp-4); }
.he-kpis { display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); margin: var(--sp-5) 0; }
.he-kpi { padding: var(--sp-4) var(--sp-5); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); }
.he-kpi__value { font-family: var(--font-mono); font-size: 28px; font-weight: 500; letter-spacing: -0.02em; color: var(--fg-strong); line-height: 1.1; }
.he-kpi__label { font-size: var(--t-caption-size); letter-spacing: var(--t-caption-tracking); text-transform: uppercase; color: var(--fg-muted); margin-top: var(--sp-2); }
.he-grid { display: grid; gap: var(--sp-4); grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); margin: var(--sp-5) 0; }
.he-card { padding: var(--sp-4) var(--sp-5); background: var(--surface); border: 1px solid var(--border); border-radius: var(--r-md); transition: border-color 160ms, transform 160ms; }
.he-card:hover { border-color: var(--clay); transform: translateY(-1px); }
.he-card__eyebrow { font-size: var(--t-caption-size); letter-spacing: var(--t-caption-tracking); text-transform: uppercase; color: var(--clay); margin-bottom: var(--sp-2); }
.he-card h3 { font-size: var(--t-h3-size); font-weight: 500; margin: 0 0 var(--sp-2); }
.he-card__meta { font-size: var(--t-small-size); color: var(--fg-muted); margin-top: var(--sp-3); font-family: var(--font-mono); }
.he-foot { margin-top: var(--sp-7); padding-top: var(--sp-4); border-top: 1px solid var(--border); font-size: var(--t-small-size); color: var(--fg-muted); }
`

const SITE_CSS = `/* TOC sidebar + index grid extensions. */
.he-layout { display: grid; grid-template-columns: 1fr; gap: var(--sp-6); }
@media (min-width: 1024px) { .he-layout { grid-template-columns: 1fr 220px; } }
.he-main { min-width: 0; }
.he-toc { position: sticky; top: var(--sp-5); align-self: start; padding: var(--sp-4) 0 var(--sp-4) var(--sp-4); border-left: 1px solid var(--border); font-size: var(--t-small-size); max-height: calc(100vh - var(--sp-7)); overflow-y: auto; }
.he-toc__label { font-size: var(--t-caption-size); letter-spacing: var(--t-caption-tracking); text-transform: uppercase; color: var(--fg-muted); margin: 0 0 var(--sp-3); }
.he-toc ul { list-style: none; padding: 0; margin: 0; }
.he-toc li { margin: var(--sp-2) 0; }
.he-toc__l3 { padding-left: var(--sp-3); }
.he-toc a { color: var(--fg-muted); border: 0; }
.he-toc a:hover { color: var(--clay); }
.he-index-section { margin-top: var(--sp-7); }
.he-index-section__head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sp-4); margin-bottom: var(--sp-4); padding-bottom: var(--sp-3); border-bottom: 1px solid var(--border); }
.he-index-section__head h2 { margin: 0; font-size: var(--t-h2-size); font-weight: 500; }
.he-index-section__blurb { color: var(--fg-muted); font-size: var(--t-small-size); margin: 0; max-width: 50ch; text-align: right; }
`

main().catch((err) => {
  console.error('[build-docs-html] failed:', err)
  process.exit(1)
})