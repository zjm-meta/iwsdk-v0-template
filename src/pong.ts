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
  AudioUtils,
  createSystem,
  Entity,
  Object3D,
  PointLight,
  Signal,
  Vector3,
} from '@iwsdk/core';
import { PongArena, PongBall, PongPaddle } from './pong-components.js';
import {
  BALL_LIGHT_INTENSITY,
  BALL_LIGHT_NAME,
} from './scene-assets/pong-ball.scene-asset.js';
import {
  PADDLE_LIGHT_INTENSITY,
  PADDLE_LIGHT_NAME,
} from './pong-paddle-shape.js';

const MAX_DELTA = 1 / 20;
const BASE_SPEED = 2.4;
const MAX_SPEED = 6.5;
const SPEED_GAIN = 1.06;
const SERVE_DELAY = 1.3;
const RESTART_DELAY = 3.2;
const WIN_SCORE = 7;
/** Keep enough depth velocity that a grazing return never stalls mid-court. */
const MIN_DEPTH_SHARE = 0.55;

/**
 * Owns ball flight, wall and paddle collisions, the opponent AI, and scoring.
 * Runs in the simulation band, after the player's paddle has been positioned.
 */
export class PongSystem extends createSystem({
  arena: { required: [PongArena] },
  ball: { required: [PongBall] },
  paddles: { required: [PongPaddle] },
}) {
  private center!: Vector3;
  private serveTimer = SERVE_DELAY;
  private serveDirection = -1;
  private aiDriftX = 0;
  private aiDriftY = 0;
  private restartTimer = 0;

  init(): void {
    this.center = new Vector3();
    this.resetBall(-1);
  }

  update(delta: number): void {
    const dt = Math.min(delta, MAX_DELTA);
    const arenaEntity = firstEntity(this.queries.arena.entities);
    const ballEntity = firstEntity(this.queries.ball.entities);
    const ball = ballEntity?.object3D;
    if (arenaEntity?.object3D == null || ballEntity == null || ball == null) {
      return;
    }

    // Arena, paddles and ball are siblings under the level root, so the whole
    // simulation stays in that shared local space.
    this.center.copy(arenaEntity.object3D.position);
    const halfWidth = arenaEntity.getValue(PongArena, 'halfWidth') ?? 1.1;
    const halfHeight = arenaEntity.getValue(PongArena, 'halfHeight') ?? 0.7;
    const halfDepth = arenaEntity.getValue(PongArena, 'halfDepth') ?? 1.7;

    let playerEntity: Entity | null = null;
    let opponentEntity: Entity | null = null;
    for (const entity of this.queries.paddles.entities) {
      if (entity.getValue(PongPaddle, 'side') === 'ai') {
        opponentEntity = entity;
      } else {
        playerEntity = entity;
      }
    }

    this.decayLights(ball, playerEntity, opponentEntity, dt);

    if (this.restartTimer > 0) {
      this.restartTimer -= dt;
      if (this.restartTimer <= 0) {
        this.playerScore.value = 0;
        this.opponentScore.value = 0;
        this.status.value = '';
      }
    }

    const radius = ballEntity.getValue(PongBall, 'radius') ?? 0.06;
    const velocity = ballEntity.getVectorView(
      PongBall,
      'velocity',
    ) as Float32Array;

    if (this.serveTimer > 0) {
      this.serveTimer -= dt;
      ball.position.set(this.center.x, this.center.y, this.center.z);
      ball.scale.setScalar(clamp(1 - this.serveTimer / SERVE_DELAY, 0.35, 1));
      this.moveOpponent(opponentEntity, halfWidth, halfHeight, 0, 0, dt, true);
      if (this.serveTimer <= 0) {
        this.launchBall(ballEntity);
      }
      return;
    }

    ball.scale.setScalar(1);
    ball.position.x += velocity[0] * dt;
    ball.position.y += velocity[1] * dt;
    ball.position.z += velocity[2] * dt;
    ball.rotation.x += dt * 2.4;
    ball.rotation.y += dt * 1.7;

    this.bounceAxis(ball, velocity, 'x', this.center.x, halfWidth - radius);
    this.bounceAxis(ball, velocity, 'y', this.center.y, halfHeight - radius);

    const playerZ = this.center.z + halfDepth - 0.18;
    const opponentZ = this.center.z - halfDepth + 0.18;

    if (velocity[2] > 0 && ball.position.z + radius >= playerZ) {
      this.tryReturn(ball, velocity, ballEntity, playerEntity, playerZ, radius, -1);
    } else if (velocity[2] < 0 && ball.position.z - radius <= opponentZ) {
      this.tryReturn(
        ball,
        velocity,
        ballEntity,
        opponentEntity,
        opponentZ,
        radius,
        1,
      );
    }

    if (ball.position.z > this.center.z + halfDepth + 0.3) {
      this.awardPoint(this.opponentScore, 'CPU WINS', -1);
    } else if (ball.position.z < this.center.z - halfDepth - 0.3) {
      this.awardPoint(this.playerScore, 'YOU WIN', 1);
    }

    this.moveOpponent(
      opponentEntity,
      halfWidth,
      halfHeight,
      ball.position.x,
      ball.position.y,
      dt,
      velocity[2] > 0,
    );
  }

  private get playerScore(): Signal<number> {
    return this.globals.pongPlayerScore as Signal<number>;
  }

  private get opponentScore(): Signal<number> {
    return this.globals.pongOpponentScore as Signal<number>;
  }

  private get status(): Signal<string> {
    return this.globals.pongStatus as Signal<string>;
  }

  /** Reflects the ball off a court wall and nudges it back inside. */
  private bounceAxis(
    ball: Object3D,
    velocity: Float32Array,
    axis: 'x' | 'y',
    center: number,
    limit: number,
  ): void {
    const index = axis === 'x' ? 0 : 1;
    const offset = ball.position[axis] - center;
    if (offset > limit) {
      ball.position[axis] = center + limit;
      velocity[index] = -Math.abs(velocity[index]);
    } else if (offset < -limit) {
      ball.position[axis] = center - limit;
      velocity[index] = Math.abs(velocity[index]);
    }
  }

  private tryReturn(
    ball: Object3D,
    velocity: Float32Array,
    ballEntity: Entity,
    paddleEntity: Entity | null,
    planeZ: number,
    radius: number,
    depthSign: number,
  ): void {
    const paddle = paddleEntity?.object3D;
    if (paddleEntity == null || paddle == null) {
      return;
    }

    const halfWidth = paddleEntity.getValue(PongPaddle, 'halfWidth') ?? 0.26;
    const halfHeight = paddleEntity.getValue(PongPaddle, 'halfHeight') ?? 0.2;
    const dx = ball.position.x - paddle.position.x;
    const dy = ball.position.y - paddle.position.y;
    if (Math.abs(dx) > halfWidth + radius || Math.abs(dy) > halfHeight + radius) {
      return;
    }

    const speed = Math.min(
      (ballEntity.getValue(PongBall, 'speed') ?? BASE_SPEED) * SPEED_GAIN,
      MAX_SPEED,
    );
    ballEntity.setValue(PongBall, 'speed', speed);

    velocity[0] += (dx / halfWidth) * 1.9;
    velocity[1] += (dy / halfHeight) * 1.4;
    velocity[2] = depthSign * Math.abs(velocity[2]);
    this.normalizeVelocity(velocity, speed);

    ball.position.z = planeZ + depthSign * (radius + 0.005);

    this.pulseLight(paddle.getObjectByName(PADDLE_LIGHT_NAME), 9);
    this.pulseLight(
      ball.getObjectByName(BALL_LIGHT_NAME),
      BALL_LIGHT_INTENSITY * 2.4,
    );
    AudioUtils.play(paddleEntity);
  }

  private normalizeVelocity(velocity: Float32Array, speed: number): void {
    const length =
      Math.hypot(velocity[0], velocity[1], velocity[2]) || 1;
    velocity[0] = (velocity[0] / length) * speed;
    velocity[1] = (velocity[1] / length) * speed;
    velocity[2] = (velocity[2] / length) * speed;

    const minDepth = speed * MIN_DEPTH_SHARE;
    if (Math.abs(velocity[2]) < minDepth) {
      const sign = velocity[2] < 0 ? -1 : 1;
      velocity[2] = sign * minDepth;
      const planar = Math.hypot(velocity[0], velocity[1]) || 1;
      const budget = Math.sqrt(Math.max(speed * speed - minDepth * minDepth, 0));
      velocity[0] = (velocity[0] / planar) * budget;
      velocity[1] = (velocity[1] / planar) * budget;
    }
  }

  private awardPoint(
    score: Signal<number>,
    winMessage: string,
    serveDirection: number,
  ): void {
    score.value = score.peek() + 1;
    if (score.peek() >= WIN_SCORE) {
      this.status.value = winMessage;
      this.restartTimer = RESTART_DELAY;
      this.serveTimer = RESTART_DELAY;
    }
    this.resetBall(serveDirection);
  }

  private resetBall(serveDirection: number): void {
    this.serveDirection = serveDirection;
    this.serveTimer = Math.max(this.serveTimer, SERVE_DELAY);
    this.aiDriftX = (Math.random() - 0.5) * 0.24;
    this.aiDriftY = (Math.random() - 0.5) * 0.18;
  }

  /** Kicks the ball out of the center once the serve countdown expires. */
  private launchBall(ballEntity: Entity): void {
    const velocity = ballEntity.getVectorView(
      PongBall,
      'velocity',
    ) as Float32Array;
    velocity[0] = (Math.random() - 0.5) * 1.1;
    velocity[1] = (Math.random() - 0.5) * 0.7;
    velocity[2] = this.serveDirection;
    ballEntity.setValue(PongBall, 'speed', BASE_SPEED);
    this.normalizeVelocity(velocity, BASE_SPEED);
  }

  /** Chases the ball with a capped speed and a small aiming error. */
  private moveOpponent(
    opponentEntity: Entity | null,
    halfWidth: number,
    halfHeight: number,
    ballX: number,
    ballY: number,
    dt: number,
    idle: boolean,
  ): void {
    const paddle = opponentEntity?.object3D;
    if (opponentEntity == null || paddle == null) {
      return;
    }

    const maxSpeed = opponentEntity.getValue(PongPaddle, 'maxSpeed') ?? 1.9;
    const paddleHalfWidth =
      opponentEntity.getValue(PongPaddle, 'halfWidth') ?? 0.26;
    const paddleHalfHeight =
      opponentEntity.getValue(PongPaddle, 'halfHeight') ?? 0.2;

    const targetX = idle ? this.center.x : ballX + this.aiDriftX;
    const targetY = idle ? this.center.y : ballY + this.aiDriftY;
    const limitX = halfWidth - paddleHalfWidth;
    const limitY = halfHeight - paddleHalfHeight;
    const step = maxSpeed * dt * (idle ? 0.55 : 1);

    paddle.position.x = approach(
      paddle.position.x,
      clamp(targetX, this.center.x - limitX, this.center.x + limitX),
      step,
    );
    paddle.position.y = approach(
      paddle.position.y,
      clamp(targetY, this.center.y - limitY, this.center.y + limitY),
      step,
    );
  }

  private decayLights(
    ball: Object3D,
    playerEntity: Entity | null,
    opponentEntity: Entity | null,
    dt: number,
  ): void {
    const rate = Math.min(dt * 5, 1);
    relaxLight(ball.getObjectByName(BALL_LIGHT_NAME), BALL_LIGHT_INTENSITY, rate);
    relaxLight(
      playerEntity?.object3D?.getObjectByName(PADDLE_LIGHT_NAME),
      PADDLE_LIGHT_INTENSITY,
      rate,
    );
    relaxLight(
      opponentEntity?.object3D?.getObjectByName(PADDLE_LIGHT_NAME),
      PADDLE_LIGHT_INTENSITY,
      rate,
    );
  }

  private pulseLight(light: Object3D | undefined, intensity: number): void {
    if (light instanceof PointLight) {
      light.intensity = intensity;
    }
  }
}

function relaxLight(
  light: Object3D | undefined,
  base: number,
  rate: number,
): void {
  if (light instanceof PointLight) {
    light.intensity += (base - light.intensity) * rate;
  }
}

function firstEntity(entities: Iterable<Entity>): Entity | null {
  for (const entity of entities) {
    return entity;
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function approach(current: number, target: number, step: number): number {
  const delta = target - current;
  if (Math.abs(delta) <= step) {
    return target;
  }
  return current + Math.sign(delta) * step;
}
