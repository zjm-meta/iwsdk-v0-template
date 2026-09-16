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
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
} from '@iwsdk/core';
import { COURT } from './pong-components.js';

const UNIT_BOX = new BoxGeometry(1, 1, 1);
const FACE_PLANE = new PlaneGeometry(1, 1);

const HW = COURT.paddleHalfWidth;
const HH = COURT.paddleHalfHeight;
const RAIL = 0.028;

/** Name the pong systems use to find the paddle's accent light. */
export const PADDLE_LIGHT_NAME = 'paddle-light';
export const PADDLE_LIGHT_INTENSITY = 2.6;

/**
 * Builds one parentless paddle prototype: a glowing rail frame around a
 * translucent additive face, lit from behind by its own point light.
 */
export function createPaddle(color: number, name: string): Group {
  const paddle = new Group();
  paddle.name = name;

  const rail = new MeshStandardMaterial({
    color: 0x0b1024,
    emissive: color,
    emissiveIntensity: 2.4,
    roughness: 0.25,
    metalness: 0.4,
  });

  const face = new MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.16,
    blending: AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });

  const addRail = (
    sx: number,
    sy: number,
    x: number,
    y: number,
  ): void => {
    const bar = new Mesh(UNIT_BOX, rail);
    bar.scale.set(sx, sy, RAIL);
    bar.position.set(x, y, 0);
    paddle.add(bar);
  };

  addRail(HW * 2 + RAIL, RAIL, 0, HH);
  addRail(HW * 2 + RAIL, RAIL, 0, -HH);
  addRail(RAIL, HH * 2 + RAIL, HW, 0);
  addRail(RAIL, HH * 2 + RAIL, -HW, 0);

  const panel = new Mesh(FACE_PLANE, face);
  panel.scale.set(HW * 2, HH * 2, 1);
  paddle.add(panel);

  const light = new PointLight(color, PADDLE_LIGHT_INTENSITY, 3.4, 2);
  light.name = PADDLE_LIGHT_NAME;
  paddle.add(light);

  return paddle;
}
