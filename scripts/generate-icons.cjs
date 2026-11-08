/**
 * Utility script to generate 100% compliant Windows icon (.ico) with multi-resolutions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const rootDir = path.resolve(__dirname, '..');
const buildDir = path.join(rootDir, 'build');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const sourceCandidates = [
  path.join(rootDir, 'public/assets/aistudio/Minimalist_White_Navigation_Icon_63543507.png'),
  path.join(buildDir, 'icon.png'),
  path.join(publicDir, 'icon.png'),
];

let foundSource = null;
for (const p of sourceCandidates) {
  if (fs.existsSync(p)) {
    foundSource = p;
    break;
  }
}

if (!foundSource) {
  console.error('[Icon Generator] No source icon image found in candidates:', sourceCandidates);
  process.exit(1);
}

console.log(`[Icon Generator] Using source: ${foundSource}`);

try {
  const sizes = [16, 32, 48, 64, 128, 256];
  const tempPngs = [];

  for (const size of sizes) {
    const outPath = path.join(buildDir, `temp_${size}.png`);
    execSync(`convert "${foundSource}" -resize ${size}x${size} -background black -alpha off "${outPath}"`);
    tempPngs.push(outPath);
  }

  // 512x512 master icon
  execSync(`convert "${foundSource}" -resize 512x512 "${path.join(buildDir, 'icon.png')}"`);
  execSync(`cp "${path.join(buildDir, 'icon.png')}" "${path.join(publicDir, 'icon.png')}"`);
  execSync(`cp "${path.join(buildDir, 'icon.png')}" "${path.join(publicDir, 'logo.png')}"`);

  // Build multi-res ICO
  pngToIco(tempPngs)
    .then((buf) => {
      fs.writeFileSync(path.join(buildDir, 'icon.ico'), buf);
      fs.writeFileSync(path.join(buildDir, 'installerIcon.ico'), buf);
      fs.writeFileSync(path.join(buildDir, 'uninstallerIcon.ico'), buf);
      fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf);
      fs.writeFileSync(path.join(rootDir, 'icon.ico'), buf);

      // Fallback mirror
      const nestedBuild = path.join(buildDir, 'build');
      if (!fs.existsSync(nestedBuild)) fs.mkdirSync(nestedBuild, { recursive: true });
      fs.writeFileSync(path.join(nestedBuild, 'icon.ico'), buf);
      fs.writeFileSync(path.join(nestedBuild, 'installerIcon.ico'), buf);
      fs.writeFileSync(path.join(nestedBuild, 'uninstallerIcon.ico'), buf);

      tempPngs.forEach((p) => {
        try { fs.unlinkSync(p); } catch (e) {}
      });

      console.log('[Icon Generator] Successfully generated compliant Windows ICO file!');
    })
    .catch((err) => {
      console.error('[Icon Generator] Failed to create ICO:', err);
    });
} catch (err) {
  console.log('[Icon Generator] Note: Pre-existing build/icon.ico will be used.');
}
