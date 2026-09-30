# Alpha design decisions

## Safe baseline — applies to every level

An untouched course must deliver **100 of 100 starting critters to the exit**.
The player creates the danger. Baseline deaths obscure the player's effect and
make the experiment start with fewer meaningful participants.

This is a level/physics design constraint, not a special immunity flag. Tune
geometry and runner competence together. Keep damage and falling physics active
whether or not traps are present. Test the weakest supported traits as well as
the visible default seed.

Every level must be registered in src/levels/index.ts and pass the shared
baseline tests, including its initial devices. Keep future supported populations
and trait ranges in those tests.

## One-screen first course

All critters start together at the level's single spawn point. There is no
per-runner position offset or staggered release; trait differences spread them
out naturally after the run begins.

Keep the entire start, hill, gap, and exit in view. Level 1 is 1,600 world units
wide with a 96-unit gap. The camera fits width; rendering and pointer conversion
use the same scale. There is no manual pan, follow toggle, or minimap.

## Focus on the experiment

Put the build tools together below the course. Make Build mode large and obvious,
and distinguish it from a locked running state. Use one Run swarm action.

Use fixed, brisk defaults instead of asking the player to tune wheel speed,
conveyor force, or playback speed. The current default course takes about eight
seconds, which is short enough to watch without a speed menu. This is an original
tuning choice; it does not claim to reproduce any particular Mario game's units.

Show generation and survivor counts. Keep average inherited HP and shell, with
changes from the previous completed generation, inside a collapsed Survivor
traits disclosure. Label the next run as the next generation. Keep technical
metrics and device configuration outside the player UI.


## Damage and inheritance

Spike Wheel deals piercing damage; Hammer Wheel deals blunt damage. Each contact
subtracts 35 × (1 ∓ 0.5 × shell) HP, with a 0.3-second cooldown per device and
runner. The shell axis always trades one protection for the other. Falls and
timeouts remain instant deaths. HP and shell affect appearance, while every
collision remains 12×18.

Only finishers are parents. Each child chooses two survivors with replacement,
selects either parent's value independently per trait, adds seeded Gaussian
mutation, and clamps to the registry bounds. Zero finishers cause extinction.
An interrupted run leaves its generation intact; a completed run breeds the
next generation. Start over resets the lineage and preserves placed devices.

The proposed HP cost, movement-trait evolution policy, and damage tuning remain
open design decisions.
