// Main entrypoint for Cyber Heist: Shadow Protocol.
// Handles canvas initialization, responsive scaling, game loop, and screenshot staging.

import { VIEWPORT, TIME_STEP } from './config.js';
import { World } from './world.js';
import { initInput, getInputState } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { initAudio } from './sound.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusElem = document.getElementById('status');

// Setup internal canvas buffer
canvas.width = VIEWPORT.width;
canvas.height = VIEWPORT.height;

function resizeCanvas() {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const windowRatio = windowWidth / windowHeight;

  let displayWidth, displayHeight;
  if (windowRatio > VIEWPORT.targetRatio) {
    displayHeight = windowHeight;
    displayWidth = Math.round(windowHeight * VIEWPORT.targetRatio);
  } else {
    displayWidth = windowWidth;
    displayHeight = Math.round(windowWidth / VIEWPORT.targetRatio);
  }

  canvas.style.width = `${displayWidth}px`;
  canvas.style.height = `${displayHeight}px`;
  canvas.style.left = `${(windowWidth - displayWidth) / 2}px`;
  canvas.style.top = `${(windowHeight - displayHeight) / 2}px`;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

initInput(canvas);

// Check if headless screenshot mode (?shot=...) is requested
const urlParams = new URLSearchParams(window.location.search);
const shotParam = urlParams.get('shot');
const seedParam = parseInt(urlParams.get('seed') || '1', 10);

const world = new World(seedParam);

let audioStarted = false;
function handleFirstInteraction() {
  if (!audioStarted) {
    audioStarted = true;
    initAudio();
  }
}
window.addEventListener('click', handleFirstInteraction, { once: true });
window.addEventListener('keydown', handleFirstInteraction, { once: true });

// Keyboard shortcut to restart mission
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR' && !shotParam) {
    world.reset();
  }
});

if (shotParam) {
  // Staged screenshot mode for Chrome headless capture
  stageShot(shotParam, world);
  render(ctx, world);
  if (statusElem) {
    statusElem.textContent = `Screenshot staged: ${shotParam}`;
  }
} else {
  // Normal interactive game loop
  let lastTime = performance.now();

  function loop(now) {
    const elapsed = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;

    const input = getInputState();
    world.step(elapsed, input);
    render(ctx, world);

    if (statusElem) {
      statusElem.textContent = `Alarm: ${Math.round(world.alarm)}%, Status: ${world.status}`;
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
