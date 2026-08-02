# Agent guidance

## Scope

Guildmasters is a browser-based game using native ES modules. Keep gameplay state changes in the relevant domain module and preserve the public exports consumed by `src/main.js` and the smoke suites.

## Hotfix expectations

- Validate changed JavaScript with `node --check`.
- Run the focused smoke suite and the full smoke command when the environment permits.
- Preserve save schema compatibility unless a change explicitly requires a migration.
- Treat save loading and saving as untrusted boundaries: malformed data or browser storage failures must not crash the game.
- Treat imported save files as untrusted: parse, repair, and validate them before replacement, then keep the current state if persistence fails.
- Keep background persistence dirty-state based; flush pending changes on page visibility loss and pagehide without adding unconditional storage-write loops.
- Keep `src/systems.js` and `src/gameState.js` as stable compatibility entrypoints; place new implementation in their focused submodules.
- Use canonical domain operations for actions triggered from multiple surfaces, including direct UI actions and guild events.
- Preserve transactional behavior: validate affordability and capacity before mutating resources or resolving an event.
- Run `npm run smoke:hotfix` when changing recruitment, persistence, state repair, class counters, or invariants.
- Run `npm run smoke:quality` when changing catalog references, action outcomes, morale handling, combat cleanup, compatibility exports, or activity-log integrity.
- Keep authored catalog references valid and make save repair remove obsolete catalog IDs before invariant validation.
- Update `CHANGELOG.md` and `VERSION.md` for user-visible fixes.

## Review focus

Check that event actions use the same canonical domain operations as direct UI actions, every persistence operation handles browser API failures safely, authored catalogs satisfy `validateCatalogs()`, and repaired saves satisfy `validateGameState()`.
