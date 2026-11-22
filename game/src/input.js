// Input handling module for Cyber Heist: Shadow Protocol.
// Build Revision: v1.2.0-heist-input-revised
// Captures keyboard, mouse, and touch events mapped to viewport coordinates.

import { VIEWPORT } from './config.js';

const keys = {};
const justPressed = {};
let mousePos = { x: VIEWPORT.width / 2, y: VIEWPORT.height / 2 };
let isMouseDown = false;
let justClicked = false;

export function initInput(canvas) {
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    if (!keys[code]) {
      justPressed[code] = true;
    }
    keys[code] = true;

    // Prevent default scrolling for game controls
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });

  const updateMouseCoord = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIEWPORT.width / rect.width;
    const scaleY = VIEWPORT.height / rect.height;
    mousePos.x = Math.max(0, Math.min(VIEWPORT.width, (clientX - rect.left) * scaleX));
    mousePos.y = Math.max(0, Math.min(VIEWPORT.height, (clientY - rect.top) * scaleY));
  };

  canvas.addEventListener('mousemove', (e) => {
    updateMouseCoord(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousedown', (e) => {
    updateMouseCoord(e.clientX, e.clientY);
    isMouseDown = true;
    justClicked = true;
  });

  window.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  // Touch support
  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updateMouseCoord(e.touches[0].clientX, e.touches[0].clientY);
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      updateMouseCoord(e.touches[0].clientX, e.touches[0].clientY);
      isMouseDown = true;
      justClicked = true;
    }
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchend', () => {
    isMouseDown = false;
  });
}

export function getInputState() {
  let moveX = 0;
  let moveY = 0;

  if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
  if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
  if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
  if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

  // Normalize diagonal movement
  if (moveX !== 0 && moveY !== 0) {
    const inv = 1 / Math.SQRT2;
    moveX *= inv;
    moveY *= inv;
  }

  const isSprinting = Boolean(keys['ShiftLeft'] || keys['ShiftRight']);
  const isCrouching = Boolean(keys['KeyC'] || keys['ControlLeft']);
  const isInteracting = Boolean(justPressed['Space'] || justPressed['KeyE']);

  const gadgetTrigger = {
    emp: Boolean(justPressed['Digit1'] || justPressed['Numpad1']),
    smoke: Boolean(justPressed['Digit2'] || justPressed['Numpad2']),
    decoy: Boolean(justPressed['Digit3'] || justPressed['Numpad3']),
    lockpick: Boolean(justPressed['Digit4'] || justPressed['Numpad4']),
  };

  const clicked = justClicked;
  // Clear single-frame triggers
  for (const k in justPressed) {
    delete justPressed[k];
  }
  justClicked = false;

  return {
    moveX,
    moveY,
    mousePos: { ...mousePos },
    isMouseDown,
    clicked,
    isSprinting,
    isCrouching,
    isInteracting,
    gadgetTrigger,
  };
}
