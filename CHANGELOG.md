# Changelog

## Unreleased hotfix

- Fixed the wandering-hero recruitment event so “Offer a place” recruits a generated hero instead of training the first existing hero.
- Made event recruitment transactional and charged its authored 80g cost exactly once.
- Prevented local-storage save and reset failures from propagating as uncaught UI errors or displaying false success messages.
- Added consistent action outcomes for recruitment, training, crafting, contracts, and other system actions.
- Added Cleric as a recruitable hero class and connected combat counters to the enemy catalog.
- Split the large system and game-state modules into focused compatibility-backed modules.
- Consolidated tactical drill metadata with the combat encounter catalog.
- Added game-state invariant validation for resources, heroes, assignments, equipment, inventory, and class counters.
- Added focused hotfix regression coverage for event transactions, persistence failures, reset failures, invariants, and undead counters.
- Updated GitHub Actions to run the complete smoke suite, including the new hotfix coverage.
- Added repository agent guidance for state, persistence, validation, and release-note changes.
- Caught browser-storage getter failures inside persistence error boundaries and made corrupt-load recovery visible in action state.
- Fixed zero morale being mistaken for missing morale across recovery, training, relationships, combat, contract failure, and hero display.
- Made every paid guild event transactional so unaffordable choices cannot grant rewards or consume the event.
- Cleared temporary combat effects after defeats as well as victories.
- Rejected unknown faction actions before they can spend influence or create stale save keys.
- Added collision-safe hero and activity-log IDs, including capped-log repair.
- Moved contract data into a data-only catalog and removed an unused contract import.
- Repaired stale catalog references, duplicate inventory stacks, invalid relationships, obsolete active contracts, temporary effects, and inconsistent campaign progress without changing save schema `5`.
- Added authored-catalog validation and fixed Greenwood Rescue’s missing spider threat reference.
- Kept persistence timestamps owned by successful saves instead of background contract polling.
- Added a structured code-quality smoke suite and kept compatibility entrypoints limited to their intended public surface.
