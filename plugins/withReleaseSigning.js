const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Assina o build de release com a chave de UPLOAD da Play Store.
 * As credenciais vêm de propriedades Gradle (ex.: ~/.gradle/gradle.properties),
 * nunca do repositório:
 *   MUSCLE_UPLOAD_STORE_FILE, MUSCLE_UPLOAD_KEY_ALIAS,
 *   MUSCLE_UPLOAD_STORE_PASSWORD, MUSCLE_UPLOAD_KEY_PASSWORD
 * Sem elas, o release continua assinado com a chave de debug.
 */
const RELEASE_SIGNING = `
        release {
            if (project.hasProperty('MUSCLE_UPLOAD_STORE_FILE')) {
                storeFile file(MUSCLE_UPLOAD_STORE_FILE)
                storePassword MUSCLE_UPLOAD_STORE_PASSWORD
                keyAlias MUSCLE_UPLOAD_KEY_ALIAS
                keyPassword MUSCLE_UPLOAD_KEY_PASSWORD
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes('MUSCLE_UPLOAD_STORE_FILE')) return cfg;

    gradle = gradle.replace(/signingConfigs\s*\{/, (m) => m + RELEASE_SIGNING);

    const releaseBlock = /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/;
    if (!releaseBlock.test(gradle)) {
      throw new Error('withReleaseSigning: bloco buildTypes.release não encontrado no build.gradle');
    }
    gradle = gradle.replace(
      releaseBlock,
      "$1signingConfig project.hasProperty('MUSCLE_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );

    cfg.modResults.contents = gradle;
    return cfg;
  });
};
