import fs from 'node:fs';
const html = fs.readFileSync('web/index.html', 'utf8');
if (!html.includes('<title>')) { console.error('web/index.html needs a <title>'); process.exit(1); }
console.log('web lint ok');
