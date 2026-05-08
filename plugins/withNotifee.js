const { withSettingsGradle } = require("@expo/config-plugins");

/**
 * Adds the notifee local Maven repo into the existing dependencyResolutionManagement
 * repositories block in settings.gradle so Gradle 7+ can resolve app.notifee:core,
 * which is bundled inside the package's android/libs.
 */
module.exports = function withNotifee(config) {
  return withSettingsGradle(config, (mod) => {
    const tag = "// notifee-maven";
    if (mod.modResults.contents.includes(tag)) return mod;

    const mavenEntry = `        ${tag}\n        maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }\n`;

    // Insert before the closing brace of the repositories { } block
    mod.modResults.contents = mod.modResults.contents.replace(
      /(dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{)([\s\S]*?)(\})/,
      (match, open, inner, close) => `${open}${inner}${mavenEntry}${close}`
    );

    return mod;
  });
};
