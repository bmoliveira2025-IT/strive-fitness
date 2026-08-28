const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");


const config = getDefaultConfig(__dirname);

// TFJS Model Support
config.resolver.assetExts.push('bin');
config.resolver.sourceExts.push('cjs', 'json', 'tf');

module.exports = withNativeWind(config, { input: "./global.css" });
