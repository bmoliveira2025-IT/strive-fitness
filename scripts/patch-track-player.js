const fs = require('fs');
const path = require('path');

const modulePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-track-player',
  'android',
  'src',
  'main',
  'java',
  'com',
  'doublesymmetry',
  'trackplayer',
  'module',
  'MusicModule.kt'
);

if (!fs.existsSync(modulePath)) {
  console.warn('[track-player patch] MusicModule.kt was not found; skipping.');
  process.exit(0);
}

let source = fs.readFileSync(modulePath, 'utf8');
const replacements = [
  [
    'callback.resolve(Arguments.fromBundle(musicService.tracks[index].originalItem))',
    'callback.resolve(musicService.tracks[index].originalItem?.let { Arguments.fromBundle(it) })',
  ],
  [
    `else Arguments.fromBundle(\n                musicService.tracks[musicService.getCurrentTrackIndex()].originalItem\n            )`,
    `else musicService.tracks[musicService.getCurrentTrackIndex()].originalItem?.let {\n                Arguments.fromBundle(it)\n            }`,
  ],
];

let changed = false;
for (const [before, after] of replacements) {
  if (source.includes(before)) {
    source = source.replace(before, after);
    changed = true;
  }
}

if (changed) {
  fs.writeFileSync(modulePath, source);
  console.log('[track-player patch] React Native 0.81 compatibility patch applied.');
} else {
  console.log('[track-player patch] Already applied or no longer required.');
}
