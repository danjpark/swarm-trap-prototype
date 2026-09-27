# Swarm / Trap — prototype v0.1

**[Play the live demo](https://danjpark.github.io/swarm-trap-prototype/)** ·
[Public repository](https://github.com/danjpark/swarm-trap-prototype)

Build a platforming death course, watch 100 small autonomous creatures attempt
it, then change the course and compare the timelines. One level, three devices,
no accounts, servers, game engines, or runtime dependencies.

![The playable prototype](docs/prototype.png)

## Run locally

Use **Node.js 24 LTS or newer** (Node's native TypeScript support runs the tests).

```sh
git clone https://github.com/danjpark/swarm-trap-prototype.git
cd swarm-trap-prototype
npm ci
npm run dev
```

Open the URL printed by Vite, usually
`http://localhost:5173/swarm-trap-prototype/`.

```sh
npm test             # 14 deterministic simulation / editor / replay tests
npm run build        # strict TypeScript check + production bundle
npm run preview      # serve dist at localhost:4173/swarm-trap-prototype/
npm run benchmark    # 100-runner CPU benchmark; 20 measured runs after warmup
```

## Play

1. Choose **Start Building**. A no-trap preview is a useful baseline.
2. Select one of the three devices and click a valid position on the 32 px grid.
3. **Preview Future** runs all 100 creatures. **Commit Run** uses the same physics
   but labels the result as committed.
4. Watch alive/dead/escaped counts and the final survivor averages.
5. Return to **Build**, revise the course, and run again. **Show Previous Run**
   draws the last completed timeline in translucent lavender.

| Control | Action |
| --- | --- |
| 1 / 2 / 3 | Select Fire Wheel / Reverse Track / Vertical Platform |
| Click a device | Select it and expose configuration |
| Drag a placed device | Reposition; invalid moves preserve the old location |
| Delete / Backspace / right-click a device | Remove selected / clicked device |
| Escape | Select / move tool |
| A / D or left / right arrows | Pan horizontally; disables automatic follow |
| Course minimap / camera slider | Jump or pan to another part of the level |
| Follow swarm | Follow the active population |
| Space / pause button | Pause or resume |
| Reset | Restart the current simulation with identical seed and traps; in Build, restage and pan to start |
| Clear all | Remove every device in Build |
| Speed | 0.5×, 1×, 2×, or 4×; changes elapsed simulation steps, never physics timestep |
| Debug | FPS, average run cost, tick, seed, population means, bounds, look-ahead |
| Click a runner with Debug enabled during a run | Inspect that runner's traits and state |

The spawn area and exit approach are protected from placement. Tracks snap to
a solid, unobstructed surface. Platforms need a clear vertical travel path.
The editor validates placement and configuration instead of silently embedding
devices in terrain. Controls lock during simulation. A hidden browser tab pauses
an active run; resume when you return.

## Devices and traits

- **Fire Wheel:** outer 28% of rotating arms is hazardous; the hub is harmless.
  Configure radius, angular velocity (radians/second), and arm count.
- **Reverse Track:** reduces desired horizontal velocity on contact. Configure
  opposing speed in px/s. It causes no direct damage; a weak or stalled jump
  can still be fatal.
- **Vertical Platform:** one-way, 96 px wide; carries grounded runners between
  top and bottom coordinates at a configurable px/s speed. World Y increases
  downward. It can help the swarm as well as disrupt it.

Stats are independently seeded values in 0.40–0.60. **Speed** maps to running
velocity, **Reaction** controls look-ahead and response delay, and **Agility**
controls jump impulse. Runners perceive local terrain, not a precomputed route.
The creatures do not collide with one another.

With seed **240519** and no traps, **61 escape / 39 fall** in about 15.7 simulated
seconds. Controlled fixtures demonstrate the devices' effects:

| Fixture | Escaped | Stopped |
| --- | ---: | ---: |
| No devices | 61 | 39 |
| Fire Wheel at (1216, 416), default settings | 0 | 100 |
| Reverse Track at (1568, 448), opposing speed 165 | 6 | 94 |
| Platform at (1728, 448), top 320, bottom 448, speed 80 | 65 | 35 |

These are tuning references, not prescribed solutions. The level is intentionally
easy to overwhelm with unlimited devices.

## Architecture and file tree

Simulation modules have **no Canvas or DOM dependencies**. The UI owns editing
intent, World owns state, and renderers only observe it.

```text
src/
  main.ts                     application entry
  game/
    Game.ts                   modes, editing input, orchestration
    GameLoop.ts               requestAnimationFrame + fixed-step accumulator
    World.ts                  population, interactions, outcomes
    Camera.ts                 world-coordinate tracking and panning
    Editor.ts                 snapping, selection, validation
  simulation/
    Runner.ts                 runner state and dimensions
    RunnerStats.ts            independent trait data and aggregation
    RunnerSystem.ts           local sensing and jump state machine
    Physics.ts                gravity, AABB collisions, one-way surfaces
    SeededRandom.ts           centralized seeded PRNG
  levels/
    LevelDefinition.ts        serializable level schema
    level01.ts                the only level: rise, gap, exit
  traps/
    Trap.ts                   data and common interaction contract
    FireWheel.ts
    ReverseTrack.ts
    VerticalPlatform.ts
    factory.ts                device construction
  rendering/
    Renderer.ts               scene, ghosts, overview map
    RunnerRenderer.ts         swappable creature renderer
    TerrainRenderer.ts
    TrapRenderer.ts
  assets/AssetManager.ts      optional PNG/WebP sheet and animation definitions
  replay/
    RunRecorder.ts            position samples at 15 Hz
    GhostReplay.ts            tick-aligned, non-interacting playback
  ui/GameUI.ts                HTML controls, HUD, inspector, results
  types/geometry.ts           world coordinate primitives
  style.css
tests/simulation.test.ts      deterministic regression suite
scripts/benchmark.ts          headless CPU measurements
docs/                        screenshot and verification notes
.github/workflows/deploy.yml  GitHub Actions Pages deployment
```

Physics runs at **120 Hz**. Playback speed determines the number of fixed steps
per rendered frame. Trap phase, runner movement, and recordings all use
simulation time. Long frames are capped at 100 ms to avoid a catch-up spiral;
a severely overloaded machine slows wall-clock playback, not simulation rules.

The trap interface supplies updates, optional horizontal forces, optional
one-way surfaces, and contact interactions. New behavior does not require
rewriting the runner system. Trap/level definitions contain data, so JSON
export/import can be added later without changing physics.

A completed recording stores typed-array position/visibility samples at 15 Hz.
Only the latest completed run and the preceding comparison are retained; aborted
runs never replace a completed recording. Dead and finished ghosts disappear,
and ghosts never enter the collision system.

## Verification and performance

See [verification notes](docs/VERIFICATION.md) for tests, browser checks, and
measurement context. The local browser baseline averaged **144 FPS** on this
144 Hz display and **0.54 ms/frame** for simulation plus Canvas drawing with
debug enabled. This is a measurement on the development machine, not a guarantee
for all devices. Run the benchmark or enable Debug to measure your own system.

## Deployment

Pushes to `main`, or a manual `workflow_dispatch`, run:
checkout → Node LTS → `npm ci` → tests → production build →
configure Pages → upload `dist` → deploy Pages.

The public repository's Pages publishing source is **GitHub Actions**.
Vite uses `base: '/swarm-trap-prototype/'`; update this if renaming the repo.
No Jekyll or backend is involved. Deployment follows
[Vite's GitHub Pages guidance](https://vite.dev/guide/static-deploy.html#github-pages).

After deployment, verify the live page and play a complete run. Successful CI
alone does not prove that subpath JavaScript, CSS, and favicon URLs resolve.

## Current scope and limitations

- Exactly one level, 100 runners, and three devices.
- Desktop mouse/keyboard first. Layout resizes; mobile play is not a target.
- Editing and timelines live in memory. Reloading clears them.
- Preview and Commit Run deliberately share physics.
- Runs end at 60 simulated seconds. Any still-contained runner is counted as
  stopped/dead, with an explicit contained-at-limit note. This prevents endless
  stalled runs; it is not fire or falling damage.
- Simple one-way platforms; no crushing, wall climbing, collision between
  runners, pathfinding, or adaptive generations.
- Ghosts use 15 Hz samples without interpolation; their movement can look less
  smooth than the current population at high playback speed.
- Canvas interactions are mouse-first. HTML controls have labels and keyboard
  focus, but the spatial editor has no full screen-reader equivalent.
- Tested interactively in the Chromium-based in-app browser. Firefox and Safari
  compatibility is intended through standard APIs but not independently verified.
- All art is procedural and original; see [asset provenance](ASSET_LICENSES.md).

## Future Godot port

This is a deliberate future port, not an attempt to reuse TypeScript in Godot.
Preserve the rules, seeds, data models, and test fixtures.

| Prototype | Godot equivalent |
| --- | --- |
| World and Game | Gameplay scene and mode controller |
| Runner data and RunnerSystem | CharacterBody2D and small GDScript state machine |
| Trap contract | Node2D / Area2D scenes |
| LevelDefinition | Resource or level scene |
| Collision rectangles | CollisionShape2D |
| FixedStepper | `_physics_process()` |
| RunnerRenderer / sprite definitions | Sprite2D / AnimatedSprite2D |
| Recording | Transform samples and non-colliding replay nodes |

RunnerStats are independent values ready for a later inheritance experiment.
No mutation, generations, economy, progression, or evolution is implemented.

**Next smallest experiment:** limit the player to three placed devices, then
observe whether players move and combine them after seeing a ghost comparison.
That tests meaningful redesign without adding a fourth trap or another level.
Not implemented in v0.1.

### Future privacy transition

This prototype is intentionally public. Before a future Godot repository becomes
private, explicitly review Pages configuration. **Making a repository private
must not be assumed to make an existing Pages deployment private.** Later, leave
this as an archived public demo, move it to a dedicated demo repository, or
unpublish it. No privacy transition is performed here.

