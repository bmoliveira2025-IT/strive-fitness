const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");


const config = getDefaultConfig(__dirname);

// TFJS Model Support
config.resolver.assetExts = Array.from(new Set([
  ...config.resolver.assetExts,
  'bin',
  'glb',
  'gltf',
]));
config.resolver.sourceExts = Array.from(new Set([
  ...config.resolver.sourceExts,
  'cjs',
  'json',
  'tf',
]));

module.exports = withNativeWind(config, { input: "./global.css" });
