// The app's display name is Arabic ("جيران للأعمال"). Expo prebuild also
// uses it as the Gradle root project name, and Gradle on Windows fails on
// it ("The filename, directory name, or volume label syntax is incorrect").
// Only the internal Gradle project name is changed; the launcher label
// (strings.xml app_name) stays the Arabic name.
const { withSettingsGradle } = require('expo/config-plugins')

module.exports = function withAsciiProjectName(config, name = 'JeeranBusiness') {
  return withSettingsGradle(config, (c) => {
    c.modResults.contents = c.modResults.contents.replace(/rootProject\.name\s*=\s*['"].*['"]/, `rootProject.name = '${name}'`)
    return c
  })
}
