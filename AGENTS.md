# Instructions for AI assistants editing this website

This is the teaching website of Dr. Junaid Alam Khan (Associate Professor of Mathematics, IBA Karachi). It is a static site: `assets/js/app.js` renders everything from two JSON files. **Almost every request is a change to `content/courses.json` or `content/site.json`, plus adding PDFs under `materials/`.** Do not edit `app.js`, `index.html` or `styles.css` unless the owner asks for a design or behaviour change.

## Rules

1. Never invent credentials, dates, awards, publications or course history. The CV (`files/CV_Junaid_Alam_Khan.pdf`) is the authority for biographical facts.
2. Keep JSON valid (double quotes, no trailing commas). Preserve existing key order and 2-space indentation.
3. Paths are relative with no leading slash: `materials/linear-algebra/LA-03-independence.pdf`.
4. Dates are `YYYY-MM-DD`. Set `updated` to today's date whenever you add or replace a lecture's files; this drives *Latest teaching materials* and the “New” badge (14 days).
5. After every change run `node tools/check-content.mjs` and fix anything it reports.
6. Teaching comes first: keep Courses and Teaching ahead of Research and Developer in the navigation.

## `content/courses.json`

```jsonc
{
  "courses": [
    {
      "id": "linear-algebra",          // URL id: lowercase, digits, hyphens; unique; page is #course-<id>
      "title": "Linear Algebra",
      "level": "Undergraduate",        // "Undergraduate" | "Graduate"
      "status": "active",              // "active" = has a course page; "archived" = listed under "Also taught"
      "featured": true,                // show card on the homepage
      "order": 1,                      // sort order (smaller first)
      "icon": "matrix",                // matrix | graph | integral | group | topology | curve | arrow
      "term": "Fall 2026",             // optional
      "summary": "One line for the course card.",
      "description": "Paragraph for the course page.",
      "prerequisites": "", "textbook": "",
      "cvTitle": "",                   // name as on the CV if different, e.g. "Abstract Algebra I"
      "coveredBy": "",                 // for an archived course whose material lives on another page (e.g. "calculus")
      "lectures": [
        {
          "number": 1,                  // unique within the course
          "title": "Systems of Linear Equations and Row Reduction",
          "topic": "Linear Systems",    // lectures are grouped under this heading
          "summary": "Short description.",
          "lecture": "https://drive.google.com/file/d/<FILE_ID>/view",     // main lecture PDF: Drive link or materials/... path
          "slides": "",                                                     // "" if none
          "notes": "",                                                      // "" if none
          "extras": [ { "label": "Problem Set 1", "type": "problems", "url": "materials/linear-algebra/LA-PS01.pdf" } ],
          // extras.type: lecture | problems | solutions | notes | slides | other
          "video": "",                  // optional YouTube link; shows a "Watch" button
          "updated": "2026-09-08"
        }
      ]
    }
  ]
}
```

Google Drive links (`https://drive.google.com/file/d/<ID>/view`) open in Drive's viewer; the file must be shared as "Anyone with the link". Linear Algebra lectures live in the Drive folder `LinearAlgebra_Lectures_VisualEnhanced`.

A lecture with no `lecture`, `slides`, `notes` or `extras` shows as “Coming soon”.

## Common tasks

**Add a lecture with slides.** Copy the PDF to `materials/<course-id>/` using the pattern `<CODE>-<NN>-<short-title>.pdf` (codes: LA, GT, CAL, AA; invent a short code for new courses). Append a lecture object with the next number, or fill in the existing “Coming soon” lecture with that number. Set `updated`.

**Replace slides.** Overwrite the file (or add a new file and point `slides` at it) and set `updated` to today.

**Activate a course from the CV list.** Find it in `courses.json` (all CV courses are already present as `archived`), set `status` to `"active"`, write `summary` and `description`, choose an `icon`, optionally `featured: true`, and add lectures.

**Add a brand-new course.** Append a course object with a new unique `id` and a suitable `order`.

**Update the homepage notice.** `site.json → announcement` (`show`, `text`, `link`).

**Add a YouTube video to a lecture.** Set that lecture's `video` to the video URL. For several language versions use `videos: [{"label": "English", "url": ...}, {"label": "Urdu/Hindi", "url": ...}]`.

**Units with a booklet or playlist.** A course may have `units: [{name, summary, booklet, playlists: [{label, url}]}]`. `name` must equal the `topic` of that unit's lectures; the booklet (PDF path or Drive link) and playlists are shown above those lectures. The course `matric-mathematics` (9th & 10th Mathematics, AKU-EB and other boards) uses this: one booklet per unit from the Drive folder `AKU-EB-9th & 10th-Mathematics`, and lectures that are video-only. `unitNumber` is the lecture number shown within its unit (the `number` stays unique across the course).

**Add a SINGULAR library or repository (Developer page).** Append to `site.json → research.software`: `{name, title, platform, authors, text, availability, url, repo}`. Use `repo` for a GitHub URL; leave it empty for libraries shipped with SINGULAR. Other repositories on the GitHub profile are listed automatically on the live site.

**Add a research interest.** Append `{title, text}` to `site.json → research.interests`.

**Change profile links.** `site.json → links` (`github`, `youtube`, `linkedin`). Empty values are hidden.

**Update office hours / contact.** `site.json → officeHours`, `office`, `email`.

**Add an award, thesis or publication.** Append to `site.json → awards` (set `teaching: true` only for teaching awards), `supervision.phd|masters|undergraduate`, or `research.publications`. Only with a source the owner has provided.

## `content/site.json` keys

`name, shortName, title, department, institution, institutionShort, email, links{github,youtube,linkedin}, cvPdf, photo, heroIntro, announcement{show,text,link}, teachingSummary, teachingApproach[{title,text}], officeHours, office, studentNote, bio[paragraphs], education[{degree,institution,period,details[]}], appointments[{role,institution,period}], leadership[{role,institution,period,details[]}], service[{role,period}], awards[{title,body,year,teaching}], supervision{phd[],masters[],undergraduate[] of {student,title,year}}, research{summary,interests[{title,text}],software[{name,title,platform,authors,text,availability,url,repo}],publications[{title,authors,venue,year,doi,url}]}, devLinks[{title,text,url}], technologies[{name,text}]`

## Checking your work

```bash
node tools/check-content.mjs         # must print "Content OK"
python3 -m http.server 8000          # then open http://localhost:8000/#course-<id>
```
