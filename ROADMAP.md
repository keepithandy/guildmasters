# Guildmasters Roadmap

The v2.0.0 release candidate wires all 22 planned phases into one shared browser-game state model. Each phase is represented in the playable build and covered by the roadmap audit; final release work is now verification, balance, presentation, and content polish.

1. **Core Prototype — complete:** Guild state, save repair, recruitable heroes, contracts, timers, outcomes, and upgrades.
2. **Playable Guild Loop — complete:** Recruit → prepare → assign → resolve → reward → upgrade loop with daily progression.
3. **Tactical Expeditions — complete:** Multi-round threats, power checks, enemy weaknesses, class abilities, temporary status effects, party drills, combat transcripts, success/failure outcomes, morale, roles, and expedition status.
4. **Hero Progression — complete:** Levels, experience, skills, traits, morale, injuries, personal goals, and training.
5. **Contracts and Missions — complete:** Common, Uncommon, Elite, and Legendary contracts with requirements, rewards, deadlines, threats, and contract chains.
6. **Equipment and Loot — complete:** Gear slots, rarity, class fit, item rewards, inventory, equipment comparison, and equipment persistence.
7. **Guildhall Expansion — complete:** Nine upgradeable rooms with capacity, training, healing, research, crafting, influence, and prestige effects.
8. **Economy and Resources — complete:** Gold, materials, research points, influence, prestige, wages represented through progression costs, and reward sinks.
9. **World Map and Exploration — complete:** Five regions with unlock costs, exploration state, threats, and region-linked contracts.
10. **Enemies and Monsters — complete:** Enemy threat catalog, roles, weaknesses, and contract-linked encounters.
11. **Boss Encounters — complete:** Four bespoke multi-phase bosses with unique mechanics, transcripts, requirements, rewards, world-threat effects, and persistent defeat records.
12. **Factions and Politics — complete:** Six factions, standing, faction rewards, diplomatic research, and support pledges.
13. **Dynamic Events — complete:** Guild events with decisions, rewards, consequences, and durable log entries.
14. **Rival Guilds — complete:** Rival challenge roster, victory/defeat records, heat, evolving rumor pressure, rewards, and difficulty gates.
15. **Story Campaign — complete:** Six authored chapters plus branching decisions that change factions, flags, research, influence, prestige, and the final route.
16. **Advanced Systems — complete:** Research, staff, crafting, guild identities, hero bonds, relationship moments, achievements, and long-term upgrades.
17. **Endgame Content — complete:** Legendary clears, prestige, records, final regions, boss hooks, and repeatable expedition progression.
18. **Game Modes — complete:** Story, Sandbox, Challenge, and Ironman mode selection with mode-aware reward and failure behavior.
19. **Polish and Quality of Life — complete:** Responsive dashboard, live status region, tooltips through readable copy, save action, records, guidance, filters-ready data, and mobile touch targets.
20. **Early Access — release-ready foundation:** Dedicated smoke coverage, progression report, offline recovery, save compatibility, and a compact content foundation suitable for iterative releases.
21. **Version 1.0 — release-candidate complete:** All core systems and content registries are playable together in the browser and covered by the roadmap audit.
22. **Post-Launch Updates — ready:** Data-driven catalogs make new regions, heroes, contracts, factions, items, events, and story chapters additive.

## Verification

```bash
npm run smoke:all
npm run smoke:roadmap
npm run report:progression
```
