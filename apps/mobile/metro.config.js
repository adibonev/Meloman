// NativeWind v4 metro setup (CLAUDE.md §2.2). Wraps Expo's default
// Metro config so the Tailwind input is compiled and class names resolve
// at bundle time.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./src/global.css" });
