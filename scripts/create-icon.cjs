const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const pngToIcoModule = require('png-to-ico');
const pngToIco = pngToIcoModule.default || pngToIcoModule;

const rootDir = path.resolve(__dirname, '..');
const sourceImg = path.join(rootDir, 'public/assets/aistudio/Minimalist_White_Navigation_Icon_63543507.png');
const buildDir = path.join(rootDir, 'build');
const publicDir = path.join(rootDir, 'public');

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('[Icon Generator] Generating icons from:', sourceImg);

// Generate intermediate sized PNGs for ICO
const sizes = [16, 32, 48, 64, 128, 256];
const tempPngs = [];

for (const size of sizes) {
  const outPath = path.join(buildDir, `temp_${size}.png`);
  execSync(`convert "${sourceImg}" -resize ${size}x${size} -background black -alpha off "${outPath}"`);
  tempPngs.push(outPath);
}

// Master 512x512 icon.png
execSync(`convert "${sourceImg}" -resize 512x512 "${path.join(buildDir, 'icon.png')}"`);
execSync(`cp "${path.join(buildDir, 'icon.png')}" "${path.join(publicDir, 'icon.png')}"`);
execSync(`cp "${path.join(buildDir, 'icon.png')}" "${path.join(publicDir, 'logo.png')}"`);

// NSIS header bitmap
execSync(`convert "${sourceImg}" -resize 150x57 -background "#0a0a0f" -gravity center -extent 150x57 "${path.join(buildDir, 'installerHeader.bmp')}"`);

// Convert PNGs to ICO with png-to-ico
pngToIco(tempPngs)
  .then((buf) => {
    fs.writeFileSync(path.join(buildDir, 'icon.ico'), buf);
    fs.writeFileSync(path.join(buildDir, 'installerIcon.ico'), buf);
    fs.writeFileSync(path.join(buildDir, 'uninstallerIcon.ico'), buf);
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), buf);
    fs.writeFileSync(path.join(rootDir, 'icon.ico'), buf);

    // Also mirror to build/build/ for electron-builder fallback
    const nestedBuild = path.join(buildDir, 'build');
    if (!fs.existsSync(nestedBuild)) fs.mkdirSync(nestedBuild, { recursive: true });
    fs.writeFileSync(path.join(nestedBuild, 'icon.ico'), buf);
    fs.writeFileSync(path.join(nestedBuild, 'installerIcon.ico'), buf);
    fs.writeFileSync(path.join(nestedBuild, 'uninstallerIcon.ico'), buf);

    tempPngs.forEach((p) => {
      try {
        fs.unlinkSync(p);
      } catch (e) {}
    });

    console.log('[Icon Generator] Successfully generated compliant Windows ICO and PNG icons from new navigation logo!');
  })
  .catch((err) => {
    console.error('[Icon Generator] Error generating ICO:', err);
    process.exit(1);
  });
