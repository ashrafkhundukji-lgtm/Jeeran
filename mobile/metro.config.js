// Metro: the app may import a few framework-free modules from the website
// (../src/lib — copy tables and categories, see src/shared/web.ts) so the
// strings stay in one place. Only that folder is watched; nothing else of
// the website is visible to the bundler.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.watchFolders = [path.resolve(__dirname, '../src/lib')]
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')]

module.exports = config
