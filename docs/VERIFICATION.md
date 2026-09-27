# Verification — simplified alpha

- Strict TypeScript compilation and production build pass.
- All 14 regression tests pass.
- Untouched level: **100 escaped / 0 stopped**, about 8.2 simulated seconds.
- Safe baseline checked across 100 seeds (10,000 critters) and all eight extreme
  trait combinations with all 100 critters sharing the spawn point (800 more critters).
- Shared spawn coordinates are checked, while each runner keeps its own independent position object.
- The test iterates the level registry and includes default level devices, so
  future registered levels must satisfy the same rule.
- Fixed-timestep reproducibility still passes at all internal playback
  multipliers; the player UI uses a fixed 1× pace.
- Physics checks cover wheel contact, conveyor slowdown, platform carrying and
  one-way contact, placement constraints, recording, and population accounting.
- Full-course camera regression verifies both start and exit remain in view.

Browser checks use the production build in the Chromium-based in-app browser:
the full course is visible, the baseline completes with all 100 runners,
placement/dragging use the correct fitted scale, traps change the outcome,
pause/resume works, and previous-run ghosts remain available.

The interface has no trait averages, trap configuration inputs, frame counters,
camera controls, playback-speed selector, or onboarding modal. Build tools and
simulation controls are grouped beneath the canvas. The last experiment shows
only counts and percentage stopped.

Developer profiling remains available through `npm run benchmark`. Previous
v0.1 measurements describe the older scrolling layout and should not be used as
current performance claims.

Firefox and Safari have not been independently checked. Mobile control is not
a target; the full-width canvas scales down rather than introducing scrolling.

