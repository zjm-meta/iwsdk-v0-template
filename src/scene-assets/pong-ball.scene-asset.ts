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
  BackSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
} from '@iwsdk/core';
import { COURT, NEON } from '../pong-components.js';

/** Name the pong system uses to find the travelling ball light. */
export const BALL_LIGHT_NAME = 'ball-light';
export const BALL_LIGHT_INTENSITY = 5;

const ball = new Group();
ball.name = 'Pong Ball';

const core = new Mesh(
  new SphereGeometry(COURT.ballRadius, 24, 16),
  new MeshStandardMaterial({
    color: NEON.ball,
    emissive: NEON.ball,
    emissiveIntensity: 2.6,
    roughness: 0.15,
    metalness: 0.1,
  }),
);
core.name = 'Ball Core';
ball.add(core);

const halo = new Mesh(
  new SphereGeometry(COURT.ballRadius * 2.4, 20, 14),
  new MeshBasicMaterial({
    color: NEON.ball,
    transparent: true,
    opacity: 0.11,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  }),
);
halo.name = 'Ball Halo';
ball.add(halo);

const light = new PointLight(NEON.ball, BALL_LIGHT_INTENSITY, 5.5, 2);
light.name = BALL_LIGHT_NAME;
ball.add(light);

export default ball;
