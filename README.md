# Банхар — 초원의 수호견

A self-contained, playable WebGL 2 landscape and Mongolian Bankhar guardian dog. Open [the upgraded scene](index.html), or [compare the preserved original](original.html). No build step, runtime dependencies, downloads, external fonts, API keys, or network assets.

`original.html` is unchanged, including its procedural dog mesh and animation source. Its SHA-256 is `a0bc3f2744753a6bd5e163ff177e8e3712d3b180162e09a797f7e1ec33555306`.

- Play: https://dev.gaiahead.com/bankhar-steppe/
- Ultra: https://dev.gaiahead.com/bankhar-steppe/?quality=ultra
- Previous animal model with the same hands-off controls: https://dev.gaiahead.com/bankhar-steppe/before-model.html
- Original: https://dev.gaiahead.com/bankhar-steppe/original.html
- Repository: https://github.com/gaiahead/bankhar-steppe

Implementation used Codex CLI with `gpt-6-astra` and `high` reasoning. The original file is retained for direct comparison; the upgrade builds on its procedural model rather than replacing it with a downloaded asset.

## What changed

- A stationary three-quarter opening frames the animal, foreground grass, cart track, gers, and layered mountain ranges. Starting movement gradually brings the camera behind the dog.
- The procedural Bankhar has been re-authored with an integrated skull/muzzle/jaw, smaller almond eye openings, folded ears, an athletic torso, articulated long legs and four detailed paws. Region-aware shell/strand grooming differentiates face, neck, body and tail. See **Procedural anatomy redesign** below for changes and remaining limitations.
- Three continuous rings of actual mountain geometry provide overlapping slate silhouettes and shaded ridges. Distance fog blends terrain and mountains into the procedural sky.
- Taller, curved grass ribbons use five segments, wind gusts, species variation, dry tips, distance LOD, track suppression, and interaction bending around the dog. A deterministic shuffle distributes every quality budget across the whole field.
- Procedural ground relief, tiny stones, flowers, seed heads, scattered outcrops, three detailed felt gers, eight sheep, and a stone ovoo with a blue khadag add local detail. The landscape remains open.
- Moving cloud coverage modulates sunlight across the terrain, grass, coat, and landmarks. Dog shadow mapping uses filtered depth samples; a separate soft contact term grounds the paws. Shared filmic tone mapping applies a restrained grade without bloom.
- Walk/trot/gallop transitions, turning lean, breathing, head glances, spring-driven tail, reactive ears, jump gathering and landing, forward rolls, and paw dust retain and extend the original animation.
- Small Korean parchment controls provide quality, lighting presets, pause, photo mode, PNG export, help, and reset. Touch controls support concurrent movement and jump/sprint inputs.

## Controls

| Input | Action |
|---|---|
| W / ↑ | Run; stays running until stopped |
| S / ↓ | Stop |
| Q / 질주 button | Start hands-off running around the local meadow; tap once, release, and watch |
| A / D, ← / → | Take over steering and cancel hands-off running |
| Space | Jump |
| E | Forward roll |
| Drag on landscape | Orbit |
| Mouse wheel | Zoom |
| H | Help |
| F | Enter / exit photo mode |
| P | Save a PNG of the canvas, without HUD |
| R | Reset position and opening camera |
| Esc | Exit photo mode / close settings |

Hands-off running follows a broad, gently varying loop around the opening meadow with changing run/sprint speed and simple look-ahead steering around gers, the ovoo, and outcrops. Starting after a manual excursion steers back toward the meadow without teleporting. Q is an idempotent start, including key repeat. The desktop and mobile 질주 buttons show active state with `aria-pressed`. S / 정지 stops; W, steering keys, or the joystick cancel autonomy and take over. Orbit and zoom remain available while watching.

Pause freezes the animal and wind. Pause and photo mode cancel hands-off running and clear held pointers; exiting does not restart it. Press Q / 질주 again to restart (or W to run manually). An existing jump or roll can finish after resuming. Photo mode also hides the HUD while allowing orbit and zoom, and restores the preceding pause state on exit. The small photo-mode exit control works on touch screens; use the **사진 저장** button inside photo mode to save on touch devices. Screenshot export does not force fullscreen.

On touch screens, push the left joystick upward to move and sideways to steer. Release to stop. The right controls provide jump, hands-off 질주, roll, and stop. Normal 질주 pointer release clears the held key while keeping autonomy active; the expected capture loss after release also leaves it active. Actual pointer cancellation or unexpected capture loss clears input and cancels autonomy. Window blur, document visibility changes, and reset also cancel it. Normal camera drag/release does not cancel autonomy. Game keys ignore focused form controls. There is no sound.

## Quality

| Setting | Maximum device pixel ratio | Grass budget | Strand budget | Undercoat shells | Shadow map | Small detail budget |
|---|---:|---:|---:|---:|---:|---:|
| Low | 0.75 | 18% | 22% | 1 | 1024² | 45% |
| High | 1.35 | 65% | 75% | 3 | 2048² | 100% |
| Ultra | 2 | 100% | 100% | 5 | 3072² | 100% |

The full coat has approximately 120,000 individual hairs plus whiskers. Auto selects High on desktop and Low for narrow/coarse-pointer devices, and reevaluates on resize. Manually selected quality stays fixed, including on SwiftShader. Add `?quality=low`, `?quality=high`, or `?quality=ultra` to select an initial budget. Ultra adds 1.25× supersampling at DPR 1 to soften fine fur/grass, still capped at an effective DPR of 2. High and Low never exceed the device pixel ratio.

Lighting offers afternoon, golden evening, and clear daylight presets. These change the actual sun direction, color, shadows, and scattering; they are not a simulated astronomical clock.

## Procedural anatomy redesign

The Bankhar now uses continuous cross-section surfaces for the skull, stop, tapered muzzle, ribcage, and abdominal tuck. Small almond eye openings, dark irises, thin lids, a wedge-shaped nose with nostril basins, folded ear leather, an integrated jaw and fine lip line, and four pads with toes and nails replace the former round appendages. The longer legs share their rest transformation with the skeleton; the hind stifle bends forward and the hock backward. Terrain-aware stance solving uses the actual bind lengths, with pad clearance and the existing rolling hull maintaining ground contact.

Rest-space grooming separates short face/shin hair from neck, body, and tail feathering. Finer undercoat breakup, narrower guard hairs, stable curve tangents, muted tan points, and reduced coat glare keep the coat black in the existing sunlight. The landscape and autorun/control source are preserved. Ultra retains the same 120,000 coat-hair target, five shells, resolution limits, and shadow budget; the anatomical skin is approximately 33,000 triangles. No reference photograph, external texture, mesh, generation service, or runtime dependency is shipped. This is a substantial procedural model revision, **not photographic realism**: surface transitions, small facial details, and fur antialiasing still look synthetic close up.

The final bounded appearance pass broadens the skull and forehead stop, integrates the lower jaw, and confines muted mahogany points to the lower muzzle beneath a black bridge. Recessed orbital planes, thin lids, curved dark-brown eye windows and small catchlights improve the face. Short directional surface detail and straighter torso guard hairs soften the smooth skin appearance. Aligned cross-section frames remove the limb skin twists that exposed pinched rear joints, without changing bone binds, skin weights, gait/IK, paw contacts, scenery, or controls.

Final-pass validation: `node tests/model.cjs` and `npm run test:render` passed with unchanged assertions; all eight actual shader programs compiled/linked with no GL errors. The native opening and close-face renders were inspected. The model remains visibly stylized: the muzzle markings and eyelid transitions still look constructed, and fine coat hairs remain grainy at close range. Final browser review remains pending with the parent reviewer.

## Run

Serve the directory with any static server, for example:

```sh
python3 -m http.server 8766
```

Open `http://localhost:8766/index.html`. The inline runtime also supports `file://` and GitHub Pages project subpaths. A WebGL 2 capable browser is required. Initialization and lost-context failures display an explicit message.

## Verification

Install **test-only** dependencies and run against an already running server:

```sh
npm install
npx playwright install chromium
npm test
```

`BANKHAR_URL` selects another URL, including a project subpath or file URL. `PLAYWRIGHT_MODULE` can point to an existing Playwright package, and `CHROMIUM_PATH` can select an installed executable. `BANKHAR_ONLY=touch` runs the mobile checks alone. The desktop context closes before mobile starts to avoid competing software renderers. These options are test configuration only; no local machine paths occur in the runtime.

The browser smoke suite uses an 800×500 SwiftShader viewport, Low gameplay checks, a 960×600 High still, and a 390×844 touch viewport. It exercises startup, actual movement/steering/sprint, jump and landing, roll, orbit/zoom, all quality and lighting choices, focused-control input isolation, pause/reset/photo/export, blur, resize, multitouch, and cancellation. It records browser errors, failed requests, PNGs, and a JSON report in ignored `test-results/`.

Additional checks:

```sh
npm run test:static
npm run test:model
node tests/autorun.cjs
npm run test:render
```

`test:static` executes full procedural initialization and simulation against a small DOM/GL stub. It checks original preservation, deterministic geometry initialization, movement, jumps, rolls, quality, pause/reset/photo, and input cleanup. **It does not verify browser rendering.** It also simulates ten minutes of autonomous running and checks bounded radius, varied speed/yaw, continuous position/heading, return from a manual excursion, release versus cancellation, manual takeover, and pause/photo restart.

`node tests/autorun.cjs` is the focused actual Playwright test for desktop start and real mobile touch down/up, continued movement and heading changes without further input, camera dragging, stop, key/joystick takeover, cancellation, capture loss, blur, reset, and pause/photo restart. It accepts `BANKHAR_URL`, `PLAYWRIGHT_MODULE`, and `CHROMIUM_PATH`. The final focused test passed in real Chromium/SwiftShader, including the desktop start button and mobile renderer. The parent also reran all five photo/Escape/WebGL edge checks on the final redesign with no errors.

`test:model` injects test-only geometry access into the existing static harness. It checks finite mesh data, normalized weights, identity rest binds, eye size, four paws, hind-joint direction, idle/sprint/landing pad contact, rolling clearance, the immutable comparison snapshot, and unchanged landscape/autorun/control source. The native inspection views are written under `test-results/model-{three,face,front,side}/render.png`; they are actual application renders, not generated reference art. The parent reran these geometry/rig checks, inspected the final Ultra model in real Chromium with zero JavaScript/WebGL errors, and reran the autonomous-control and photo-mode regressions. The full pre-existing smoke suite is recorded separately below as prior-version coverage, not as a new full-suite pass.

`test:render` is an optional Linux verification using Mesa EGL/OpenGL ES, Python 3, and Pillow. It records the application's actual GL commands at Ultra, compiles and links its actual shaders, replays mesh and texture uploads and three frames, checks GL errors, and writes `test-results/native/render.png` plus `report.json`. This verifies native GLES output, independently of the stub; **it does not verify browser DOM, CSS, events, or SwiftShader compatibility.**

Prior scene delivery validation (before the hands-off running change): the Chromium/SwiftShader smoke suite passed all 27 checks, including desktop gameplay and mobile multi-touch. A further 5 real-browser edge checks passed for focused-control Escape behavior, photo-button PNG export, WebGL errors, and the explicit unavailable-WebGL fallback. Static simulation checks also passed. Native Mesa llvmpipe compiled/linked all 8 actual shader programs and replayed 804 real GL commands with no GL errors. Final desktop Ultra and portrait screenshots were inspected. These are functional/rendering checks, not a hardware-GPU FPS benchmark. Real iOS/Android devices and Safari/Firefox have not been tested.

Run the extra checks with `npm run test:edge`. Heavy software-GPU tests should run sequentially; the browser suite releases the desktop context before mobile. PNG readback on software rendering may take substantially longer than on hardware. No independent-review success is claimed: the earlier delegated review timed out; final source inspection and regression testing were completed by the parent reviewer.

## Telemetry

`window.__bankharDebug` is a frozen object exposing getter snapshots for `ready`, `frameCount`, measured `frameMs` / `fps`, `renderer`, requested/effective quality and render budgets, dog position/speed/grounding/gait/roll, pause/photo state, camera, simulation time, lighting, and input state. `autonomous` reports the hands-off latch; the frozen `runPath` snapshot reports elapsed autonomous time, loop radius/center, target heading, and target speed. Safe methods: `setQuality`, `setLight`, `setPaused`, `setPhoto`, `reset`, and `savePhoto`. Rendering telemetry comes from real animation-frame timestamps, not a claimed target frame rate.

## Limits

This is procedural browser graphics, not Unreal or a promise of photorealism. Performance and antialiasing vary by GPU/browser; software rendering can be very slow. Simulation uses bounded 120 Hz substeps and accepts at most 100 ms per rendered frame, so extreme stalls slow simulation instead of destabilizing it. The sky uses layered procedural clouds rather than volumetric ray marching. Tone mapping occurs per material, not in a floating-point HDR postprocessing buffer. There is no bloom, screen-space ambient occlusion, or global illumination.

Sheep are static scenic meshes. Landmarks and distant mountains have no gameplay collision; the dog follows the procedural ground surface. The local terrain/grass follow the camera while landmarks and mountain rings remain at fixed world positions. Long excursions can reveal the finite mountain setup. Grass reacts immediately around the dog without persistent trampled trails. Small rocks/flowers use a finite area around the opening. Only the dog casts a shadow map; other objects use normal-based lighting. The game is an open exploration scene without objectives or saved progress.

All new artwork is generated by source code in `index.html`; no third-party image or model assets are distributed.
