# Version

Current version: v2.0.0-rc.4

Hotfix status: unreleased

## Unreleased hotfix

- Added a versioned first-run guided tour covering all permanent dashboard systems without changing gameplay state or save schema.
- Added save confidence/retry, validated portable import/export, and local UI QoL controls without changing save schema `5`.
- Added party-builder persistence and repair, activity filters, keyboard help, reduced-motion handling, and compact mobile quick actions.
- Replaced unconditional background save and render calls with dirty-state persistence.
- Flushes pending changes on browser visibility loss and pagehide, with retry-safe handling for failed writes.
- Preserves save-state schema `5`.

## v2.0.0-rc.4

- Fixed the wandering-hero recruitment event so “Offer a place” recruits a generated hero instead of training the first existing hero.
- Made event recruitment transactional with one authored cost.
- Prevented local-storage save and reset failures from crashing the game UI or reporting false success.
- Added the Cleric class and undead counter, consistent action outcomes, state invariants, focused system/state modules, and hotfix regression coverage.
- Fixed zero-morale handling, transactional paid events, defeat-effect cleanup, browser-storage recovery, and Greenwood Rescue threat metadata.
- Hardened schema-5 repair against stale catalog references, obsolete assignments, duplicate stacks and IDs, and inconsistent campaign state.
- Added authored-catalog validation and a structured code-quality regression suite.

Current phase: 22-phase release candidate quality-of-life verification

Current target: complete manual browser QA, balance tuning, and final presentation polish before v2.0.0 final

Package version: `2.0.0-rc.4`.

Save-state schema version: `5`. Product metadata stored in current saves is `2.0.0-rc.4`.

## v2.0.0-rc.3

- Added collapsible and pinnable dashboard sections with remembered UI preferences, back-to-top links, and compact display density.
- Added hero and contract filters, sorting, recommended assignment actions, and expandable unlock requirements.
- Added a persistent command bar with resource totals, active-expedition counts, save access, and a readable activity center.
- Added mobile command-bar refinements and a dedicated QoL smoke audit while preserving save schema `5` and gameplay balance.

## v2.0.0-rc.2

- Added a persistent desktop command index with five press-to-expand menu groups.
- Added a compact mobile Quick Menu drawer with backdrop closing, Escape support, focus containment, and inaccessible-when-closed behavior.
- Added stable anchors for all 18 permanent dashboard destinations, smooth section jumps, and current-location feedback.
- Added dedicated quick-navigation smoke coverage and visually verified desktop and phone layouts.

## v2.0.0-rc.1

- Promoted the complete 22-phase Guildmasters foundation to a release candidate.
- Added a dedicated roadmap audit covering every phase, catalog, core interaction, save-repair path, and release presentation contract.
- The release candidate is functionally verified by five regression/feature smoke suites plus the roadmap audit.
- Final v2.0.0 still requires manual browser QA, balance review, and final art/audio decisions.

## v1.3.0

- Added four bespoke multi-phase boss expeditions with unique mechanics, phase transcripts, rewards, and defeat records.
- Added branching campaign decisions that change flags, faction standing, research, influence, and prestige.
- Added rival heat, evolving rival actions, rumor pressure, and world-threat tracking.
- Added v1.3 smoke coverage and save repair for authored endgame progress.

## v1.2.0

- Added multi-round tactical encounters with class abilities, temporary status effects, enemy counters, combat transcripts, and persistent combat history.
- Added hero relationship moments with bond strength, morale rewards, and relationship save repair.
- Added achievements for tactical victories, campaign progress, rival wins, and hero bonds.
- Added v1.2 smoke coverage and updated the complete smoke command.

## v1.1.0

- Added authored campaign chapters with requirements, rewards, and chapter tracking.
- Added rival guild challenges with victory and defeat records.
- Added tactical drills with party power, enemy weaknesses, morale, and material rewards.
- Added an explicit offline return summary and safe return logging.
- Added v1.1 smoke coverage and advanced save repair.

## v1.0.0

- Implemented the shared foundation for all 22 roadmap phases.
- Added expanded heroes, contracts, regions, factions, guildhall rooms, equipment, crafting, research, staff, events, records, modes, and long-term progression.
- Added v1.0 state repair and a dedicated roadmap smoke suite.
- Preserved v0.2 reliability behavior and deterministic contract fixtures.

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
