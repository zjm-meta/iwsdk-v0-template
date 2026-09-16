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
  CanvasTexture,
  createSystem,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  Signal,
  SRGBColorSpace,
} from '@iwsdk/core';
import { NEON, PongScoreboard } from './pong-components.js';

const WIDTH = 1024;
const HEIGHT = 320;

const hex = (value: number): string => `#${value.toString(16).padStart(6, '0')}`;

/**
 * Paints the in-world score panel from the shared score signals. The canvas
 * only redraws when a signal changes, never per frame.
 */
export class PongScoreboardSystem extends createSystem({
  boards: { required: [PongScoreboard] },
}) {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private texture: CanvasTexture | null = null;
  private material: MeshBasicMaterial | null = null;

  init(): void {
    const redraw = (): void => this.draw();
    this.cleanupFuncs.push(
      this.playerScore.subscribe(redraw),
      this.opponentScore.subscribe(redraw),
      this.status.subscribe(redraw),
      () => {
        this.texture?.dispose();
        this.material?.dispose();
        this.texture = null;
        this.material = null;
        this.canvas = null;
        this.context = null;
      },
    );
  }

  update(): void {
    if (this.canvas != null) {
      return;
    }
    for (const entity of this.queries.boards.entities) {
      this.attach(entity.object3D as Mesh | null);
      return;
    }
  }

  /** Gives the panel its own material backed by a canvas texture. */
  private attach(mesh: Mesh | null): void {
    if (mesh == null) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const context = canvas.getContext('2d');
    if (context == null) {
      return;
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;

    const material = (mesh.material as MeshBasicMaterial).clone();
    material.map = texture;
    material.opacity = 1;
    material.needsUpdate = true;
    mesh.material = material;

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.material = material;
    this.draw();
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

  private draw(): void {
    const context = this.context;
    if (context == null) {
      return;
    }

    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    const status = this.status.peek();
    const player = hex(NEON.player);
    const opponent = hex(NEON.opponent);

    context.font = '600 34px "DM Sans", system-ui, sans-serif';
    glow(context, player, 18);
    context.fillText('YOU', WIDTH * 0.22, 56);
    glow(context, opponent, 18);
    context.fillText('CPU', WIDTH * 0.78, 56);

    context.font = '700 148px "DM Sans", system-ui, sans-serif';
    glow(context, player, 42);
    context.fillText(String(this.playerScore.peek()), WIDTH * 0.22, 158);
    glow(context, opponent, 42);
    context.fillText(String(this.opponentScore.peek()), WIDTH * 0.78, 158);

    glow(context, hex(NEON.ball), 22);
    context.font = '300 96px "DM Sans", system-ui, sans-serif';
    context.fillText('/', WIDTH * 0.5, 150);

    context.font = '600 40px "DM Sans", system-ui, sans-serif';
    glow(context, status === '' ? hex(NEON.ball) : player, status === '' ? 12 : 34);
    context.globalAlpha = status === '' ? 0.55 : 1;
    context.fillText(status === '' ? 'FIRST TO 7' : status, WIDTH * 0.5, 268);
    context.globalAlpha = 1;

    if (this.texture != null) {
      this.texture.needsUpdate = true;
    }
  }
}

function glow(
  context: CanvasRenderingContext2D,
  color: string,
  blur: number,
): void {
  context.fillStyle = color;
  context.shadowColor = color;
  context.shadowBlur = blur;
}
