
# Chisel Report Renderer — Starter (cover page v0.1)

This is a tiny, ready-to-run service that turns a **Chisel Report JSON** into a **print-ready PDF**.
It currently renders only the **cover page** (title + student details). Charts/sections can be added later.

## Prereqs
- **Node.js 18+**
- macOS, Windows, or Linux. (First run downloads Chromium via Puppeteer.)

## Quickstart
```bash
cd chisel-report-renderer-starter
npm install
npm run dev
```
You should see: `Chisel render service running on http://localhost:4000`

## Try rendering the sample
In a second terminal:
```bash
npm run render:sample:html   # writes output/sample.html
npm run render:sample:pdf    # writes output/sample.pdf
```

Or with curl:
```bash
curl -s -X POST http://localhost:4000/render/pdf   -H "Content-Type: application/json"   --data-binary @examples/report.example.v0.1.json   -o output/report.pdf
```

## API
- `POST /render/html` — returns HTML
- `POST /render/pdf` — returns PDF (attachment)
- Payload must conform to `schema/report.v0.1.json` (AJV validation).

## Where to edit templates
- `templates/base.njk` — HTML skeleton + footer + CSS link
- `templates/cover.njk` — cover markup (extends base.njk)
- `public/styles.css` — print CSS (A4 layout, margins, tokens)

## Next steps
- Add **charts**: extend schema to include `visuals[]`, create a `document.njk` that `{% include 'cover.njk' %}` and a new `visuals.njk` section, then swap the renderer to use `document.njk`.
- Add **sections**: loop `sections[]` and support `type: markdown` etc.
- Add **React uploader**: a small page that `POST`s a JSON file to `/render/pdf` and triggers download.

---

> Tip: If CSS doesn't load in the PDF, make sure the service is running on the same port you used when generating the PDF. The server rewrites `/public/...` to an absolute URL so Chromium can fetch it.
