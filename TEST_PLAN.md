# Guildmasters Manual Test Plan

## v0.1.0-dev Smoke Test

Open `index.html` through a local static server.

Recommended local command:

```bash
python -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
```

## Required Checks

1. Page loads without a blank screen.
2. Guild panel shows level, gold, reputation, and hero capacity.
3. Recruit Hero button spends 50 gold and adds a hero.
4. Hero card shows name, class, level, power, and status.
5. Contract Board shows available contracts.
6. Assigning an idle hero starts a contract.
7. Hero status changes to On Contract.
8. Active contract countdown appears.
9. Contract resolves after its timer.
10. Success grants gold, reputation, and a hero level.
11. Failure grants partial gold.
12. Guild log records contract outcomes.
13. Save persists after reload.
14. Upgrade Guild button becomes available when enough gold exists.
15. Upgrade Guild spends gold, increases guild level, and increases hero capacity.
16. Reset clears progress and starts a fresh guild.

## Known v0.1.0-dev Limits

- No production build pipeline yet.
- No automated smoke test yet.
- No offline progress summary UI yet.
- Only Common contracts are wired in the playable module.
- Extra old test branches may still exist from connector setup attempts.
