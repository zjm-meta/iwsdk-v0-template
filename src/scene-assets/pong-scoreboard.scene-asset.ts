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

import { Mesh, MeshBasicMaterial, PlaneGeometry } from '@iwsdk/core';

/**
 * A blank emissive panel. `PongScoreboardSystem` clones this material at
 * runtime and attaches a canvas texture — the asset module itself stays free
 * of DOM access so the editor can evaluate it in its own realm.
 */
const scoreboard = new Mesh(
  new PlaneGeometry(1.8, 0.56),
  new MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.001,
    depthWrite: false,
    toneMapped: false,
  }),
);
scoreboard.name = 'Pong Scoreboard';

export default scoreboard;
