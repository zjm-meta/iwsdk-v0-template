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

import { signal, World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { PanelSystem } from './panel.js';
import { PongSystem } from './pong.js';
import { PongPaddleControlSystem } from './pong-paddle-control.js';
import { PongScoreboardSystem } from './pong-scoreboard.js';

World.create(
  document.getElementById('scene-container') as HTMLDivElement,
  projectOptions,
).then((world) => {
  const globals = world.globals as Record<string, unknown>;
  globals.pongPlayerScore = signal(0);
  globals.pongOpponentScore = signal(0);
  globals.pongStatus = signal('');

  world.registerSystem(PongPaddleControlSystem, { priority: 5 });
  world.registerSystem(PongSystem, { priority: 12 });
  world.registerSystem(PongScoreboardSystem, { priority: 32 });
  world.registerSystem(PanelSystem, { priority: 34 });
});
