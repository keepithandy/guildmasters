# Guildmasters

Guildmasters is a lightweight idle guild-management browser game focused on recruiting heroes, assigning contracts, collecting outcomes, and upgrading the guild through a compact readable loop.

## Core loop

1. Recruit a hero.
2. Assign an idle hero to an unlocked contract.
3. Let the absolute completion timestamp continue across reloads.
4. Resolve success or failure once.
5. Collect gold, reputation, and hero growth.
6. Upgrade the guild and review the durable Guild Log.

## v0.2 reliability baseline

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

## Run locally

Open `index.html` directly in a browser.

## Validation

```powershell
npm ci
npm run smoke
npm run report:progression
```

GitHub Actions runs the same smoke and report commands on pull requests and `main`. The smoke covers save repair, reload timing, double assignment, deterministic success/failure boundaries, partial failure rewards, Guild Log retention, live-region copy, and mobile layout contracts.

The progression report prints the current recruit cost and contract table, and flags unreachable, non-positive, or obvious reward/cost discontinuities. It is read-only analysis and does not claim automatic balance correctness.

## Manual viewport and accessibility checklist

- Check 320px, 375px, and 430px widths without horizontal scrolling.
- Confirm active-contract state and primary actions remain visible.
- Navigate all buttons by keyboard and verify visible focus.
- Confirm the latest concise status is announced once.
- Confirm durable history remains available in the Guild Log.
- Verify long hero, contract, and log text wraps safely.

## Guardrails

This reliability pass does not change contract durations, success formulas, reward amounts, recruit cost, upgrade prices, unlock levels, hero capacity rules, or progression balance. The current target remains a small v0.2 progression spine rather than feature expansion.
