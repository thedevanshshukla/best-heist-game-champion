// Cyber Heist: Shadow Protocol - Automated Packaging & Dossier Generator
// Prepares the submission bundle compliant with make.fun best-game-01 specification.
// Copies game/ and screenshots/ to the output target and synthesizes /output/dossier.json.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

console.log(`[HeistPackager] Packaging Cyber Heist submission into: ${outputDir}`);

// Ensure destination structure exists
mkdirSync(outputDir, { recursive: true });

// Copy game client bundle (HTML5 canvas + modular ES modules)
const gameSource = join(rootDir, 'game');
const gameTarget = join(outputDir, 'game');
if (existsSync(gameSource)) {
  cpSync(gameSource, gameTarget, { recursive: true });
  console.log(`[HeistPackager] Copied game assets to: ${gameTarget}`);
}

// Copy screenshots directory
const screenshotsSource = join(rootDir, 'screenshots');
const screenshotsTarget = join(outputDir, 'screenshots');
mkdirSync(screenshotsTarget, { recursive: true });
if (existsSync(screenshotsSource)) {
  cpSync(screenshotsSource, screenshotsTarget, { recursive: true });
  console.log(`[HeistPackager] Copied preview screenshots to: ${screenshotsTarget}`);
}

// Scorer constraints specified by reference/gate.json
const dossierLimits = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Generate and write dossier.json summary
const dossierJson = buildDossier(outputDir, dossierLimits);
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(dossierPath, dossierJson);
console.log(`[HeistPackager] Synthesized dossier.json successfully at: ${dossierPath}`);
