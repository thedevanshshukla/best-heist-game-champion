// World simulation module for Cyber Heist: Shadow Protocol.
// Implements room layout, thief movement, guard AI state machines, camera sweeps,
// laser tripwires, vent bypass tunnels, vault cracking, gadget mechanics, and alarm systems.

import {
  VIEWPORT,
  PLAYER_CONFIG,
  GUARD_CONFIG,
  CAMERA_CONFIG,
  LASER_CONFIG,
  GADGETS,
  ALARM_THRESHOLDS,
  TIME_STEP,
} from './config.js';
import * as Sound from './sound.js';

export const MISSION_STATUS = {
  INFILTRATING: 'INFILTRATING',
  VAULT_UNLOCKED: 'VAULT_UNLOCKED',
  LOOT_ACQUIRED: 'LOOT_ACQUIRED',
  ESCAPED: 'ESCAPED',
  BUSTED: 'BUSTED',
};

export class World {
  constructor(seed = 1) {
    this.seed = seed;
    this.reset();
  }

  reset() {
    this.status = MISSION_STATUS.INFILTRATING;
    this.time = 0;
    this.alarm = 0; // 0 to 100
    this.tension = 0; // 0 to 1 visual vignette tension
    this.score = 0;
    this.alertTriggered = false;

    // Player (The Shadow Thief)
    this.player = {
      x: 100,
      y: 400,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: PLAYER_CONFIG.radius,
      energy: 85,
      maxEnergy: PLAYER_CONFIG.maxEnergy,
      isCrouching: false,
      isSprinting: false,
      inVent: false,
      hasLoot: false,
      crackProgress: 0, // 0 to 1 for vault cracking
      visibleToGuards: false,
      stealthRating: 100,
    };

    // Extraction point (Getaway Van)
    this.extraction = {
      x: 70,
      y: 400,
      width: 70,
      height: 110,
      active: false,
    };

    // Level Walls & Solid Cover Pillars
    this.walls = [
      // Outer perimeter
      { x: 20, y: 30, w: 1240, h: 20 }, // Top
      { x: 20, y: 750, w: 1240, h: 20 }, // Bottom
      { x: 20, y: 30, w: 20, h: 320 }, // Left top
      { x: 20, y: 450, w: 20, h: 320 }, // Left bottom
      { x: 1240, y: 30, w: 20, h: 740 }, // Right

      // North Vent corridor walls
      { x: 180, y: 50, w: 20, h: 140 },
      { x: 180, y: 220, w: 660, h: 20 },

      // Central dividers
      { x: 420, y: 240, w: 20, h: 150 },
      { x: 640, y: 320, w: 20, h: 280 },

      // South laser hallway divider
      { x: 180, y: 580, w: 660, h: 20 },

      // Vault Chamber walls
      { x: 840, y: 160, w: 20, h: 180 },
      { x: 840, y: 440, w: 20, h: 260 },
      { x: 840, y: 160, w: 380, h: 20 },
      { x: 840, y: 680, w: 380, h: 20 },

      // Cover Pillars & Terminal Desks in Atrium
      { x: 280, y: 310, w: 60, h: 60, isCover: true, label: 'DATA TERMINAL' },
      { x: 500, y: 310, w: 60, h: 60, isCover: true, label: 'SERVER RACK' },
      { x: 380, y: 470, w: 70, h: 50, isCover: true, label: 'SECURITY CONSOLE' },
      { x: 530, y: 470, w: 60, h: 50, isCover: true, label: 'CRATE STACK' },
    ];

    // Ventilation Shafts (Route 1)
    this.vents = [
      {
        id: 'vent-north',
        entryX: 195,
        entryY: 120,
        exitX: 825,
        exitY: 180,
        isUnlocked: true,
        label: 'VENT SHAFT ALPHA (STEALTH ROUTE)',
      },
    ];

    // CCTV Security Cameras
    this.cameras = [
      {
        id: 'cam-atrium',
        x: 640,
        y: 240,
        baseAngle: Math.PI / 2,
        currentAngle: Math.PI / 2,
        sweepArc: Math.PI / 3,
        range: 260,
        fov: CAMERA_CONFIG.fov,
        timer: 0,
        disabledTimer: 0,
        detecting: false,
      },
      {
        id: 'cam-south',
        x: 820,
        y: 600,
        baseAngle: Math.PI,
        currentAngle: Math.PI,
        sweepArc: Math.PI / 4,
        range: 280,
        fov: CAMERA_CONFIG.fov,
        timer: 1.5,
        disabledTimer: 0,
        detecting: false,
      },
      {
        id: 'cam-vault',
        x: 860,
        y: 350,
        baseAngle: -Math.PI / 6,
        currentAngle: -Math.PI / 6,
        sweepArc: Math.PI / 3,
        range: 240,
        fov: CAMERA_CONFIG.fov,
        timer: 0.8,
        disabledTimer: 0,
        detecting: false,
      },
    ];

    // Security Guards with Vision Cones
    this.guards = [
      {
        id: 'guard-alpha',
        name: 'CYBORG ENFORCER A',
        x: 320,
        y: 270,
        angle: 0,
        state: 'PATROL', // PATROL, SUSPICIOUS, CHASE, INVESTIGATING
        alert: 0, // 0 to 1
        speed: GUARD_CONFIG.walkSpeed,
        waypoints: [
          { x: 320, y: 270 },
          { x: 580, y: 270 },
        ],
        targetWaypoint: 1,
        investigateTarget: null,
        investigateTimer: 0,
        sweepOffset: 0,
      },
      {
        id: 'guard-beta',
        name: 'PATROL SENTINEL B',
        x: 460,
        y: 530,
        angle: -Math.PI / 2,
        state: 'PATROL',
        alert: 0,
        speed: GUARD_CONFIG.walkSpeed,
        waypoints: [
          { x: 460, y: 530 },
          { x: 460, y: 350 },
          { x: 300, y: 410 },
        ],
        targetWaypoint: 1,
        investigateTarget: null,
        investigateTimer: 0,
        sweepOffset: 1.2,
      },
      {
        id: 'guard-vault',
        name: 'ELITE VAULT GUARD',
        x: 800,
        y: 420,
        angle: Math.PI,
        state: 'PATROL',
        alert: 0,
        speed: GUARD_CONFIG.walkSpeed,
        waypoints: [
          { x: 800, y: 360 },
          { x: 800, y: 560 },
        ],
        targetWaypoint: 1,
        investigateTarget: null,
        investigateTimer: 0,
        sweepOffset: 2.5,
      },
    ];

    // Laser Corridor Beams (Route 3)
    this.lasers = [
      {
        id: 'laser-1',
        x1: 300,
        y1: 600,
        x2: 300,
        y2: 740,
        active: true,
        timer: 0,
        period: 4.0,
        disabledTimer: 0,
      },
      {
        id: 'laser-2',
        x1: 480,
        y1: 600,
        x2: 480,
        y2: 740,
        active: true,
        timer: 1.8,
        period: 4.0,
        disabledTimer: 0,
      },
      {
        id: 'laser-3',
        x1: 660,
        y1: 600,
        x2: 660,
        y2: 740,
        active: true,
        timer: 3.0,
        period: 4.0,
        disabledTimer: 0,
      },
    ];

    // Laser Terminal bypass switch
    this.laserTerminal = {
      x: 230,
      y: 630,
      w: 35,
      h: 35,
      hacked: false,
    };

    // The Central Vault Door & Loot
    this.vault = {
      doorX: 840,
      doorY: 340,
      doorW: 20,
      doorH: 100,
      isOpen: false,
      lockHealth: 100,
      hacking: false,
    };

    this.loot = {
      x: 1060,
      y: 420,
      radius: 22,
      name: 'QUANTUM DATA CORE',
      value: 1000000,
      collected: false,
    };

    // Active Gadget Effects
    this.activeSmoke = []; // { x, y, radius, timer, maxDuration }
    this.activeEMP = []; // { x, y, radius, maxRadius, timer }
    this.activeDecoy = null; // { x, y, timer, duration }
  }

  step(dt, inputState) {
    this.time += dt;

    // Regain player energy
    if (this.player.energy < this.player.maxEnergy) {
      this.player.energy = Math.min(
        this.player.maxEnergy,
        this.player.energy + PLAYER_CONFIG.energyRegenRate * dt
      );
    }

    // Process gadget activations
    this.handleGadgets(inputState);

    // Update active gadget effects
    this.updateGadgetEffects(dt);

    // Update player movement and stance
    this.updatePlayer(dt, inputState);

    // Update cameras
    this.updateCameras(dt);

    // Update lasers
    this.updateLasers(dt);

    // Update guards AI and vision
    this.updateGuards(dt);

    // Update Vault interactions & extraction
    this.updateObjectives(dt, inputState);

    // Update alarm meter & tension levels
    this.updateAlarm(dt);
  }

  handleGadgets(input) {
    if (!input.gadgetTrigger) return;

    // EMP Blaster (Key 1)
    if (input.gadgetTrigger.emp && this.player.energy >= GADGETS.EMP.cost) {
      this.player.energy -= GADGETS.EMP.cost;
      this.triggerEMP(this.player.x, this.player.y);
    }

    // Smoke Grenade (Key 2)
    if (input.gadgetTrigger.smoke && this.player.energy >= GADGETS.SMOKE.cost) {
      this.player.energy -= GADGETS.SMOKE.cost;
      this.triggerSmoke(input.mousePos.x, input.mousePos.y);
    }

    // Audio Decoy (Key 3)
    if (input.gadgetTrigger.decoy && this.player.energy >= GADGETS.DECOY.cost) {
      this.player.energy -= GADGETS.DECOY.cost;
      this.triggerDecoy(input.mousePos.x, input.mousePos.y);
    }

    // Cyber Lockpick (Key 4)
    if (input.gadgetTrigger.lockpick && this.player.energy >= GADGETS.LOCKPICK.cost) {
      this.player.energy -= GADGETS.LOCKPICK.cost;
      this.triggerLockpick();
    }
  }

  triggerEMP(x, y) {
    Sound.playEMP();
    this.activeEMP.push({
      x,
      y,
      radius: 10,
      maxRadius: GADGETS.EMP.radius,
      timer: 0.5,
    });

    // Disable cameras within radius
    for (const cam of this.cameras) {
      const d = Math.hypot(cam.x - x, cam.y - y);
      if (d <= GADGETS.EMP.radius) {
        cam.disabledTimer = CAMERA_CONFIG.empDisableDuration;
      }
    }

    // Disable lasers within radius
    for (const laser of this.lasers) {
      const midX = (laser.x1 + laser.x2) / 2;
      const midY = (laser.y1 + laser.y2) / 2;
      if (Math.hypot(midX - x, midY - y) <= GADGETS.EMP.radius) {
        laser.disabledTimer = LASER_CONFIG.empDisableDuration;
      }
    }
  }

  triggerSmoke(x, y) {
    Sound.playSmoke();
    this.activeSmoke.push({
      x,
      y,
      radius: GADGETS.SMOKE.radius,
      timer: GADGETS.SMOKE.duration,
      maxDuration: GADGETS.SMOKE.duration,
    });
  }

  triggerDecoy(x, y) {
    Sound.playDecoy();
    this.activeDecoy = {
      x,
      y,
      timer: GADGETS.DECOY.duration,
      duration: GADGETS.DECOY.duration,
    };

    // Alert nearby guards to investigate decoy
    for (const guard of this.guards) {
      const d = Math.hypot(guard.x - x, guard.y - y);
      if (d < 450) {
        guard.state = 'INVESTIGATING';
        guard.investigateTarget = { x, y };
        guard.investigateTimer = GADGETS.DECOY.duration;
      }
    }
  }

  triggerLockpick() {
    Sound.playVaultUnlock();
    // Fast crack vault if nearby
    const distToVault = Math.hypot(
      this.player.x - (this.vault.doorX + this.vault.doorW / 2),
      this.player.y - (this.vault.doorY + this.vault.doorH / 2)
    );
    if (distToVault < 90 && !this.vault.isOpen) {
      this.vault.lockHealth = Math.max(0, this.vault.lockHealth - 60);
      if (this.vault.lockHealth <= 0) {
        this.vault.isOpen = true;
        this.status = MISSION_STATUS.VAULT_UNLOCKED;
      }
    }
  }

  updateGadgetEffects(dt) {
    // EMP waves
    for (let i = this.activeEMP.length - 1; i >= 0; i--) {
      const emp = this.activeEMP[i];
      emp.radius += (emp.maxRadius / 0.45) * dt;
      emp.timer -= dt;
      if (emp.timer <= 0) {
        this.activeEMP.splice(i, 1);
      }
    }

    // Smoke clouds
    for (let i = this.activeSmoke.length - 1; i >= 0; i--) {
      const smoke = this.activeSmoke[i];
      smoke.timer -= dt;
      if (smoke.timer <= 0) {
        this.activeSmoke.splice(i, 1);
      }
    }

    // Decoys
    if (this.activeDecoy) {
      this.activeDecoy.timer -= dt;
      if (this.activeDecoy.timer <= 0) {
        this.activeDecoy = null;
      }
    }
  }

  updatePlayer(dt, input) {
    this.player.isSprinting = input.isSprinting && this.player.energy > 5;
    this.player.isCrouching = input.isCrouching;

    let speed = PLAYER_CONFIG.walkSpeed;
    if (this.player.isSprinting) {
      speed = PLAYER_CONFIG.sprintSpeed;
      this.player.energy = Math.max(0, this.player.energy - 12 * dt);
    } else if (this.player.isCrouching) {
      speed = PLAYER_CONFIG.crouchSpeed;
    }

    // Direction facing mouse cursor
    const dx = input.mousePos.x - this.player.x;
    const dy = input.mousePos.y - this.player.y;
    if (Math.hypot(dx, dy) > 2) {
      this.player.angle = Math.atan2(dy, dx);
    }

    // Move player
    const moveDist = speed * dt;
    const newX = this.player.x + input.moveX * moveDist;
    const newY = this.player.y + input.moveY * moveDist;

    // Check collision with walls and vault door (if closed)
    if (!this.checkWallCollision(newX, this.player.y, this.player.radius)) {
      this.player.x = newX;
    }
    if (!this.checkWallCollision(this.player.x, newY, this.player.radius)) {
      this.player.y = newY;
    }

    // Vent interaction
    for (const vent of this.vents) {
      const distToEntry = Math.hypot(this.player.x - vent.entryX, this.player.y - vent.entryY);
      const distToExit = Math.hypot(this.player.x - vent.exitX, this.player.y - vent.exitY);

      if (input.isInteracting) {
        if (distToEntry < 35 && !this.player.inVent) {
          this.player.inVent = true;
          this.player.x = vent.exitX;
          this.player.y = vent.exitY;
          Sound.playFootstep();
          break;
        } else if (distToExit < 35 && this.player.inVent) {
          this.player.inVent = false;
          this.player.x = vent.entryX;
          this.player.y = vent.entryY;
          Sound.playFootstep();
          break;
        }
      }
    }
  }

  checkWallCollision(x, y, radius) {
    // Check against regular walls
    for (const wall of this.walls) {
      if (
        x + radius > wall.x &&
        x - radius < wall.x + wall.w &&
        y + radius > wall.y &&
        y - radius < wall.y + wall.h
      ) {
        return true;
      }
    }

    // Check against closed vault door
    if (!this.vault.isOpen) {
      if (
        x + radius > this.vault.doorX &&
        x - radius < this.vault.doorX + this.vault.doorW &&
        y + radius > this.vault.doorY &&
        y - radius < this.vault.doorY + this.vault.doorH
      ) {
        return true;
      }
    }

    return false;
  }

  updateCameras(dt) {
    for (const cam of this.cameras) {
      if (cam.disabledTimer > 0) {
        cam.disabledTimer -= dt;
        cam.detecting = false;
        continue;
      }

      cam.timer += dt * CAMERA_CONFIG.sweepSpeed;
      cam.currentAngle = cam.baseAngle + Math.sin(cam.timer) * (cam.sweepArc / 2);

      // Check if player is detected by camera
      cam.detecting = this.isPointInVisionCone(
        this.player.x,
        this.player.y,
        cam.x,
        cam.y,
        cam.currentAngle,
        cam.fov,
        cam.range
      );

      if (cam.detecting) {
        this.alarm = Math.min(100, this.alarm + CAMERA_CONFIG.detectionRate * dt * 45);
        this.tension = Math.min(1.0, this.tension + dt * 1.5);
      }
    }
  }

  updateLasers(dt) {
    for (const laser of this.lasers) {
      if (laser.disabledTimer > 0) {
        laser.disabledTimer -= dt;
        laser.active = false;
        continue;
      }

      laser.timer += dt;
      const mod = laser.timer % laser.period;
      laser.active = mod < LASER_CONFIG.cycleOnTime;

      // Check player crossing active laser beam
      if (laser.active && !this.player.inVent) {
        const distToBeam = Math.abs(this.player.x - laser.x1);
        if (
          distToBeam < this.player.radius &&
          this.player.y >= laser.y1 &&
          this.player.y <= laser.y2
        ) {
          // Tripped laser!
          this.alarm = Math.min(100, this.alarm + 35 * dt);
          Sound.playAlertSting();
        }
      }
    }
  }

  updateGuards(dt) {
    let anyGuardSeesPlayer = false;

    for (const guard of this.guards) {
      // Check vision cone detection
      const playerVisible = this.canGuardSeePlayer(guard);

      if (playerVisible) {
        anyGuardSeesPlayer = true;
        guard.state = 'ALERT';
        guard.alert = Math.min(1.0, guard.alert + GUARD_CONFIG.detectionRate * dt);
        this.alarm = Math.min(100, this.alarm + guard.alert * dt * 40);
        this.tension = Math.min(1.0, this.tension + dt * 2.0);

        // Turn toward player
        const targetAngle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
        guard.angle = targetAngle;

        // Sound alert
        if (!this.alertTriggered && guard.alert > 0.6) {
          this.alertTriggered = true;
          Sound.playAlertSting();
        }
      } else {
        guard.alert = Math.max(0, guard.alert - GUARD_CONFIG.alertDecayRate * dt);
      }

      // Patrol / investigate movement
      if (guard.state === 'PATROL') {
        const target = guard.waypoints[guard.targetWaypoint];
        const dist = Math.hypot(target.x - guard.x, target.y - guard.y);
        if (dist < 10) {
          guard.targetWaypoint = (guard.targetWaypoint + 1) % guard.waypoints.length;
        } else {
          const moveAngle = Math.atan2(target.y - guard.y, target.x - guard.x);
          guard.angle = moveAngle + Math.sin(this.time * 2 + guard.sweepOffset) * 0.25;
          guard.x += Math.cos(moveAngle) * guard.speed * dt;
          guard.y += Math.sin(moveAngle) * guard.speed * dt;
        }
      } else if (guard.state === 'INVESTIGATING' && guard.investigateTarget) {
        const dist = Math.hypot(guard.investigateTarget.x - guard.x, guard.investigateTarget.y - guard.y);
        if (dist > 15) {
          const moveAngle = Math.atan2(guard.investigateTarget.y - guard.y, guard.investigateTarget.x - guard.x);
          guard.angle = moveAngle;
          guard.x += Math.cos(moveAngle) * GUARD_CONFIG.investigateSpeed * dt;
          guard.y += Math.sin(moveAngle) * GUARD_CONFIG.investigateSpeed * dt;
        }
        guard.investigateTimer -= dt;
        if (guard.investigateTimer <= 0) {
          guard.state = 'PATROL';
        }
      } else if (guard.state === 'ALERT' && this.alarm >= ALARM_THRESHOLDS.LOCKDOWN) {
        // Chase player
        const moveAngle = Math.atan2(this.player.y - guard.y, this.player.x - guard.x);
        guard.angle = moveAngle;
        guard.x += Math.cos(moveAngle) * GUARD_CONFIG.chaseSpeed * dt;
        guard.y += Math.sin(moveAngle) * GUARD_CONFIG.chaseSpeed * dt;
      }
    }

    this.player.visibleToGuards = anyGuardSeesPlayer;
  }

  canGuardSeePlayer(guard) {
    if (this.player.inVent) return false;

    // Check if player is obscured by active smoke
    for (const smoke of this.activeSmoke) {
      if (Math.hypot(this.player.x - smoke.x, this.player.y - smoke.y) <= smoke.radius) {
        return false;
      }
    }

    return this.isPointInVisionCone(
      this.player.x,
      this.player.y,
      guard.x,
      guard.y,
      guard.angle,
      GUARD_CONFIG.fov,
      this.player.isCrouching ? GUARD_CONFIG.visionDistance * 0.65 : GUARD_CONFIG.visionDistance
    );
  }

  isPointInVisionCone(px, py, ox, oy, heading, fov, maxRange) {
    const dx = px - ox;
    const dy = py - oy;
    const dist = Math.hypot(dx, dy);

    if (dist > maxRange) return false;

    const angleToTarget = Math.atan2(dy, dx);
    let diff = angleToTarget - heading;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    if (Math.abs(diff) > fov / 2) return false;

    // Raycast ray against walls to test occlusion (Line-of-sight check)
    return !this.lineIntersectsAnyWall(ox, oy, px, py);
  }

  lineIntersectsAnyWall(x1, y1, x2, y2) {
    for (const wall of this.walls) {
      if (this.lineIntersectsRect(x1, y1, x2, y2, wall.x, wall.y, wall.w, wall.h)) {
        return true;
      }
    }
    return false;
  }

  lineIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Check bounding box first
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    if (maxX < rx || minX > rx + rw || maxY < ry || minY > ry + rh) {
      return false;
    }

    // Check 4 segment intersections
    return (
      this.lineSegmentsIntersect(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
      this.lineSegmentsIntersect(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) ||
      this.lineSegmentsIntersect(x1, y1, x2, y2, rx + rw, ry + rh, rx, ry + rh) ||
      this.lineSegmentsIntersect(x1, y1, x2, y2, rx, ry + rh, rx, ry)
    );
  }

  lineSegmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  updateObjectives(dt, input) {
    // Vault cracking
    const distToVault = Math.hypot(
      this.player.x - (this.vault.doorX + this.vault.doorW / 2),
      this.player.y - (this.vault.doorY + this.vault.doorH / 2)
    );

    if (distToVault < 80 && !this.vault.isOpen) {
      if (input.isInteracting) {
        this.vault.lockHealth = Math.max(0, this.vault.lockHealth - 30 * dt);
        if (this.vault.lockHealth <= 0) {
          this.vault.isOpen = true;
          this.status = MISSION_STATUS.VAULT_UNLOCKED;
          Sound.playVaultUnlock();
        }
      }
    }

    // Loot acquisition
    if (this.vault.isOpen && !this.loot.collected) {
      const distToLoot = Math.hypot(this.player.x - this.loot.x, this.player.y - this.loot.y);
      if (distToLoot < this.player.radius + this.loot.radius) {
        this.loot.collected = true;
        this.player.hasLoot = true;
        this.status = MISSION_STATUS.LOOT_ACQUIRED;
        this.extraction.active = true;
        this.score = this.loot.value;
        Sound.playVaultUnlock();
      }
    }

    // Extraction getaway
    if (this.player.hasLoot && this.extraction.active) {
      const distToExtraction = Math.hypot(
        this.player.x - (this.extraction.x + this.extraction.width / 2),
        this.player.y - (this.extraction.y + this.extraction.height / 2)
      );

      if (distToExtraction < 65) {
        this.status = MISSION_STATUS.ESCAPED;
      }
    }
  }

  updateAlarm(dt) {
    if (!this.player.visibleToGuards) {
      this.alarm = Math.max(0, this.alarm - 8 * dt);
      this.tension = Math.max(0, this.tension - 0.4 * dt);
    }

    if (this.alarm >= ALARM_THRESHOLDS.LOCKDOWN) {
      this.tension = 1.0;
      if (Math.floor(this.time * 3) % 2 === 0) {
        // Siren sound interval
        Sound.playAlarmKlaxon();
      }
    }
  }
}
