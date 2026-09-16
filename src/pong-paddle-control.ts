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

import { createSystem, Vector3 } from '@iwsdk/core';
import { PongArena, PongPaddle } from './pong-components.js';

/** How far a hand travels, in meters, to sweep the full court width. */
const HAND_GAIN_X = 1.8;
const HAND_GAIN_Y = 1.8;
const FOLLOW_RATE = 16;
const TILT = 0.5;

/**
 * Drives the near paddle: mouse or touch on the canvas outside XR, and the
 * tracked right (or left) hand while a session is presenting.
 */
export class PongPaddleControlSystem extends createSystem({
  arena: { required: [PongArena] },
  paddles: { required: [PongPaddle] },
}) {
  private center!: Vector3;
  private hand!: Vector3;
  private head!: Vector3;
  private target!: Vector3;
  private pointerX = 0;
  private pointerY = 0;
  /** Hand pose relative to the head when the session started, so any resting
   * posture maps to the middle of the court. */
  private restOffsetX = 0;
  private restOffsetY = 0;
  private calibrated = false;

  init(): void {
    this.center = new Vector3();
    this.hand = new Vector3();
    this.head = new Vector3();
    this.target = new Vector3();

    const canvas = this.renderer.domElement;
    const onPointerMove = (event: PointerEvent): void => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }
      this.pointerX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
    canvas.addEventListener('pointermove', onPointerMove);
    this.cleanupFuncs.push(() =>
      canvas.removeEventListener('pointermove', onPointerMove),
    );
  }

  update(delta: number): void {
    let arenaEntity = null;
    for (const entity of this.queries.arena.entities) {
      arenaEntity = entity;
      break;
    }
    if (arenaEntity?.object3D == null) {
      return;
    }

    let paddle = null;
    let halfWidth = 0.26;
    let halfHeight = 0.2;
    for (const entity of this.queries.paddles.entities) {
      if (entity.getValue(PongPaddle, 'side') === 'player') {
        paddle = entity.object3D ?? null;
        halfWidth = entity.getValue(PongPaddle, 'halfWidth') ?? halfWidth;
        halfHeight = entity.getValue(PongPaddle, 'halfHeight') ?? halfHeight;
      }
    }
    if (paddle == null) {
      return;
    }

    this.center.copy(arenaEntity.object3D.position);
    const limitX = (arenaEntity.getValue(PongArena, 'halfWidth') ?? 1.1) - halfWidth;
    const limitY =
      (arenaEntity.getValue(PongArena, 'halfHeight') ?? 0.7) - halfHeight;

    if (this.xrManager?.isPresenting === true) {
      this.readHand();
      const offsetX = this.hand.x - this.head.x;
      const offsetY = this.hand.y - this.head.y;
      if (!this.calibrated) {
        this.restOffsetX = offsetX;
        this.restOffsetY = offsetY;
        this.calibrated = true;
      }
      this.target.x = this.center.x + (offsetX - this.restOffsetX) * HAND_GAIN_X;
      this.target.y = this.center.y + (offsetY - this.restOffsetY) * HAND_GAIN_Y;
    } else {
      this.calibrated = false;
      this.target.x = this.center.x + this.pointerX * limitX * 1.25;
      this.target.y = this.center.y + this.pointerY * limitY * 1.25;
    }

    this.target.x = clamp(this.target.x, this.center.x - limitX, this.center.x + limitX);
    this.target.y = clamp(this.target.y, this.center.y - limitY, this.center.y + limitY);

    const alpha = 1 - Math.exp(-FOLLOW_RATE * Math.min(delta, 1 / 20));
    const previousX = paddle.position.x;
    paddle.position.x += (this.target.x - paddle.position.x) * alpha;
    paddle.position.y += (this.target.y - paddle.position.y) * alpha;

    // Bank the paddle into its own travel so fast saves read as motion.
    const swing = clamp((paddle.position.x - previousX) * 26, -TILT, TILT);
    paddle.rotation.z += (-swing - paddle.rotation.z) * alpha;
  }

  private readHand(): void {
    this.player.head.getWorldPosition(this.head);
    const right = this.player.gripSpaces.right;
    const left = this.player.gripSpaces.left;
    const source = right?.visible === true ? right : (left ?? right);
    if (source == null) {
      this.hand.copy(this.head);
      return;
    }
    source.getWorldPosition(this.hand);
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
