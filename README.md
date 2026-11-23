# Teaching website: Dr. Junaid Alam Khan

Live site: https://junaidalamkhan-stack.github.io/jakmathematics/

A static teaching website (no build step, no database). Everything it shows comes from two files:

| File | What it holds |
|---|---|
| `content/courses.json` | Courses, units, lectures, Google Drive PDF links and YouTube videos |
| `content/site.json` | Name, About me, photo, awards, research, CV sections, contact details and links |

```
index.html              page shell
assets/css/styles.css   design
assets/js/app.js        renders the pages from the JSON files
content/                the files you normally edit
admin/                  no-code editor (Sveltia CMS)
tools/check-content.mjs checks the content
AGENTS.md               instructions for AI assistants editing this site
```

## Publishing

The site is served by GitHub Pages from the `main` branch (Settings → Pages → Deploy from a branch → `main` / root). Every change committed to `main` goes live within a minute or two.

## Editing

- **On github.com:** open `content/courses.json` or `content/site.json`, click the pencil, edit, and commit.
- **No-code editor:** open `https://junaidalamkhan-stack.github.io/jakmathematics/admin/`, choose **Sign in with token**, and use a GitHub fine-grained personal access token with access to this repository and **Contents: Read and write**.
- **With an AI assistant:** give it this repository; `AGENTS.md` explains the content format.

Lecture PDFs are linked from Google Drive. Students can open them only if the Drive folders are shared as **Anyone with the link → Viewer**.

## Checking the content

```bash
node tools/check-content.mjs          # prints "Content OK"
python3 -m http.server 8000           # preview at http://localhost:8000
```
