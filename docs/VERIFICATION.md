# Verification — HP and survivor evolution

- Phase 1: 15 tests and production build passed. The proposed 0.3–0.7 movement
  bounds failed the untouched-course extreme test: at the all-low combination,
  0/100 reached the exit. Restored 0.4–0.6 hard bounds for speed, reaction, and
  agility. Initial sampling remains uniform 0.4–0.6. HP 70–130 and shell −1 to +1
  extremes pass.
- Phase 2: 17 tests and production build passed. Multipliers, per-device cooldown,
  and harmless wheel hub are checked.
- Phase 3: 20 tests and production build passed. Finished-only breeding, bounded
  offspring, extinction, abort behavior, and deterministic generation 5 pass.
- Phase 4: 20 tests and production build passed. Untouched level remains 100/100
  across 100 seeds and all 32 registered-trait extreme combinations.

The test suite also checks fixed-step playback, placements, replay, timeout,
platform behavior, and accounting.

## Merge verification

- All 20 tests and the production build pass after the UI adjustments.
- Production-preview browser check: the empty course finishes with 100 survivors;
  the result offers Run next generation and returning to Build preserves generation 2.
- Survivor traits expand on request and are collapsed by default.
- Device cards use four desktop columns and two at 700px, with no horizontal
  overflow at the checked smaller viewport. Updated docs/prototype.png.
- No browser warnings or errors were captured during this smoke test.
- PRs now run tests and builds before merging; deployment remains tied to main.
