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

import { createComponent, Types } from '@iwsdk/core';

/**
 * Court geometry, in meters, expressed as half-extents around the arena node.
 * Scene assets build their geometry from these numbers and the scene JSON
 * places the arena node, so the runtime derives the court center from the
 * arena entity's world position rather than a second hard-coded copy.
 */
export const COURT = {
  halfWidth: 1.1,
  halfHeight: 0.7,
  halfDepth: 1.7,
  /** Distance from an end plane to that side's paddle. */
  paddleInset: 0.18,
  paddleHalfWidth: 0.26,
  paddleHalfHeight: 0.2,
  ballRadius: 0.06,
} as const;

/** Five-color neon palette shared by every pong asset. */
export const NEON = {
  void: 0x05060f,
  slate: 0x1b2340,
  player: 0x22d3ee,
  opponent: 0xff2d92,
  ball: 0xfff4d6,
} as const;

export const PongArena = createComponent('PongArena', {
  halfWidth: { type: Types.Float32, default: COURT.halfWidth, min: 0.4 },
  halfHeight: { type: Types.Float32, default: COURT.halfHeight, min: 0.3 },
  halfDepth: { type: Types.Float32, default: COURT.halfDepth, min: 0.6 },
});

export const PongPaddle = createComponent('PongPaddle', {
  side: {
    type: Types.Enum,
    enum: { Player: 'player', Ai: 'ai' },
    default: 'player',
  },
  halfWidth: { type: Types.Float32, default: COURT.paddleHalfWidth },
  halfHeight: { type: Types.Float32, default: COURT.paddleHalfHeight },
  /** Meters per second the AI paddle may travel. */
  maxSpeed: { type: Types.Float32, default: 1.9, min: 0.2, max: 6 },
});

export const PongBall = createComponent('PongBall', {
  velocity: { type: Types.Vec3, default: [0, 0, 0] },
  speed: { type: Types.Float32, default: 2.4 },
  radius: { type: Types.Float32, default: COURT.ballRadius },
});

export const PongScoreboard = createComponent('PongScoreboard', {});
