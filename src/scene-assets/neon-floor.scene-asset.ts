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
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
} from '@iwsdk/core';
import { NEON } from '../pong-components.js';

const SIZE = 16;
const HALF = SIZE / 2;
const LINES = 16;
const LINE = 0.006;

const floor = new Group();
floor.name = 'Neon Floor';

const deck = new Mesh(
  new PlaneGeometry(SIZE, SIZE),
  new MeshStandardMaterial({
    color: NEON.void,
    roughness: 0.28,
    metalness: 0.75,
  }),
);
deck.rotation.x = -Math.PI / 2;
deck.name = 'Deck';
floor.add(deck);

const gridMaterial = new MeshStandardMaterial({
  color: 0x070a18,
  emissive: NEON.slate,
  emissiveIntensity: 1.5,
  roughness: 0.4,
  metalness: 0.2,
});

const UNIT_BOX = new BoxGeometry(1, 1, 1);

for (let i = 0; i <= LINES; i += 1) {
  const offset = -HALF + (i * SIZE) / LINES;

  const alongX = new Mesh(UNIT_BOX, gridMaterial);
  alongX.scale.set(SIZE, LINE, LINE);
  alongX.position.set(0, 0.002, offset);
  floor.add(alongX);

  const alongZ = new Mesh(UNIT_BOX, gridMaterial);
  alongZ.scale.set(LINE, LINE, SIZE);
  alongZ.position.set(offset, 0.002, 0);
  floor.add(alongZ);
}

export default floor;
