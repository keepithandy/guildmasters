# Guildmasters

Guildmasters is a lightweight idle guild-management game focused on recruiting heroes, sending them on contracts, collecting rewards, and upgrading the guild through simple readable progression.

## Core Pitch

Build a guild. Recruit heroes. Send contracts. Collect rewards. Expand the guild.

## Core Loop

1. Recruit heroes.
2. Assign heroes to contracts.
3. Wait for contracts to resolve.
4. Collect gold, reputation, and hero experience.
5. Upgrade the guild.
6. Unlock better contracts and better recruits.

## Current Playable Status

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

## How To Run Locally

Open `index.html` directly in a browser.

## Smoke Check

Run this from the repo root:

```bash
npm run smoke
```

The smoke check covers the first playable loop, contract resolution, guild upgrades, unlock behavior, and log persistence through save repair.

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

v0.2 Progression Spine and Guild Log polish.
