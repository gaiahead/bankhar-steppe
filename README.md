# Банхар — 초원의 수호견

A self-contained, playable WebGL 2 landscape and Mongolian Bankhar guardian dog. Open [the upgraded scene](index.html), or [compare the preserved original](original.html). No build step, runtime dependencies, downloads, external fonts, API keys, or network assets.

`original.html` is unchanged, including its procedural dog mesh and animation source. Its SHA-256 is `a0bc3f2744753a6bd5e163ff177e8e3712d3b180162e09a797f7e1ec33555306`.

- Play: https://dev.gaiahead.com/bankhar-steppe/
- Ultra: https://dev.gaiahead.com/bankhar-steppe/?quality=ultra
- Original: https://dev.gaiahead.com/bankhar-steppe/original.html
- Repository: https://github.com/gaiahead/bankhar-steppe

Implementation used Codex CLI with `gpt-6-astra` and `high` reasoning. The original file is retained for direct comparison; the upgrade builds on its procedural model rather than replacing it with a downloaded asset.

## What changed

- A stationary three-quarter opening frames the animal, foreground grass, cart track, gers, and layered mountain ranges. Starting movement gradually brings the camera behind the dog.
- The original lofted, skinned Bankhar remains: broad modeled head, eyes, muzzle, four articulated legs, mane, curled tail, surface detail, shell undercoat, and individual ribbon hairs. Finer guard hairs, warmer tan markings, softer highlights, cool sky reflection, and shorter whiskers improve coat readability.
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
| Q | Sprint; stays sprinting until W or S |
| A / D, ← / → | Steer |
| Space | Jump |
| E | Forward roll |
| Drag on landscape | Orbit |
| Mouse wheel | Zoom |
| H | Help |
| F | Enter / exit photo mode |
| P | Save a PNG of the canvas, without HUD |
| R | Reset position and opening camera |
| Esc | Exit photo mode / close settings |

Pause freezes the animal and wind. Photo mode also hides the HUD while allowing orbit and zoom, and restores the preceding pause state on exit. The small photo-mode exit control works on touch screens; use the **사진 저장** button inside photo mode to save on touch devices. Screenshot export does not force fullscreen.

On touch screens, push the left joystick upward to move and sideways to steer. Release to stop. The right controls provide jump, held sprint, roll, and stop. Pointer release, cancellation, lost capture, window blur, and document visibility changes clear inputs. Game keys ignore focused form controls. There is no sound.

## Quality

| Setting | Maximum device pixel ratio | Grass budget | Strand budget | Undercoat shells | Shadow map | Small detail budget |
|---|---:|---:|---:|---:|---:|---:|
| Low | 0.75 | 18% | 22% | 1 | 1024² | 45% |
| High | 1.35 | 65% | 75% | 3 | 2048² | 100% |
| Ultra | 2 | 100% | 100% | 5 | 3072² | 100% |

The full coat has approximately 120,000 individual hairs plus whiskers. Auto selects High on desktop and Low for narrow/coarse-pointer devices, and reevaluates on resize. Manually selected quality stays fixed, including on SwiftShader. Add `?quality=low`, `?quality=high`, or `?quality=ultra` to select an initial budget. Ultra adds 1.25× supersampling at DPR 1 to soften fine fur/grass, still capped at an effective DPR of 2. High and Low never exceed the device pixel ratio.

Lighting offers afternoon, golden evening, and clear daylight presets. These change the actual sun direction, color, shadows, and scattering; they are not a simulated astronomical clock.

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
npm run test:render
```

`test:static` executes full procedural initialization and simulation against a small DOM/GL stub. It checks original preservation, deterministic geometry initialization, movement, jumps, rolls, quality, pause/reset/photo, and input cleanup. **It does not verify browser rendering.**

`test:render` is an optional Linux verification using Mesa EGL/OpenGL ES, Python 3, and Pillow. It records the application's actual GL commands at Ultra, compiles and links its actual shaders, replays mesh and texture uploads and three frames, checks GL errors, and writes `test-results/native/render.png` plus `report.json`. This verifies native GLES output, independently of the stub; **it does not verify browser DOM, CSS, events, or SwiftShader compatibility.**

Delivery validation: the final Chromium/SwiftShader smoke suite passed all 27 checks, including desktop gameplay and mobile multi-touch. A further 5 real-browser edge checks passed for focused-control Escape behavior, photo-button PNG export, WebGL errors, and the explicit unavailable-WebGL fallback. Static simulation checks also passed. Native Mesa llvmpipe compiled/linked all 8 actual shader programs and replayed 804 real GL commands with no GL errors. Final desktop Ultra and portrait screenshots were inspected. These are functional/rendering checks, not a hardware-GPU FPS benchmark. Real iOS/Android devices and Safari/Firefox have not been tested.

Run the extra checks with `npm run test:edge`. Heavy software-GPU tests should run sequentially; the browser suite releases the desktop context before mobile. PNG readback on software rendering may take substantially longer than on hardware. No independent-review success is claimed: the earlier delegated review timed out; final source inspection and regression testing were completed by the parent reviewer.

## Telemetry

`window.__bankharDebug` is a frozen object exposing getter snapshots for `ready`, `frameCount`, measured `frameMs` / `fps`, `renderer`, requested/effective quality and render budgets, dog position/speed/grounding/gait/roll, pause/photo state, camera, simulation time, lighting, and input state. Safe methods: `setQuality`, `setLight`, `setPaused`, `setPhoto`, `reset`, and `savePhoto`. Rendering telemetry comes from real animation-frame timestamps, not a claimed target frame rate.

## Limits

This is procedural browser graphics, not Unreal or a promise of photorealism. Performance and antialiasing vary by GPU/browser; software rendering can be very slow. Simulation uses bounded 120 Hz substeps and accepts at most 100 ms per rendered frame, so extreme stalls slow simulation instead of destabilizing it. The sky uses layered procedural clouds rather than volumetric ray marching. Tone mapping occurs per material, not in a floating-point HDR postprocessing buffer. There is no bloom, screen-space ambient occlusion, or global illumination.

Sheep are static scenic meshes. Landmarks and distant mountains have no gameplay collision; the dog follows the procedural ground surface. The local terrain/grass follow the camera while landmarks and mountain rings remain at fixed world positions. Long excursions can reveal the finite mountain setup. Grass reacts immediately around the dog without persistent trampled trails. Small rocks/flowers use a finite area around the opening. Only the dog casts a shadow map; other objects use normal-based lighting. The game is an open exploration scene without objectives or saved progress.

All new artwork is generated by source code in `index.html`; no third-party image or model assets are distributed.
