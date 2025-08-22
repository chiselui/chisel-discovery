
const express = require('express');
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const draft2020 = require('ajv/dist/2020');
const puppeteer = require('puppeteer');

const PORT = process.env.PORT || 4000;
const app = express();
app.use(express.json({limit: '2mb'}));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// Configure Nunjucks
const templatesPath = path.join(__dirname, '..', 'templates');
nunjucks.configure(templatesPath, { autoescape: true, express: app });

// Load schema + validator
const schemaPath = path.join(__dirname, '..', 'schema', 'report.v0.1.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new draft2020.default({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

function validatePayload(payload){
  const ok = validate(payload);
  if (!ok) {
    const first = validate.errors[0];
    const pointer = first.instancePath || first.schemaPath;
    const message = first.message;
    const error = { error: 'validation_failed', path: pointer, message, details: validate.errors };
    const e = new Error(JSON.stringify(error));
    e.status = 400;
    throw e;
  }
}

function renderHTML(payload){
  // For now only cover page; later you can swap to "document.njk" and include sections.
  return nunjucks.render('cover.njk', payload);
}

// POST /render/html
app.post('/render/html', (req, res, next) => {
  try {
    const payload = req.body;
    validatePayload(payload);
    const html = renderHTML(payload);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  } catch (err) {
    next(err);
  }
});

// POST /render/pdf
app.post('/render/pdf', async (req, res, next) => {
  try {
    const payload = req.body;
    validatePayload(payload);
    const html = renderHTML(payload);

    const browser = await puppeteer.launch({
      headless: 'new', // modern headless mode
      args: ['--no-sandbox', '--font-render-hinting=medium']
    });
    const page = await browser.newPage();

    // Serve HTML via data URL to preserve assets base path (/public)
    // Instead, we mount a tiny server route; but since CSS is under /public, we need absolute URL.
    // Build an absolute URL for the CSS by replacing href="/public" with http://localhost:PORT/public
    const absHtml = html.replaceAll('href="/public', `href="http://localhost:${PORT}/public`);

    await page.setContent(absHtml, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    await browser.close();

    const safeName = `${(payload.student?.last_name || 'Report')}`.replace(/[^a-z0-9_\-]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Chisel_${safeName}.pdf"`);
    res.status(200).send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

// error handler
app.use((err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';
  try {
    const asObj = JSON.parse(message);
    return res.status(status).json(asObj);
  } catch (_) {
    return res.status(status).json({ error: 'server_error', message });
  }
});

app.listen(PORT, () => {
  console.log(`Chisel render service running on http://localhost:${PORT}`);
});
