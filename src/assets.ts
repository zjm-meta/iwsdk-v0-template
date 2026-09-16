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

import { AssetType, defineAssets } from '@iwsdk/core';
import neonFloor from './scene-assets/neon-floor.scene-asset.js';
import pongArena from './scene-assets/pong-arena.scene-asset.js';
import pongBall from './scene-assets/pong-ball.scene-asset.js';
import pongPaddleOpponent from './scene-assets/pong-paddle-opponent.scene-asset.js';
import pongPaddlePlayer from './scene-assets/pong-paddle-player.scene-asset.js';
import pongScoreboard from './scene-assets/pong-scoreboard.scene-asset.js';

// Build every public URL from BASE_URL so the runtime, the managed editor, and
// subpath builds all resolve the same file.
const publicAssetUrl = (filePath: string): string =>
  `${import.meta.env.BASE_URL}${filePath.replace(/^\/+/u, '')}`;

export default defineAssets({
  'welcome-panel': {
    url: publicAssetUrl('ui/welcome.uikitml'),
    type: AssetType.UIKitML,
    name: 'Welcome Panel',
  },
  'neon-floor': neonFloor,
  'pong-arena': pongArena,
  'pong-ball': pongBall,
  'pong-paddle-player': pongPaddlePlayer,
  'pong-paddle-opponent': pongPaddleOpponent,
  'pong-scoreboard': pongScoreboard,
});
