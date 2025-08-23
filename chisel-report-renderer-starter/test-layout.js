const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

// Configure Nunjucks
const templatesPath = path.join(__dirname, 'templates');
nunjucks.configure(templatesPath, { autoescape: true });

// Load example data
const exampleData = JSON.parse(fs.readFileSync('examples/report.example.v0.1.json', 'utf8'));

// Render HTML
const html = nunjucks.render('document.njk', exampleData);

// Write to output
fs.writeFileSync('output/test-layout.html', html);
console.log('HTML generated: output/test-layout.html');
console.log('Open this file in a browser to check the layout');