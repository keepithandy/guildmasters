# Guildmasters

Guildmasters is a browser-based fantasy guild-management strategy game focused on recruiting heroes, assigning contracts, collecting outcomes, and growing a living organization through a readable long-term loop.

## Core loop

1. Recruit a hero.
2. Assign an idle hero to an unlocked contract.
3. Let the absolute completion timestamp continue across reloads.
4. Resolve success or failure once.
5. Collect gold, reputation, and hero growth.
6. Upgrade the guild and review the durable Guild Log.

## v2.0.0-rc.4 Release Candidate

The release candidate wires all 22 planned phases into one playable dashboard:

- Guild and hero progression with classes, skills, traits, morale, injuries, relationships, personal goals, and training.
- Common, Uncommon, Elite, and Legendary contracts with regions, faction standing, materials, equipment rewards, bosses, and risk tiers.
- Guildhall rooms, staff, research, crafting, inventory, records, guild identities, game modes, dynamic events, world regions, and faction pledges.
- Save repair keeps the original v0.2 reliability guarantees while preserving the new systems.
- A persistent desktop command index and mobile Quick Menu provide press-to-expand shortcuts to all permanent dashboard sections.
- A QoL layer adds remembered panel collapse/pinning, hero and contract filters, recommended assignment actions, unlock disclosures, compact density, and a persistent activity bar.
- The rc.4 hotfix adds transactional event recruitment, safe browser-storage recovery, focused system/state modules, invariant validation, catalog-backed combat counters, and dedicated regression coverage.

This is a functional release candidate, not a claim that every future art, audio, balance, or authored-content decision is final. The dedicated roadmap audit verifies that all 22 phases are represented, callable, save-safe, and connected to the playable loop.

The current build remains intentionally lightweight: expedition resolution is deterministic from the party and contract data, leaving room for a future tactical combat presentation without replacing the progression spine.

## Reliability baseline

- Versioned save schema with current, legacy, future, missing, and malformed classification.
- Safe repair that preserves valid heroes, contracts, currency, upgrades, and history.
- Unsupported future saves are rejected without partially loading them.
- Active contracts preserve `completesAt`, remain active before the deadline, and resolve once after it.
- One hero cannot be assigned to more than one active contract.
- Contract resolution accepts controlled random input for deterministic smoke fixtures without changing the live formulas or rewards.
- Guild Log history is newest-first, repaired safely, and bounded to 50 entries.
- Assignment, completion, failure, unlock, and blocked states use a concise polite live region while the Guild Log remains the durable record.
- Empty roster, no-idle-hero, locked contract, insufficient-gold, and upgrade-blocked states explain the reason and next existing action.
- Narrow layouts avoid horizontal overflow, keep active contracts prominent, wrap text safely, and use 44px touch targets.

## Implemented and Playable

Guildmasters now includes:

- Recruitable heroes.
- Contract assignment for idle heroes.
- Visible success chance.
- Success and failure rewards.
- Hero growth after successful contracts.
- Guild upgrades.
- Guild-level contract locks and unlock copy.
- Recruit power bonus from guild level.
- A readable Guild Log.
- Browser save/load.
- Three Common contracts unlocked by guild level, plus one Uncommon contract gated by guild level and reputation.
- Next-action guidance in the existing Guild panel.
- Best-fit hero ordering on contract assignment buttons.
- Bonus hero growth for successful challenging assignments.
- Progress milestones and an Ogre Toll Road prototype-victory message in the Guild Log.
- Hero skills, traits, morale, injuries, personal goals, equipment slots, training, and class-fit gear.
- Nine upgradeable guildhall rooms, six staff roles, six research projects, crafting materials, an Armory, and a Workshop.
- Ten contracts across Common, Uncommon, Elite, and Legendary tiers, plus five regions, six factions, dynamic events, records, and four game modes.

## Current scope

- The full roadmap foundation is playable in the browser.
- Campaign chapters, rival guild challenges, tactical drills, and offline return summaries now turn the remaining roadmap hooks into playable actions.
- Tactical encounters now resolve over multiple rounds with class abilities, temporary combat effects, saved transcripts, hero bonds, and achievement milestones.
- Boss expeditions now use bespoke phases and mechanics; campaign choices alter faction routes, and rival guilds can build heat and launch rumor pressure.
- Five titled quick-navigation groups provide direct access to Guild Command, Expeditions, People & Hall, The Realm, and Progress.
- Active contracts preserve absolute completion timestamps across reloads.
- Dedicated tactical combat scenes, bespoke art, audio, and a larger authored story campaign remain natural follow-up polish layers on top of the completed data and progression foundation.

## Run locally

Serve the repository through a local static server, then open it in a browser:

```bash
python -m http.server 5173
```

Open `http://127.0.0.1:5173`.

## Validation

```powershell
npm ci
npm run smoke
npm run smoke:v10
npm run smoke:v11
npm run smoke:v12
npm run smoke:v13
npm run smoke:roadmap
npm run smoke:navigation
npm run smoke:qol
npm run smoke:hotfix
npm run smoke:quality
npm run smoke:all
npm run report:progression
```

GitHub Actions runs the same smoke and report commands on pull requests and `main`. The smoke covers save repair, reload timing, dirty-state persistence, visibility/pagehide save flushing, double assignment, deterministic success/failure boundaries, transactional event costs, storage failures, catalog and state invariants, morale boundaries, temporary combat cleanup, class counters, activity-log integrity, partial failure rewards, live-region copy, mobile layout contracts, quick-navigation targets, and QoL preference wiring.

The progression report prints the current recruit cost and contract table, and flags unreachable, non-positive, or obvious reward/cost discontinuities. It is read-only analysis and does not claim automatic balance correctness.

## Save and keyboard QoL

The command bar shows saving, saved, or save-failed status; a failed write exposes a retry action. Export creates a portable JSON save. Import repairs and validates the selected file, shows a summary, and only replaces the guild after browser storage accepts it. `Alt+S` saves, `Alt+R` recruits, `Alt+C` jumps to contracts, and `?` opens the shortcut help; shortcuts are disabled while typing.

## Manual viewport and accessibility checklist

- Check 320px, 375px, and 430px widths without horizontal scrolling.
- Confirm active-contract state and primary actions remain visible.
- Navigate all buttons by keyboard and verify visible focus.
- Open and close every quick-menu group, then verify each shortcut lands on its titled section.
- Confirm the mobile drawer closes by its close button, backdrop, Escape key, and section selection.
- Confirm the latest concise status is announced once.
- Confirm durable history remains available in the Guild Log.
- Verify long hero, contract, and log text wraps safely.

## Guardrails

This presentation pass does not change contract durations, success formulas, reward amounts, recruit cost, upgrade prices, unlock levels, hero capacity rules, or progression balance. The current target remains final release-candidate QA and polish before v2.0.0.
