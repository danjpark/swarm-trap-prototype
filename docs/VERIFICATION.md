# Verification — v0.1

## Automated checks

- `npm run build`: strict TypeScript check and Vite production build passed.
- `npm test`: all 14 tests passed.
- Fixed-step determinism compares complete runner states and terminal ticks at
  0.5×, 1×, 2×, and 4× under mixed 30/60/144 Hz render scheduling.
- Covered: independent seeded stats; one-runner hill/gap traversal; population
  accounting on every tick; all three trap effects; platform carrying and
  one-way contact; placement/move/removal validation; 15 Hz ghost recording,
  visibility and time alignment; trait sensitivity; 60-second containment.
- Baseline: 61 escaped, 39 fell, 1886 simulation ticks (15.7167 seconds).

## Interactive browser checks

Tested the production build at
`http://127.0.0.1:4173/swarm-trap-prototype/` in the Chromium-based Codex in-app
browser on Windows.

Verified:
- Welcome instructions and direct entry into the level.
- A full 100-runner baseline preview agrees with the headless result.
- Fire Wheel, Reverse Track, and Vertical Platform placement.
- Radius configuration remains applied; drag snaps to the expected grid cell.
- A scrolled page does not shift canvas pointer coordinates when focused.
- Pause/resume, reset (restages all 100), Build, Preview Future, Commit Run.
- Editing controls lock while running.
- Completed results, survivor means and comparison to the previous run.
- Ghost checkbox and translucent prior trajectories during the next run.
- Removal of the selected device and Clear all.
- Camera slider panning; automatic follow during runs.
- Narrow 390 px viewport: no horizontal page overflow.
- Browser console: no warnings or errors during these checks.
- The initial public skeleton deployment was verified in the live browser,
  including subpath JavaScript, CSS, and Canvas execution. The finished release
  is additionally checked on the live Pages URL before delivery.

## Performance measurement

100 runners, normal 1× speed, debug enabled, a 144 Hz Windows display:

| Interactive sample | Mean rendered FPS | Mean update + draw time |
| --- | ---: | ---: |
| Full no-trap development run, 2,259 frames | 144 | 0.54 ms/frame |
| Production run with all three devices and ghosts, 657 frames | 144 | 0.52 ms/frame |

The second sample ends after 4.57 simulated seconds because the wheel kills the
swarm. Means include the changing active population until completion; dead and
finished runners cease physics updates. These are CPU timings measured around
the game frame, excluding GPU compositing. They are not total frame latency or
a cross-device benchmark. Rendering is requestAnimationFrame-driven and follows
display refresh rate rather than forcing a 60 FPS cap.

Node.js 24.19.0 headless benchmark, 20 complete runs after 5 warmups:

| Layout | Whole simulation CPU time (mean) | CPU per fixed tick |
| --- | ---: | ---: |
| Baseline | 6.68 ms | 0.0035 ms |
| Fire Wheel | 22.66 ms | 0.0305 ms |
| Conveyor | 8.60 ms | 0.0044 ms |
| Vertical Platform | 12.16 ms | 0.0063 ms |

Headless measurements exclude Canvas, UI, and recording. Reproduce with
`npm run benchmark`. Expect differences across machines, browsers, layouts,
window sizes and background load.

## Known verification limits

Firefox, Safari, touch controls, prolonged soak testing, and very large numbers
of placed devices were not separately tested. The intentional 100-runner
prototype scope and limitations are documented in the main README.

