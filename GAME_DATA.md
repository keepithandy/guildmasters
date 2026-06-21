# Guildmasters Initial Data Model

## Guild State

{
  guildLevel: 1,
  gold: 0,
  reputation: 0,
  heroCapacity: 3
}

## Hero State

{
  id,
  name,
  class,
  level,
  power,
  status
}

Status values:
- idle
- on_contract

## Contract State

{
  id,
  name,
  tier,
  durationSeconds,
  requiredPower,
  successChance,
  rewardGold,
  rewardReputation
}

Tiers:
- common
- elite
- legendary

## First Launch Goal

Player recruits a hero.
Player sends hero on a contract.
Contract resolves.
Rewards are granted.
Progress is saved.
