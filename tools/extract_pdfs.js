const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Directory containing PDFs
const pdfDir = path.join(__dirname, '..', 'images', 'mudras');
const outFile = path.join(__dirname, '..', 'data', 'mudras.json');

async function extractAll() {
  const files = fs.readdirSync(pdfDir).filter(f => f.toLowerCase().endsWith('.pdf'));
  const result = {};

  for (const file of files) {
    const filePath = path.join(pdfDir, file);
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      // Use filename (without extension) as key
      const key = path.basename(file, path.extname(file)).toLowerCase().replace(/\s+/g, '_');
      result[key] = {
        file: path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/'),
        text: data.text
      };
      console.log('Extracted', file);
    } catch (err) {
      console.error('Failed to extract', file, err.message);
    }
  }

  // Ensure output dir
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(result, null, 2));
  console.log('Wrote', outFile);
}

extractAll().catch(err => {
  console.error(err);
  process.exit(1);
});
