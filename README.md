# RIDA website

Static website for **Runge Infectious Disease Analytics (RIDA)**, the professional technical platform of infectious-disease epidemiologist Dr Manuela Runge.

The site is intentionally lightweight. It uses plain HTML, CSS and a small JavaScript file, with no framework, database or installation step.

## Files

- `index.html` — homepage content and links
- `radar/index.html` — generated Weekly Radar archive
- `radar/YYYY-MM-DD.html` — generated newsletter issue pages
- `radar/issues/` — weekly newsletter Markdown source files
- `scripts/build-radar.mjs` — dependency-free newsletter page generator (Node.js 22+)
- `styles.css` — colours, typography, layout and responsive design
- `script.js` — automatically updates the copyright year
- `assets/` — logo and image assets used by the site
- `.github/workflows/pages.yml` — publishes the site to GitHub Pages after pushes to `main`
- `AGENTS.md` — guidance for working on the site with Codex or another coding assistant
- `.nojekyll` — tells GitHub Pages to publish the files without Jekyll processing

## Edit in Cursor

1. Extract the downloaded ZIP.
2. Open Cursor.
3. Select **File → Open Folder** and choose the website folder.
4. Edit the wording in `index.html`.
5. Save the file and open `index.html` in a browser to inspect it.

For automatic browser refresh, install a local preview extension such as Live Server. Alternatively, from a terminal in the project folder, run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` and stop the server with `Ctrl+C` when finished.

## Work with Codex

Open this folder as the workspace and describe the changes you want. For example:

> In the RIDA website, revise the Evidence Review & Synthesis description without changing the layout. Validate the links and responsive styling afterwards.

The `AGENTS.md` file gives Codex the project-specific boundaries.

## Create a GitHub repository

1. Sign in to GitHub and create a new repository, such as `runge-idanalytics`.
2. Do not initialize it with a README, license or `.gitignore`; these are already included.
3. In a terminal opened in this folder, run:

```bash
git init
git add .
git commit -m "Initial RIDA website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/runge-idanalytics.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username.

## Publish with GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions**.
4. Push a commit to `main`, or run the **Deploy GitHub Pages** workflow manually from the **Actions** tab.
5. Wait for GitHub to show the published URL.

The initial address will normally follow this pattern:

`https://YOUR-USERNAME.github.io/runge-idanalytics/`

## Connect a custom domain

Once the site works at its GitHub address:

1. Add the domain under **Settings → Pages → Custom domain**.
2. Apply the DNS records requested by GitHub through the company where the domain is registered.
3. Wait for GitHub's DNS check to succeed.
4. Enable **Enforce HTTPS**.

GitHub may create a `CNAME` file in the repository. Keep that file once a custom domain is connected.

## AI assistance statement

This website was created with AI assistance. Its content is based on human-provided information and has been reviewed by Manuela Runge. Any use of AI in collaborative work is agreed separately according to project scope, requirements and safeguards.

## Before public launch

- Replace the email address if a dedicated RIDA address becomes available.
- Confirm the final professional and conflict-of-interest wording.
- Decide whether to add a short legal notice and privacy statement.
- Test every link on desktop and mobile.
- Consider replacing the externally loaded Google fonts with locally hosted or system fonts if avoiding third-party font requests is important.
- Avoid adding analytics, cookies or a contact form until there is a clear need and an appropriate privacy setup.

## Updating the live site

### Add a weekly RIDA Radar issue

1. Save the new Markdown file in `radar/issues/` as `rida-radar-YYYY-MM-DD.md`.
2. Use the pilot's front matter, with a unique issue number and a matching date:

   ```yaml
   ---
   title: "RIDA Radar — Issue 002"
   date: 2026-10-24
   description: "A weekly catch-up on infectious disease research, methods and policy."
   category: "RIDA Radar"
   status: draft
   issue: 2
   ---
   ```

3. Write the issue using paragraphs, `##` sections, `###` item headings, `-` bullet lists, `**bold**`, `*italic*`, Markdown links and `---` dividers. Raw HTML is escaped. The page supplies the main heading and a contents list automatically.
4. Run `node scripts/build-radar.mjs` with Node.js 22 or newer. No packages need installing. The archive sorts issues by date, with the newest at the top. The script also refreshes the existing `dist/` static hosting copy.
5. Preview the homepage, `radar/` and the new issue locally, including on a narrow screen. Stage the Markdown, generated HTML and updated `dist/` files together.

Draft issues are included and clearly labelled **Pre-release draft**. The pilot's wording and editorial note are preserved. The status is a visible label, not access control: every file in `radar/` is included in deployment. Keep private drafts outside this folder. Before publishing a final edition, finish the editorial checks, update any draft wording in the issue body and set `status: published`.

GitHub Pages rebuilds the newsletter pages automatically before deployment. If deploying through another static host, regenerate the pages and include the `radar/` folder alongside the homepage and assets.

### Review and publish

After editing and reviewing locally:

```bash
git add .
git commit -m "Describe the website update"
git push
```

The GitHub Actions workflow will publish the updated version automatically.
