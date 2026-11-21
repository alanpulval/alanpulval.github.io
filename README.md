# alanpulval.github.io

Personal academic homepage of **Alan Pulval-Dady**, PhD student in cryptography at the
Research Institute CODE, Universität der Bundeswehr München.

The site is a static, dependency-free single page hosted with GitHub Pages.

## Structure

```
index.html          Page structure and metadata
styles.css          Layout, typography, responsive and print styles
script.js           Renders the data files and handles navigation
news.js             News items
publications.js     Publications, grouped by year
cv.js               CV sections
teaching.js         Teaching and supervised theses
seminar.js          CODE Crypto Seminar talks (section hidden when empty)
```

## Editing content

Content lives in the JavaScript data files, so no build step is required.

- **News** — add an object to `window.NEWS` in `news.js` with `date` (`YYYY-MM-DD`),
  `description`, and an optional `link: { label, url }`.
- **Publications** — add an object to `window.PUBLICATIONS` in `publications.js` with
  `year`, `type`, `title`, `authors`, `venue`, and `links`.
- **CV** — add sections and entries to `window.CV_SECTIONS` in `cv.js`.
- **Teaching** — add categories and year groups to `window.TEACHING` in `teaching.js`.
- **Seminar** — add talks to `window.SEMINAR_TALKS` in `seminar.js`. The seminar section
  and its navigation link are shown automatically as soon as a talk is present.

After editing a file, bump its `?v=` query string in `index.html` if the change does not
appear because of browser caching.

## Local preview

Any static file server works:

```bash
py -3 -m http.server 4173
```

Then open <http://127.0.0.1:4173/>.

## Deployment

The repository is published through GitHub Pages from the `main` branch. Commit and push
the changes; GitHub Pages serves the updated site at <https://alanpulval.github.io/>.

## Design

- Editorial academic layout: cool blue background, deep blue accents, navy contact panel.
- Serif display headings with a system sans-serif body for fast, dependency-free rendering.
- Responsive navigation, accessible landmarks, keyboard focus states, and print styles.
- Metadata includes Open Graph, Twitter cards, and schema.org `Person` structured data.
