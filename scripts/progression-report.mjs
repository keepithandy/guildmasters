import { CONTRACTS, calculateSuccessChance } from '../src/contracts.js';
import { RECRUIT_COST } from '../src/heroes.js';

const rows = CONTRACTS.map(contract => ({
  contract: contract.name,
  unlockLevel: contract.minGuildLevel,
  durationSeconds: contract.durationSeconds,
  requiredPower: contract.requiredPower,
  successAtRequiredPower: calculateSuccessChance(contract.requiredPower, contract.requiredPower),
  rewardGold: contract.rewardGold,
  failureGold: contract.failureGold,
  rewardReputation: contract.rewardReputation,
  flags: [
    contract.minGuildLevel < 1 ? 'unreachable unlock' : null,
    contract.requiredPower <= 0 ? 'non-positive power' : null,
    contract.rewardGold <= 0 || contract.failureGold < 0 ? 'non-positive reward' : null,
    contract.failureGold > contract.rewardGold ? 'failure reward exceeds success reward' : null
  ].filter(Boolean)
}));

console.log('# Guildmasters Progression Report');
console.log('');
console.log(`Recruit cost: ${RECRUIT_COST} gold`);
console.log('');
console.log('| Contract | Unlock | Duration | Power | Chance at requirement | Success gold | Failure gold | Reputation | Flags |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |');
for (const row of rows) {
  console.log(`| ${row.contract} | ${row.unlockLevel} | ${row.durationSeconds}s | ${row.requiredPower} | ${row.successAtRequiredPower}% | ${row.rewardGold} | ${row.failureGold} | ${row.rewardReputation} | ${row.flags.join(', ') || 'None'} |`);
}
console.log('');
console.log('Interpretation: this report flags obvious data-shape and continuity concerns; it does not determine whether the game is balanced.');
