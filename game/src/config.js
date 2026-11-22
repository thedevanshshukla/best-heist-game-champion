// Game configuration and constants for Cyber Heist: Shadow Protocol.
// Build Revision: v1.2.0-heist-revised
// Defines field dimensions, player stealth capabilities, guard AI parameters,
// security systems (cameras, lasers, vents), gadget costs, and cyber-noir styling.

export const VERSION = '1.2.0';

export const VIEWPORT = {
  width: 1280,
  height: 800,
  targetRatio: 1280 / 800,
};

export const TIME_STEP = 1 / 60;

export const PLAYER_CONFIG = {
  radius: 14,
  walkSpeed: 170,
  sprintSpeed: 260,
  crouchSpeed: 95,
  maxEnergy: 100,
  energyRegenRate: 15, // energy points per second
  stealthNoiseRadiusWalk: 45,
  stealthNoiseRadiusSprint: 180,
  stealthNoiseRadiusCrouch: 0,
};

export const GUARD_CONFIG = {
  radius: 15,
  walkSpeed: 75,
  chaseSpeed: 165,
  investigateSpeed: 110,
  fov: (62 * Math.PI) / 180, // 62 degrees cone
  visionDistance: 270,
  peripheralVisionDistance: 90,
  sweepSpeed: 0.85, // rad/s for head panning
  detectionRate: 1.4, // fills suspicion from 0 to 1 in ~0.7s
  alertDecayRate: 0.25,
};

export const CAMERA_CONFIG = {
  fov: (50 * Math.PI) / 180,
  range: 280,
  sweepAngle: (65 * Math.PI) / 180,
  sweepSpeed: 0.65,
  detectionRate: 1.8,
  empDisableDuration: 8.0,
};

export const LASER_CONFIG = {
  beamWidth: 4,
  cycleOnTime: 3.5,
  cycleOffTime: 2.0,
  empDisableDuration: 7.5,
};

export const GADGETS = {
  EMP: {
    id: 'emp',
    name: 'EMP Burst',
    cost: 35,
    key: '1',
    radius: 220,
    duration: 8.0,
    description: 'Disables cameras and lasers in blast radius',
  },
  SMOKE: {
    id: 'smoke',
    name: 'Nanotech Smoke',
    cost: 25,
    key: '2',
    radius: 130,
    duration: 10.0,
    description: 'Blocks all vision cones and camera beams',
  },
  DECOY: {
    id: 'decoy',
    name: 'Audio Decoy',
    cost: 20,
    key: '3',
    range: 350,
    duration: 7.0,
    description: 'Emits sound pulse to distract guards away from route',
  },
  LOCKPICK: {
    id: 'lockpick',
    name: 'Cyber Bypass',
    cost: 15,
    key: '4',
    duration: 5.0,
    description: 'Instantly unlocks vent grates and accelerates vault breach',
  },
};

export const ALARM_THRESHOLDS = {
  CAUTION: 35,
  SUSPICIOUS: 65,
  LOCKDOWN: 100,
};

export const CONTROLS_GUIDE = [
  { key: 'WASD / Arrows', action: 'Move Operative' },
  { key: 'Shift', action: 'Sprint (Noisy)' },
  { key: 'C', action: 'Crouch (Silent)' },
  { key: 'Space / E', action: 'Interact / Hack / Vent' },
  { key: '1 - 4', action: 'Deploy Gadget' },
];

export const THEME = {
  bg: '#070a12',
  floorGrid: 'rgba(0, 240, 255, 0.04)',
  wallFill: '#0f172a',
  wallStroke: '#00d2ff',
  wallGlow: 'rgba(0, 210, 255, 0.35)',
  ventColor: '#00ffcc',
  coverZone: 'rgba(0, 255, 180, 0.08)',
  playerColor: '#38bdf8',
  playerGlow: '#0284c7',
  guardNormal: '#eab308',
  guardAlert: '#ef4444',
  guardConeNormal: 'rgba(234, 179, 8, 0.22)',
  guardConeAlert: 'rgba(239, 68, 68, 0.45)',
  cameraBody: '#94a3b8',
  cameraBeam: 'rgba(56, 189, 248, 0.26)',
  cameraAlertBeam: 'rgba(239, 68, 68, 0.55)',
  laserActive: '#ff0055',
  laserGlow: 'rgba(255, 0, 85, 0.65)',
  vaultDoor: '#f59e0b',
  vaultGlow: 'rgba(245, 158, 11, 0.6)',
  lootGold: '#ffd700',
  smokeFill: 'rgba(148, 163, 184, 0.55)',
  empWave: 'rgba(56, 189, 248, 0.75)',
};
