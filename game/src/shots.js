// Deterministic screenshot staging module for Cyber Heist: Shadow Protocol.
// Configures specific high-stakes gameplay states for headless Chrome screenshot capture.

import { MISSION_STATUS } from './world.js';
import { GADGETS } from './config.js';

export function stageShot(name, world) {
  world.reset();

  const shotId = String(name).toLowerCase();

  if (shotId === '1' || shotId === 'cover' || shotId.includes('cover')) {
    // Shot 1: The Master Cover Shot
    // Complete heist game in one frame: Room the thief is crossing, guards with vision cones,
    // wall cameras, vault target, and alarm meter ALL VISIBLE IN ONE FRAME!
    world.player.x = 380;
    world.player.y = 390;
    world.player.angle = 0.2;
    world.player.energy = 85;
    world.player.isCrouching = true;

    // Guard Alpha patrolling atrium with sweeping cone
    world.guards[0].x = 520;
    world.guards[0].y = 270;
    world.guards[0].angle = Math.PI * 0.85; // looking down-left toward atrium
    world.guards[0].state = 'PATROL';
    world.guards[0].alert = 0.25;

    // Guard Beta near central divider
    world.guards[1].x = 440;
    world.guards[1].y = 520;
    world.guards[1].angle = -Math.PI * 0.45; // looking up-right
    world.guards[1].state = 'PATROL';
    world.guards[1].alert = 0.15;

    // Vault Sentinel
    world.guards[2].x = 790;
    world.guards[2].y = 440;
    world.guards[2].angle = Math.PI; // looking left guarding vault
    world.guards[2].state = 'PATROL';
    world.guards[2].alert = 0.1;

    // Camera sweep active
    world.cameras[0].currentAngle = Math.PI / 2 + 0.2;
    world.cameras[1].currentAngle = Math.PI - 0.2;
    world.cameras[2].currentAngle = -Math.PI / 6;

    // Lasers active
    world.lasers[0].active = true;
    world.lasers[1].active = true;
    world.lasers[2].active = true;

    // Facility Alarm at 24%
    world.alarm = 24;
    world.tension = 0.2;
    world.status = MISSION_STATUS.INFILTRATING;
  } else if (shotId === '2' || shotId === 'laser' || shotId.includes('laser')) {
    // Shot 2: Hacking South Laser Grid & EMP deployment
    world.player.x = 260;
    world.player.y = 660;
    world.player.angle = 0;
    world.player.energy = 50;

    // Trigger EMP blast in corridor
    world.activeEMP.push({
      x: 310,
      y: 670,
      radius: 120,
      maxRadius: GADGETS.EMP.radius,
      timer: 0.3,
    });

    // Disable laser 1 and 2
    world.lasers[0].disabledTimer = 6.0;
    world.lasers[0].active = false;
    world.lasers[1].disabledTimer = 5.0;
    world.lasers[1].active = false;
    world.lasers[2].active = true;

    world.cameras[1].disabledTimer = 5.0;
    world.laserTerminal.hacked = true;

    world.alarm = 38;
    world.tension = 0.35;
    world.status = MISSION_STATUS.INFILTRATING;
  } else if (shotId === '3' || shotId === 'vault' || shotId.includes('vault')) {
    // Shot 3: Vault Breach & Golden Quantum Core Extraction
    world.player.x = 940;
    world.player.y = 420;
    world.player.angle = 0;
    world.player.energy = 40;

    // Vault breached
    world.vault.isOpen = true;
    world.vault.lockHealth = 0;
    world.status = MISSION_STATUS.VAULT_UNLOCKED;

    // Vault guard alerted
    world.guards[2].x = 780;
    world.guards[2].y = 420;
    world.guards[2].angle = 0;
    world.guards[2].state = 'INVESTIGATING';
    world.guards[2].alert = 0.7;

    // Active decoy deployed to buy time
    world.activeDecoy = {
      x: 750,
      y: 280,
      timer: 4.5,
      duration: 7.0,
    };

    world.alarm = 58;
    world.tension = 0.6;
  } else if (shotId === '4' || shotId === 'escape' || shotId.includes('escape')) {
    // Shot 4: Alarm Lockdown & High-Speed Escape with Nanotech Smoke
    world.player.x = 180;
    world.player.y = 400;
    world.player.angle = Math.PI; // racing toward getaway van on the left
    world.player.hasLoot = true;
    world.loot.collected = true;
    world.extraction.active = true;
    world.status = MISSION_STATUS.LOOT_ACQUIRED;
    world.player.energy = 20;

    // Nanotech smoke cloud deployed to block pursuit
    world.activeSmoke.push({
      x: 320,
      y: 400,
      radius: 130,
      timer: 7.5,
      maxDuration: 10.0,
    });

    // Guards in full pursuit
    world.guards[0].x = 420;
    world.guards[0].y = 380;
    world.guards[0].state = 'ALERT';
    world.guards[0].alert = 1.0;
    world.guards[0].angle = Math.PI;

    world.guards[1].x = 450;
    world.guards[1].y = 460;
    world.guards[1].state = 'ALERT';
    world.guards[1].alert = 1.0;
    world.guards[1].angle = Math.PI;

    world.alarm = 94;
    world.tension = 0.95;
  }
}
