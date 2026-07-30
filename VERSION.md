# Version

Current version: v0.2.0

Current phase: reliability baseline

Current target: continue progression depth without weakening the v0.2 reliability contracts

Package version: `0.2.0`.

Save-state schema version: `1`. Product metadata stored in current saves is `0.2.0`.

## v0.2.0

- Added versioned save classification and repair with safe future-save rejection.
- Preserved absolute contract deadlines across reloads and prevented duplicate hero assignments or rewards.
- Added deterministic resolution fixtures while preserving live formulas and rewards.
- Bounded the newest-first Guild Log to 50 repaired structured entries.
- Added polite status announcements, explicit blocked/empty guidance, narrow-layout hardening, and 44px touch targets.
- Added a read-only progression report and matching GitHub Actions smoke coverage.
- Preserved the current progression layer: reputation-gated Ogre Toll Road, next-action guidance, ranked assignments, challenging-growth bonuses, milestones, and prototype victory.

## v0.1.5-dev

- Continued compact mobile CSS refinement after iPhone review.
- Reduced default body scale, header spacing, title size, panel/card padding, stat card size, button height, and vertical gaps.
- Added tighter panel title behavior so section headers do not create extra vertical space.
- Preserved the v0.1 low-noise visual direction.
- The current main branch also includes the playable guild-level progression, contract locks, Guild Log, and automated smoke coverage added after this version bump.
- Added next-action guidance, ranked hero assignments, challenging-contract growth, progression milestones, and an Ogre Toll Road victory message using the existing interface and state.

## v0.1.4-dev

- Compacted the mobile baseline after iPhone review.
- Reduced default font scale, hero title scale, panel/card padding, stat card padding, gaps, and button height.
- Added an under-420px breakpoint for smaller iPhone-width screens.
- Kept desktop density rules from v0.1.3-dev.

## v0.1.3-dev

- Tightened desktop density for larger resolutions.
- Reduced large-screen font scale, spacing, padding, border radius, and button height.
- Added 1100px and 1500px breakpoints for denser desktop layouts.
- Preserved mobile-first sizing for phone play.

## v0.1.2-dev

- Laid in v0.1 CSS rules.
- Added theme variables for the first visual pass.
- Improved mobile-first readability for panels, cards, stats, buttons, and log entries.
- Added responsive two-column layout for wider screens.
- Preserved the simple low-noise Guildmasters interface direction.

## v0.1.1-dev

- Added guild upgrade module.
- Added Upgrade Guild action to startup wiring.
- Exposed Upgrade Guild button in the UI.
- Guild upgrades spend gold, raise guild level, and increase hero capacity.
- Added manual v0.1.0-dev smoke test plan.

## v0.1.0-dev

- Added browser entrypoint.
- Added base styles.
- Added modular source files for game state, heroes, contracts, save system, UI, and startup wiring.
- Added recruit -> contract -> reward -> save loop foundation.
- Contracts can succeed or fail with visible success chances.

## v0.0.1

- Expanded the project README.
- Added the initial design contract.
- Added the roadmap from design foundation to v1.0.
- Locked the early direction as a lightweight idle guild-management game.
