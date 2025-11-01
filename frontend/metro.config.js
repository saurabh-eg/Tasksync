// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Enable bundle optimization for production
config.transformer.minifierConfig = {
  mangle: {
    keep_fnames: true,
  },
  output: {
    ascii_only: true,
    quote_style: 3,
    wrap_iife: true,
  },
  sourceMap: false,
  toplevel: false,
  warnings: false,
  ecma: 5,
  keep_classnames: false,
  keep_fnames: false,
  ie8: false,
  module: false,
  nameCache: null,
  safari10: false,
  webkit: false,
};

// Tree shake unused code
config.transformer.enableBabelRCLookup = false;

module.exports = config;

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;
