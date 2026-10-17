// Dependency-free static renderer for the newsletter's Markdown format.
// Run from any directory: node scripts/build-radar.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const radar = join(root, 'radar');
const issuesDir = join(radar, 'issues');
mkdirSync(issuesDir, { recursive: true });
const escape = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const inline = text => escape(text)
  .replace(/\[([^\]]+)\]\((https?:\/\/(?:[^\s()]|\([^()\s]*\))+)\)/g, '<a href="$2">$1</a>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>');
const formatDate = date => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));

function renderMarkdown(body) {
  const output = [], toc = [], usedIds = new Set();
  let paragraph = [], list = false;
  function flush() {
    if (paragraph.length) output.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  }
  function closeList() { if (list) output.push('</ul>'); list = false; }
  for (const line of body.split('\n')) {
    if (/^# /.test(line)) continue; // The page template provides the one h1.
    const heading = /^(#{2,3}) (.+)$/.exec(line);
    if (heading) {
      flush(); closeList();
      const level = heading[1].length;
      const base = slug(heading[2]);
      let id = base, suffix = 2;
      while (usedIds.has(id)) id = `${base}-${suffix++}`;
      usedIds.add(id);
      output.push(`<h${level} id="${id}">${inline(heading[2])}</h${level}>`);
      if (level === 2) toc.push(`<li><a href="#${id}">${escape(heading[2])}</a></li>`);
    } else if (/^- /.test(line)) {
      flush();
      if (!list) output.push('<ul>');
      list = true;
      output.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim() === '---') {
      flush(); closeList(); output.push('<hr>');
    } else if (!line.trim()) {
      flush(); closeList();
    } else {
      closeList(); paragraph.push(line.trim());
    }
  }
  flush(); closeList();
  return { html: output.join('\n'), toc: toc.join('\n') };
}

const issues = readdirSync(issuesDir).filter(name => /^rida-radar-\d{4}-\d{2}-\d{2}\.md$/.test(name)).map(file => {
  const source = readFileSync(join(issuesDir, file), 'utf8').replace(/\r\n/g, '\n');
  const front = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/.exec(source);
  if (!front) throw new Error(`Missing front matter: ${file}`);
  const meta = Object.fromEntries(front[1].split('\n').filter(Boolean).map(line => {
    const field = /^([a-z]+):\s*(.*?)\s*$/.exec(line);
    if (!field) throw new Error(`Invalid metadata in ${file}: ${line}`);
    return [field[1], field[2].replace(/^"(.*)"$/, '$1')];
  }));
  if (!meta.title || !meta.description || !/^\d{4}-\d{2}-\d{2}$/.test(meta.date) || !/^\d+$/.test(meta.issue) || !['draft', 'published'].includes(meta.status)) {
    throw new Error(`Required metadata: title, description, date, issue, status (draft or published): ${file}`);
  }
  if (file !== `rida-radar-${meta.date}.md`) throw new Error(`Filename must match date: ${file}`);
  formatDate(meta.date); // Reject invalid dates before writing any output.
  return { ...meta, file, page: `${meta.date}.html`, ...renderMarkdown(front[2]) };
}).sort((a, b) => b.date.localeCompare(a.date));
if (!issues.length) throw new Error('No newsletter Markdown files found.');
if (new Set(issues.map(issue => Number(issue.issue))).size !== issues.length) throw new Error('Issue numbers must be unique.');

function layout(title, description, content) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} — RIDA</title>
  <meta name="description" content="${escape(description)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Manrope:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../styles.css">
  <link rel="icon" type="image/png" href="../assets/rida-turtle.png">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="../" aria-label="RIDA home"><img class="brand-logo" src="../assets/rida-logo.png" alt="RIDA"><span class="sr-only">Runge Infectious Disease Analytics</span></a>
    <nav aria-label="Main navigation">
      <a href="../#expertise">Expertise</a>
      <a href="../#approach">Approach</a>
      <a href="./" aria-current="page">Weekly Radar</a>
      <a class="nav-cta" href="../#contact">Contact</a>
    </nav>
  </header>
  <main class="radar-main" id="top"><div class="radar-wrap">
${content}
  </div></main>
  <footer>
    <div class="footer-brand"><strong>RIDA</strong><span>Runge Infectious Disease Analytics</span></div>
    <p>Infectious-disease epidemiology & analytics · Switzerland</p>
    <p>© <span id="year"></span> Manuela Runge</p>
  </footer>
  <script src="../script.js"></script>
</body>
</html>
`;
}

const badge = issue => issue.status === 'draft' ? '<span class="draft-label">Pre-release draft</span>' : '';
const number = issue => String(issue.issue).padStart(3, '0');
function card(issue) {
  return `<article class="issue-card">
    <p class="radar-meta"><time datetime="${issue.date}">${formatDate(issue.date)}</time> ${badge(issue)}</p>
    <h3><a href="${issue.page}">Issue ${number(issue)} <span aria-hidden="true">↗</span></a></h3>
    <p>${escape(issue.description)}</p>
  </article>`;
}

for (const issue of issues) {
  writeFileSync(join(radar, issue.page), layout(issue.title, issue.description, `
    <a class="radar-back" href="./">← All RIDA Radar issues</a>
    <p class="section-number">Weekly Radar / Issue ${number(issue)}</p>
    <h1>RIDA Radar</h1>
    <p class="radar-meta"><time datetime="${issue.date}">${formatDate(issue.date)}</time> ${badge(issue)}</p>
    <nav class="radar-toc" aria-label="In this issue"><div><h2>In this issue</h2><ul>${issue.toc}</ul></div></nav>
    <article class="newsletter" aria-label="RIDA Radar issue ${number(issue)}">
${issue.html}
    </article>
    <div class="radar-end"><a href="./">← Browse the archive</a> · <a href="issues/${issue.file}" download>Download Markdown</a> · <a href="#top">Back to top ↑</a></div>`));
}
writeFileSync(join(radar, 'index.html'), layout('RIDA Radar', 'A weekly catch-up on infectious disease research, methods and policy. Browse RIDA Radar and its issue archive.', `
    <a class="radar-back" href="../">← RIDA home</a>
    <p class="section-number">Weekly Radar</p>
    <h1>RIDA Radar</h1>
    <p class="intro">A weekly catch-up on infectious disease research, methods and policy.</p>
    <p>An AI-assisted, human-guided selection of developments in infectious disease epidemiology, modelling, methods and public health policy. A selective reading list, with human editorial judgement and review.</p>
    <section class="radar-archive" id="latest" aria-labelledby="latest-heading">
      <h2 id="latest-heading">Latest issue</h2>
${card(issues[0])}
    </section>
    <section class="radar-archive" aria-labelledby="archive-heading">
      <h2 id="archive-heading">Issue archive</h2>
      ${issues.length > 1 ? issues.slice(1).map(card).join('\n') : '<p>This is the pilot issue. Future weekly editions will appear here.</p>'}
    </section>`));
console.log(`Built Radar archive and ${issues.length} issue page(s).`);

// Keep the existing Sites static directory aligned with the source site.
const dist = join(root, 'dist');
mkdirSync(dist, { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js', '.nojekyll', 'assets', 'radar']) {
  if (existsSync(join(root, file))) cpSync(join(root, file), join(dist, file), { recursive: true });
}
