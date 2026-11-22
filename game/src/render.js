// Cyber-noir neon renderer for Cyber Heist: Shadow Protocol.
// Renders the facility layout, guard vision cones, CCTV sweeps, laser grids,
// vault target, extraction van, active gadgets, and tactical HUD with alarm meter.

import { VIEWPORT, THEME, GADGETS, ALARM_THRESHOLDS } from './config.js';
import { MISSION_STATUS } from './world.js';

export function render(ctx, world) {
  // Clear background
  ctx.fillStyle = THEME.bg;
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);

  // Draw cyber floor grid
  drawFloorGrid(ctx);

  // Draw designated infiltration routes & zone markings
  drawRouteFloorGuides(ctx);

  // Draw extraction van
  drawExtractionVan(ctx, world.extraction, world.status);

  // Draw vent networks
  drawVents(ctx, world.vents, world.player.inVent);

  // Draw laser corridor & terminal
  drawLasers(ctx, world.lasers, world.laserTerminal);

  // Draw vault chamber & loot target
  drawVaultAndLoot(ctx, world.vault, world.loot);

  // Draw cover walls & pillars
  drawWalls(ctx, world.walls);

  // Draw wall security cameras
  drawCameras(ctx, world.cameras);

  // Draw guards and their dynamic vision cones
  drawGuards(ctx, world.guards, world);

  // Draw active gadget effects (EMP, smoke, decoys)
  drawGadgetEffects(ctx, world);

  // Draw player thief
  drawPlayer(ctx, world.player);

  // Draw tension vignette and screen alerts
  drawTensionOverlay(ctx, world.tension, world.alarm);

  // Draw complete tactical HUD (Alarm meter, gadgets, objectives)
  drawHUD(ctx, world);
}

function drawFloorGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = THEME.floorGrid;
  ctx.lineWidth = 1;

  const gridSize = 40;
  for (let x = 0; x <= VIEWPORT.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, VIEWPORT.height);
    ctx.stroke();
  }
  for (let y = 0; y <= VIEWPORT.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(VIEWPORT.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRouteFloorGuides(ctx) {
  ctx.save();
  ctx.font = 'bold 11px monospace';

  // Route 1: Vent label
  ctx.fillStyle = 'rgba(0, 255, 204, 0.4)';
  ctx.fillText('◄ ROUTE 1: NORTH VENTILATION SHAFT (STEALTH / BYPASS)', 230, 95);

  // Route 2: Main Hall label
  ctx.fillStyle = 'rgba(0, 210, 255, 0.4)';
  ctx.fillText('◄ ROUTE 2: CENTRAL ATRIUM (COVER PILLARS & GUARDS)', 230, 260);

  // Route 3: Laser corridor label
  ctx.fillStyle = 'rgba(255, 0, 85, 0.45)';
  ctx.fillText('◄ ROUTE 3: SOUTH LASER GRID (EMP / TERMINAL HACK)', 230, 770);

  // Cover zone floor outlines
  ctx.fillStyle = THEME.coverZone;
  ctx.fillRect(265, 295, 90, 90);
  ctx.fillRect(485, 295, 90, 90);
  ctx.fillRect(365, 455, 100, 80);
  ctx.fillRect(515, 455, 90, 80);

  ctx.restore();
}

function drawExtractionVan(ctx, extraction, status) {
  ctx.save();
  const { x, y, width, height } = extraction;

  // Van body
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = status === MISSION_STATUS.LOOT_ACQUIRED ? '#38bdf8' : '#334155';
  ctx.lineWidth = 2;
  ctx.fillRect(x, y - height / 2, width, height);
  ctx.strokeRect(x, y - height / 2, width, height);

  // Van windshield
  ctx.fillStyle = status === MISSION_STATUS.LOOT_ACQUIRED ? 'rgba(56, 189, 248, 0.6)' : 'rgba(51, 65, 85, 0.4)';
  ctx.fillRect(x + width - 18, y - height / 2 + 15, 12, height - 30);

  // Neon getaway beacon
  ctx.fillStyle = status === MISSION_STATUS.LOOT_ACQUIRED ? '#22c55e' : '#64748b';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GETAWAY VAN', x + width / 2, y + height / 2 + 18);
  ctx.fillText(status === MISSION_STATUS.LOOT_ACQUIRED ? 'READY FOR EXTRACTION' : 'STANDBY', x + width / 2, y + height / 2 + 30);

  ctx.restore();
}

function drawVents(ctx, vents, playerInVent) {
  ctx.save();
  for (const vent of vents) {
    // Vent duct background tunnel
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.15)';
    ctx.lineWidth = 28;
    ctx.beginPath();
    ctx.moveTo(vent.entryX, vent.entryY);
    ctx.lineTo(vent.exitX, vent.exitY);
    ctx.stroke();

    // Vent Grates
    [ { x: vent.entryX, y: vent.entryY, label: 'VENT ENTRY' }, { x: vent.exitX, y: vent.exitY, label: 'VENT EXIT' } ].forEach(pt => {
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = THEME.ventColor;
      ctx.lineWidth = 2;
      ctx.fillRect(pt.x - 16, pt.y - 16, 32, 32);
      ctx.strokeRect(pt.x - 16, pt.y - 16, 32, 32);

      // Grate slits
      ctx.beginPath();
      for (let i = -10; i <= 10; i += 5) {
        ctx.moveTo(pt.x + i, pt.y - 12);
        ctx.lineTo(pt.x + i, pt.y + 12);
      }
      ctx.stroke();

      ctx.fillStyle = THEME.ventColor;
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(pt.label, pt.x, pt.y + 28);
    });
  }
  ctx.restore();
}

function drawLasers(ctx, lasers, terminal) {
  ctx.save();

  // Terminal
  ctx.fillStyle = terminal.hacked ? '#22c55e' : '#0284c7';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.fillRect(terminal.x, terminal.y, terminal.w, terminal.h);
  ctx.strokeRect(terminal.x, terminal.y, terminal.w, terminal.h);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TERMINAL', terminal.x + terminal.w / 2, terminal.y + terminal.h + 12);

  // Lasers
  for (const laser of lasers) {
    if (laser.active) {
      // Glow beam
      ctx.strokeStyle = THEME.laserGlow;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();

      // Sharp core beam
      ctx.strokeStyle = THEME.laserActive;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();
    } else {
      // Disabled indicator
      ctx.strokeStyle = 'rgba(255, 0, 85, 0.15)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Laser emitter mounts
    ctx.fillStyle = '#334155';
    ctx.fillRect(laser.x1 - 5, laser.y1 - 6, 10, 6);
    ctx.fillRect(laser.x2 - 5, laser.y2, 10, 6);
  }
  ctx.restore();
}

function drawVaultAndLoot(ctx, vault, loot) {
  ctx.save();

  // Vault room backdrop
  ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
  ctx.fillRect(860, 180, 360, 480);

  // Vault Door
  if (!vault.isOpen) {
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = THEME.vaultDoor;
    ctx.lineWidth = 4;
    ctx.fillRect(vault.doorX, vault.doorY, vault.doorW, vault.doorH);
    ctx.strokeRect(vault.doorX, vault.doorY, vault.doorW, vault.doorH);

    // Locking bolts
    ctx.fillStyle = THEME.vaultGlow;
    ctx.beginPath();
    ctx.arc(vault.doorX + vault.doorW / 2, vault.doorY + vault.doorH / 2, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HEAVY VAULT DOOR', vault.doorX + vault.doorW / 2, vault.doorY - 10);
    ctx.fillText(`INTEGRITY: ${Math.round(vault.lockHealth)}%`, vault.doorX + vault.doorW / 2, vault.doorY + vault.doorH + 18);
  } else {
    // Open vault door frame
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(vault.doorX, vault.doorY, vault.doorW, vault.doorH);
    ctx.setLineDash([]);

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('VAULT BREACHED', vault.doorX + vault.doorW / 2, vault.doorY - 8);
  }

  // Loot target (The Golden Quantum Core)
  if (!loot.collected) {
    // Outer radiant ring
    ctx.strokeStyle = THEME.vaultGlow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, loot.radius + 6, 0, Math.PI * 2);
    ctx.stroke();

    // Inner gold core
    const gradient = ctx.createRadialGradient(loot.x, loot.y, 2, loot.x, loot.y, loot.radius);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.4, THEME.lootGold);
    gradient.addColorStop(1, '#b45309');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(loot.x, loot.y, loot.radius, 0, Math.PI * 2);
    ctx.fill();

    // Data core label
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('★ TARGET: QUANTUM CORE ★', loot.x, loot.y - 32);
    ctx.font = '10px monospace';
    ctx.fillText('VALUE: $1,000,000', loot.x, loot.y + 36);
  }

  ctx.restore();
}

function drawWalls(ctx, walls) {
  ctx.save();
  for (const wall of walls) {
    ctx.fillStyle = THEME.wallFill;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

    ctx.strokeStyle = wall.isCover ? '#00e5ff' : THEME.wallStroke;
    ctx.lineWidth = wall.isCover ? 2 : 1.5;
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);

    if (wall.isCover && wall.label) {
      ctx.fillStyle = 'rgba(0, 229, 255, 0.8)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(wall.label, wall.x + wall.w / 2, wall.y + wall.h / 2 + 3);
    }
  }
  ctx.restore();
}

function drawCameras(ctx, cameras) {
  ctx.save();
  for (const cam of cameras) {
    const isOff = cam.disabledTimer > 0;

    // Conical camera vision beam
    if (!isOff) {
      const halfFov = cam.fov / 2;
      const angle1 = cam.currentAngle - halfFov;
      const angle2 = cam.currentAngle + halfFov;

      ctx.beginPath();
      ctx.moveTo(cam.x, cam.y);
      ctx.arc(cam.x, cam.y, cam.range, angle1, angle2);
      ctx.closePath();

      ctx.fillStyle = cam.detecting ? THEME.cameraAlertBeam : THEME.cameraBeam;
      ctx.fill();

      // Scanline arc
      ctx.strokeStyle = cam.detecting ? 'rgba(239, 68, 68, 0.8)' : 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Camera mount & eyeball
    ctx.fillStyle = isOff ? '#475569' : cam.detecting ? '#ef4444' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Camera label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isOff ? 'CAM [DISABLED]' : 'CCTV-AI', cam.x, cam.y - 12);
  }
  ctx.restore();
}

function drawGuards(ctx, guards, world) {
  ctx.save();
  for (const guard of guards) {
    const isAlert = guard.state === 'ALERT' || guard.alert > 0.4;
    const fov = 1.08; // ~62 deg
    const range = guard.alert > 0.5 ? 290 : 260;

    // Guard Vision Cone (Raycast / clipped against distance)
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.arc(guard.x, guard.y, range, guard.angle - fov / 2, guard.angle + fov / 2);
    ctx.closePath();

    ctx.fillStyle = isAlert ? THEME.guardConeAlert : THEME.guardConeNormal;
    ctx.fill();

    ctx.strokeStyle = isAlert ? 'rgba(239, 68, 68, 0.7)' : 'rgba(234, 179, 8, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Guard body
    ctx.fillStyle = isAlert ? THEME.guardAlert : THEME.guardNormal;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Facing direction visor
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * 16, guard.y + Math.sin(guard.angle) * 16);
    ctx.stroke();

    // Guard state tag
    ctx.fillStyle = isAlert ? '#ef4444' : '#fef08a';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    const tag = guard.state === 'ALERT' ? '! ALERT' : guard.state === 'INVESTIGATING' ? '? SEARCHING' : 'PATROL';
    ctx.fillText(tag, guard.x, guard.y - 18);
  }
  ctx.restore();
}

function drawGadgetEffects(ctx, world) {
  ctx.save();

  // Active EMP Shockwaves
  for (const emp of world.activeEMP) {
    ctx.strokeStyle = THEME.empWave;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(emp.x, emp.y, emp.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Active Nanotech Smoke Clouds
  for (const smoke of world.activeSmoke) {
    const alpha = Math.min(0.7, smoke.timer / smoke.maxDuration);
    ctx.fillStyle = `rgba(148, 163, 184, ${alpha})`;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, smoke.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('NANOTECH SMOKE (VISION BLOCKED)', smoke.x, smoke.y);
  }

  // Active Audio Decoy
  if (world.activeDecoy) {
    const d = world.activeDecoy;
    const pulseRadius = ((world.time * 60) % 70) + 10;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(d.x, d.y, pulseRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AUDIO DECOY PING', d.x, d.y - 14);
  }

  ctx.restore();
}

function drawPlayer(ctx, player) {
  ctx.save();

  // Stealth shadow aura
  ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius + 6, 0, Math.PI * 2);
  ctx.fill();

  // Player body
  ctx.fillStyle = THEME.playerColor;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Facing visor
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.angle) * 18, player.y + Math.sin(player.angle) * 18);
  ctx.stroke();

  // Player label
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(player.inVent ? 'THIEF [IN VENT]' : 'SHADOW THIEF', player.x, player.y - 18);

  ctx.restore();
}

function drawTensionOverlay(ctx, tension, alarm) {
  if (tension <= 0.05 && alarm <= 10) return;

  ctx.save();
  const intensity = Math.min(1.0, Math.max(tension, alarm / 100));
  const gradient = ctx.createRadialGradient(
    VIEWPORT.width / 2,
    VIEWPORT.height / 2,
    VIEWPORT.width * 0.35,
    VIEWPORT.width / 2,
    VIEWPORT.height / 2,
    VIEWPORT.width * 0.65
  );

  if (alarm >= ALARM_THRESHOLDS.LOCKDOWN) {
    gradient.addColorStop(0, 'rgba(239, 68, 68, 0)');
    gradient.addColorStop(1, `rgba(239, 68, 68, ${0.45 * intensity})`);
  } else {
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(2, 6, 23, ${0.65 * intensity})`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, VIEWPORT.width, VIEWPORT.height);
  ctx.restore();
}

function drawHUD(ctx, world) {
  ctx.save();

  // --- Top Navigation / Status Bar ---
  ctx.fillStyle = 'rgba(7, 10, 18, 0.9)';
  ctx.fillRect(0, 0, VIEWPORT.width, 52);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 52);
  ctx.lineTo(VIEWPORT.width, 52);
  ctx.stroke();

  // Mission Title
  ctx.fillStyle = '#00d2ff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('OPERATION: SHADOW PROTOCOL // HEIST IN PROGRESS', 24, 24);

  // Status text
  ctx.fillStyle = world.player.visibleToGuards ? '#ef4444' : '#22c55e';
  ctx.font = '11px monospace';
  const statusLabel = world.player.visibleToGuards ? 'STATUS: DETECTED BY SECURITY!' : 'STATUS: UNDETECTED (STEALTH)';
  ctx.fillText(statusLabel, 24, 42);

  // --- ALARM METER (Prominent in top center) ---
  const alarmBarX = 460;
  const alarmBarY = 16;
  const alarmBarW = 340;
  const alarmBarH = 20;

  // Meter container
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = world.alarm > 60 ? '#ef4444' : world.alarm > 30 ? '#eab308' : '#38bdf8';
  ctx.lineWidth = 2;
  ctx.fillRect(alarmBarX, alarmBarY, alarmBarW, alarmBarH);
  ctx.strokeRect(alarmBarX, alarmBarY, alarmBarW, alarmBarH);

  // Meter Fill
  const fillW = Math.max(0, Math.min(alarmBarW, (world.alarm / 100) * alarmBarW));
  ctx.fillStyle = world.alarm > 60 ? '#ef4444' : world.alarm > 30 ? '#eab308' : '#0284c7';
  ctx.fillRect(alarmBarX, alarmBarY, fillW, alarmBarH);

  // Controls prompt
  ctx.fillStyle = '#64748b';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('WASD: MOVE | SHIFT: SPRINT | C: SNEAK | SPACE: HACK/CRACK | 1-4: GADGETS', 24, 72);

  // Meter Text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  const alarmLevel = world.alarm >= ALARM_THRESHOLDS.LOCKDOWN ? 'LOCKDOWN!' : world.alarm >= ALARM_THRESHOLDS.CAUTION ? 'CAUTION' : 'CLEAR';
  ctx.fillText(`FACILITY ALARM: ${Math.round(world.alarm)}% [${alarmLevel}]`, alarmBarX + alarmBarW / 2, alarmBarY + 14);

  // Objective Display
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'right';
  let objectiveText = 'OBJECTIVE: CRACK VAULT & STEAL CORE';
  if (world.status === MISSION_STATUS.VAULT_UNLOCKED) objectiveText = 'OBJECTIVE: SECURE QUANTUM DATA CORE';
  if (world.status === MISSION_STATUS.LOOT_ACQUIRED) objectiveText = 'OBJECTIVE: ESCAPE TO GETAWAY VAN!';
  if (world.status === MISSION_STATUS.ESCAPED) objectiveText = 'MISSION ACCOMPLISHED: HEIST WON!';
  ctx.fillText(objectiveText, VIEWPORT.width - 24, 24);

  // Energy pool
  ctx.fillStyle = '#38bdf8';
  ctx.font = '11px monospace';
  ctx.fillText(`OPERATIVE ENERGY: ${Math.round(world.player.energy)} / ${world.player.maxEnergy} EP`, VIEWPORT.width - 24, 42);

  // --- Bottom Tactical Dock: Gadgets & Tools ---
  const dockY = VIEWPORT.height - 48;
  ctx.fillStyle = 'rgba(7, 10, 18, 0.92)';
  ctx.fillRect(0, dockY, VIEWPORT.width, 48);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.3)';
  ctx.beginPath();
  ctx.moveTo(0, dockY);
  ctx.lineTo(VIEWPORT.width, dockY);
  ctx.stroke();

  // Gadget Buttons
  const gadgetList = [
    GADGETS.EMP,
    GADGETS.SMOKE,
    GADGETS.DECOY,
    GADGETS.LOCKPICK,
  ];

  const btnW = 200;
  const startX = (VIEWPORT.width - gadgetList.length * btnW) / 2;

  gadgetList.forEach((g, idx) => {
    const x = startX + idx * btnW;
    const canAfford = world.player.energy >= g.cost;

    ctx.fillStyle = canAfford ? 'rgba(30, 41, 59, 0.8)' : 'rgba(15, 23, 42, 0.6)';
    ctx.strokeStyle = canAfford ? '#38bdf8' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.fillRect(x + 5, dockY + 6, btnW - 10, 36);
    ctx.strokeRect(x + 5, dockY + 6, btnW - 10, 36);

    ctx.fillStyle = canAfford ? '#38bdf8' : '#64748b';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`[${g.key}] ${g.name}`, x + btnW / 2, dockY + 22);

    ctx.font = '9px monospace';
    ctx.fillStyle = canAfford ? '#94a3b8' : '#475569';
    ctx.fillText(`COST: ${g.cost} EP`, x + btnW / 2, dockY + 34);
  });

  ctx.restore();
}
