# Guildmasters Design Contract

## Game Type

Guildmasters is a lightweight idle guild-management game.

The player runs a guild, recruits heroes, sends them on contracts, collects rewards, and upgrades the guild over time.

## Core Loop

Recruit -> Contract -> Reward -> Upgrade -> Better Contract -> Repeat

Every major feature must strengthen this loop.

## Player Goal

Build the strongest and most reputable guild possible through simple long-term progression.

## Starting Systems

### Guild

- Guild level
- Gold
- Reputation
- Hero capacity

### Heroes

- Name
- Class
- Level
- Power

Launch classes:

- Warrior
- Ranger
- Mage
- Guardian

### Contracts

Contract tiers:

- Common
- Elite
- Legendary

Each contract should show:

- Name
- Tier
- Duration
- Required power
- Success chance
- Success reward
- Failure reward

## Failure Model

Contracts should always have a chance to fail.

Failure rules:

- No permanent hero death in early versions.
- No gear loss because gear is out of scope.
- Failed contracts still grant partial rewards.
- Failed contracts do not grant full reputation.
- Failure should feel like a risk, not a punishment spiral.

Recommended success chance bounds:

- Minimum success chance: 10%
- Maximum success chance: 95%

## Early Scope Limits

Do not add these systems until the core idle loop is finished:

- Inventory
- Equipment
- Crafting
- Talent trees
- Status effects
- PvP
- Building placement
- Kingdom politics
- Multiple complex resources

## Design Rule

If a feature does not improve recruit -> contract -> reward -> upgrade, it should not be added yet.
