// CommonJS metro config for Windows compatibility
const path = require("path");

// Explicitly require from local node_modules
const getDefaultConfig = require(
  path.resolve(__dirname, "node_modules/expo/metro-config")
).getDefaultConfig;

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = config;
