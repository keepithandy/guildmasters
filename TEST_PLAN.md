# Guildmasters Test Plan

## v2.0.0-rc.3 QoL Validation

Run the dedicated QoL audit:

```bash
npm run smoke:qol
```

The audit verifies the persistent command bar, activity center, remembered dashboard preferences, hero and contract filters, recommended assignment actions, unlock disclosures, compact density, and the unchanged save schema.

Manual QoL checks:

1. Collapse and pin a dashboard panel, reload, and confirm both choices persist.
2. Filter and sort heroes and contracts, reload, and confirm the selected views persist.
3. Open Alerts, mark the activity read, and open the Guild Log from the activity center.
4. Switch between Comfortable and Compact display density.
5. Expand a locked contract’s unlock path and confirm each requirement is visibly marked.
6. Verify the recommended hero action appears first on an available contract.

## v2.0.0-rc.2 Navigation Validation

Run the dedicated quick-navigation audit:

```bash
npm run smoke:navigation
```

The audit verifies all 18 permanent quick links, five dropdown groups, stable destination IDs, desktop and mobile open states, keyboard dismissal, inaccessible-when-closed behavior, current-location feedback, and startup wiring.

Manual browser checks:

1. At 1280px or wider, confirm the command index remains visible beside the dashboard.
2. Press each of the five group titles and confirm its submenu opens and closes.
3. Select shortcuts from every group and confirm the matching dashboard panel lands near the top of the viewport.
4. At phone width, confirm Quick Menu opens the drawer and the page behind it is dimmed.
5. Confirm the drawer closes with the × button, backdrop, Escape key, and any destination link.
6. Confirm keyboard focus remains inside the open mobile drawer and returns to the Quick Menu button when dismissed.

## v1.0.0 Validation

### Roadmap Systems Smoke Testing

Run from the repository root:

```bash
npm run smoke:all
```

The v1.0 suite covers room upgrades, class skills and traits, expanded contract tiers, legendary loot, region exploration, research, staff hiring, crafting, daily progression, records, and v1.0 save repair. The v0.2 suite remains in place to protect the original reload timing, duplicate assignment, deterministic resolution, unlock copy, and mobile accessibility contracts.

The v1.2 suite additionally covers multi-round combat transcripts, temporary status effects, hero bonds, achievements, and their save-repair guarantees.

The v1.3 suite covers bespoke boss phases, story decisions, rival heat and rumor pressure, world threat, and save repair for authored endgame progress.

### System Hotfix Regression Testing

Run `npm run smoke:hotfix` after changing recruitment, dynamic events, browser persistence, state repair, equipment validation, active assignments, or enemy weaknesses.

The hotfix suite verifies that wandering-hero recruitment charges one 80g cost and resolves atomically, failed storage writes preserve timestamps, failed resets preserve live state, Cleric remains available as the undead counter, and malformed duplicate hero IDs are detected by state invariants.

### Structured Code-Quality Regression Testing

Run `npm run smoke:quality` after changing system boundaries, authored catalogs, morale calculations, event costs, combat status effects, state repair, compatibility exports, or activity-log behavior.

The quality suite verifies zero-morale arithmetic and display, combat cleanup after defeat, transactional paid events, faction validation, deterministic ID collision handling, persistence timestamp ownership, stale-catalog repair, repaired room capacity, campaign repair, catalog cross-references, inventory normalization, and capped-log ID uniqueness.

The roadmap audit verifies all 22 phase entries, core content catalogs, representative gameplay actions, UI release markers, package scripts, and save repair together.

### v1.0 Manual Feature Pass

1. Confirm the command panel shows day, identity, mode, materials, research, influence, and prestige.
2. Recruit a hero and confirm class skills, trait, morale, equipment slots, and personal goal appear.
3. Upgrade a guildhall room and confirm its level and cost update.
4. Complete an Uncommon or Elite contract and confirm materials, loot, faction standing, and hero growth.
5. Unlock and explore a new region.
6. Advance a day and confirm research income, morale recovery, injury recovery, and possible events.
7. Complete research and hire staff.
8. Buy and craft equipment, then equip a class-compatible item.
9. Make a guild event choice and confirm its reward appears in the Guild Log.
10. Switch between game modes and confirm the selected mode is persisted.
11. Confirm Guild Records survive a reload.

## v0.2.0 Validation

### Automated Smoke Testing

Run from the repository root:

```bash
npm run smoke
npm run report:progression
```

The smoke suite verifies the recruit-to-contract loop, deterministic success and failure, absolute reload timing, duplicate-assignment and duplicate-reward prevention, versioned save repair, 50-entry log retention, accessibility/mobile contracts, guild upgrades and unlocks, recruit power bonuses, ranked assignments, next-action guidance, progression milestones, and prototype victory. The progression command performs read-only source-data analysis.

For a syntax-only audit of a JavaScript file, run:

```bash
node --check src/main.js
```

### Manual Browser Verification

Open the game through a local static server.

Recommended local command:

```bash
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
```

## Current Playable Contract Content

- Three Common contracts and one Uncommon contract are wired in `src/contracts.js`.
- Common contracts unlock by guild level. Ogre Toll Road requires guild level 4 and 6 reputation.
- Elite and Legendary contracts are planned only.

## Required Manual Checks

1. Page loads without a blank screen.
2. Guild panel shows level, gold, reputation, and hero capacity.
3. Recruit Hero button spends 50 gold and adds a hero.
4. Hero card shows name, class, level, power, and status.
5. Contract Board shows available contracts.
6. Ogre Toll Road shows both its guild-level and reputation requirements while locked.
7. Assigning an idle hero starts a contract.
8. Hero status changes to On Contract.
9. Active contract countdown appears.
10. Contract resolves after its timer.
11. Success grants gold, reputation, and a hero level.
12. Failure grants partial gold.
13. Guild log records contract outcomes.
14. Save persists after reload.
15. Upgrade Guild button becomes available when enough gold exists.
16. Upgrade Guild spends gold, increases guild level, and increases hero capacity.
17. Reset clears progress and starts a fresh guild.
18. The Guild panel recommends a relevant next action.
19. Multiple idle heroes are ordered by contract success chance, with the best fit first.
20. A successful assignment at or below required power grants one bonus power.
21. Reputation, hero-level, first-failure, and Ogre-clear milestones appear in the Guild Log when applicable.

## Known v0.2.0 Limits

- No production build pipeline yet.
- No dedicated offline-progress summary or recovery UI yet.
- No records screen yet.
- Elite and Legendary contract content is not wired into the playable module.
- No additional reputation-gated contracts are wired beyond Ogre Toll Road.
