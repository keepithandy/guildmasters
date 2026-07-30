# Guildmasters Test Plan

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
