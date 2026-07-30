# Guildmasters

Guildmasters is a lightweight idle guild-management game focused on recruiting heroes, sending them on contracts, collecting rewards, and upgrading the guild through simple readable progression.

Current status: **v0.1.5-dev — playable prototype, progressing toward v0.2.**

## Core Pitch

Build a guild. Recruit heroes. Send contracts. Collect rewards. Expand the guild.

## Core Loop

1. Recruit heroes.
2. Assign heroes to contracts.
3. Wait for contracts to resolve.
4. Collect gold, reputation, and hero experience.
5. Upgrade the guild.
6. Unlock better contracts and better recruits.

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

## Partially Implemented

- v0.2 progression: hero growth, guild upgrades, guild-level recruit bonuses, guild-level contract gates, and Ogre Toll Road's reputation gate are playable.
- Offline completion: active contracts are resolved when the game loads, but there is no dedicated offline-progress summary or recovery UI.

## Planned or Unfinished

- Further reputation-based contract progression.
- Elite and Legendary contract content.
- A records screen.
- Fuller offline-progress handling and UI.

## How To Run Locally

Serve the repository through a local static server, then open it in a browser:

```bash
python -m http.server 5173
```

Open `http://127.0.0.1:5173`.

## Smoke Check

Run this from the repo root:

```bash
npm run smoke
npm run check
```

Both commands run the same automated smoke suite. It covers the first playable loop, successful contract resolution, guild upgrades, unlock behavior, and log persistence through save repair. Browser behavior, failure outcomes, countdown timing, and save persistence still need manual verification.

## Design Pillars

- Simplicity is a feature.
- Every major action should be readable in one screen.
- Failure should create tension without destroying progress.
- Progression should be visible through gold, reputation, guild level, and contract history.
- Avoid feature creep until the core idle loop is complete.

## Initial Scope

The first playable version includes:

- Guild state
- Gold
- Reputation
- Basic hero recruitment
- Basic contract assignment
- Visible success chance
- Contract completion rewards
- Partial rewards on failure
- Guild upgrades

## Current Target

v0.2 progression: complete reputation-based contract progression while preserving the playable guild-level progression already in place.
