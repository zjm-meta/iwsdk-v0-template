/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  AdditiveBlending,
  BoxGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  TorusGeometry,
} from '@iwsdk/core';
import { COURT, NEON } from '../pong-components.js';

const UNIT_BOX = new BoxGeometry(1, 1, 1);
const UNIT_PLANE = new PlaneGeometry(1, 1);

const HW = COURT.halfWidth;
const HH = COURT.halfHeight;
const HD = COURT.halfDepth;
const EDGE = 0.022;
const GRID = 0.007;

const neonRail = (color: number, intensity: number): MeshStandardMaterial =>
  new MeshStandardMaterial({
    color: 0x080b1a,
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.3,
    metalness: 0.5,
  });

const glass = (color: number, opacity: number): MeshBasicMaterial =>
  new MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    side: DoubleSide,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

const railFrame = neonRail(NEON.slate, 1.6);
const railPlayer = neonRail(NEON.player, 3.2);
const railOpponent = neonRail(NEON.opponent, 3.2);
const railGrid = neonRail(NEON.slate, 2.2);
const railCenter = neonRail(NEON.ball, 0.9);

const wallGlass = glass(NEON.slate, 0.1);
const playerGoalGlass = glass(NEON.player, 0.05);
const opponentGoalGlass = glass(NEON.opponent, 0.07);

const arena = new Group();
arena.name = 'Pong Arena';

const bar = (
  material: MeshStandardMaterial,
  sx: number,
  sy: number,
  sz: number,
  x: number,
  y: number,
  z: number,
): void => {
  const mesh = new Mesh(UNIT_BOX, material);
  mesh.scale.set(sx, sy, sz);
  mesh.position.set(x, y, z);
  arena.add(mesh);
};

// Long rails running the length of the court.
for (const x of [-HW, HW]) {
  for (const y of [-HH, HH]) {
    bar(railFrame, EDGE, EDGE, HD * 2, x, y, 0);
  }
}

// End rings: cyan on the player's baseline, magenta on the opponent's.
for (const [z, material] of [
  [HD, railPlayer],
  [-HD, railOpponent],
] as const) {
  bar(material, HW * 2 + EDGE, EDGE, EDGE, 0, HH, z);
  bar(material, HW * 2 + EDGE, EDGE, EDGE, 0, -HH, z);
  bar(material, EDGE, HH * 2 + EDGE, EDGE, HW, 0, z);
  bar(material, EDGE, HH * 2 + EDGE, EDGE, -HW, 0, z);
}

// Floor grid inside the court reads the ball's depth at a glance.
for (let i = 1; i < 12; i += 1) {
  const z = -HD + (i * (HD * 2)) / 12;
  bar(railGrid, HW * 2, GRID, GRID, 0, -HH, z);
}
for (let i = 1; i < 6; i += 1) {
  const x = -HW + (i * (HW * 2)) / 6;
  bar(railGrid, GRID, GRID, HD * 2, x, -HH, 0);
}

// Mid-court divider.
bar(railCenter, HW * 2 + EDGE, GRID * 1.6, GRID * 1.6, 0, HH, 0);
bar(railCenter, HW * 2 + EDGE, GRID * 1.6, GRID * 1.6, 0, -HH, 0);
bar(railCenter, GRID * 1.6, HH * 2, GRID * 1.6, HW, 0, 0);
bar(railCenter, GRID * 1.6, HH * 2, GRID * 1.6, -HW, 0, 0);

const centerRing = new Mesh(
  new TorusGeometry(0.34, 0.006, 8, 48),
  railCenter,
);
centerRing.name = 'Center Ring';
arena.add(centerRing);

const panel = (
  material: MeshBasicMaterial,
  sx: number,
  sy: number,
  x: number,
  y: number,
  z: number,
  rotY: number,
): void => {
  const mesh = new Mesh(UNIT_PLANE, material);
  mesh.scale.set(sx, sy, 1);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  arena.add(mesh);
};

panel(wallGlass, HD * 2, HH * 2, -HW, 0, 0, Math.PI / 2);
panel(wallGlass, HD * 2, HH * 2, HW, 0, 0, Math.PI / 2);
panel(opponentGoalGlass, HW * 2, HH * 2, 0, 0, -HD, 0);
panel(playerGoalGlass, HW * 2, HH * 2, 0, 0, HD, 0);

export default arena;
