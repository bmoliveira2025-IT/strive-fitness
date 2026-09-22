const fs = require('fs');
const path = require('path');

const distDirectory = path.resolve(__dirname, '..', 'dist');

if (!fs.existsSync(distDirectory)) {
  process.exit(0);
}

for (const entry of fs.readdirSync(distDirectory, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.toLowerCase().endsWith('.apk')) {
    fs.rmSync(path.join(distDirectory, entry.name));
  }
}
