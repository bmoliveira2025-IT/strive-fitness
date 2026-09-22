const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distDir = path.resolve(projectRoot, 'dist');

if (path.dirname(distDir) !== projectRoot || path.basename(distDir) !== 'dist') {
  throw new Error(`Refusing to clean unexpected output directory: ${distDir}`);
}

fs.rmSync(distDir, { recursive: true, force: true });

