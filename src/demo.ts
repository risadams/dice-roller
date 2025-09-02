import { Roller, DiceExpression, Die, CustomDie, DicePresets } from './index';

// Demo usage of the Dice Roller TypeScript dice rolling library
console.log('=== Dice Roller - Elegant TypeScript Dice Rolling Library Demo ===\n');

const roller = new Roller();

// Basic die rolling
console.log('1. Basic Die Rolling:');
console.log(`Rolling a d20: ${roller.rollDie(20)}`);
console.log(`Rolling 3d6: ${roller.rollDice(3, 6)}`);
console.log(`Sum of 3d6: ${roller.rollSum(3, 6)}\n`);

// Expression rolling
console.log('2. Dice Expression Rolling:');
console.log(`Rolling "3d6+5": ${roller.rollExpression('3d6+5')}`);
console.log(`Rolling "2d8+1d4-2": ${roller.rollExpression('2d8+1d4-2')}`);

// Detailed expression results
const detailed = roller.rollExpressionDetailed('2d10+3');
console.log(`Detailed result for "2d10+3":`, detailed);
console.log();

// Standard RPG dice
console.log('3. Standard RPG Dice Set:');
const standardRolls = roller.rollStandard();
console.log(standardRolls);
console.log();

// Advantage/Disadvantage
console.log('4. Advantage/Disadvantage:');
const advantage = roller.rollWithAdvantage(20);
console.log(`d20 with Advantage: ${advantage.result} (rolled: ${advantage.rolls})`);

const disadvantage = roller.rollWithDisadvantage(20);
console.log(`d20 with Disadvantage: ${disadvantage.result} (rolled: ${disadvantage.rolls})`);
console.log();

// Keep highest/lowest
console.log('5. Keep Highest/Lowest:');
const keepHigh = roller.rollKeepHighest(4, 6, 3);
console.log(`Roll 4d6, keep highest 3: ${keepHigh.result} (kept: ${keepHigh.kept}, dropped: ${keepHigh.dropped})`);

const keepLow = roller.rollKeepLowest(4, 6, 2);
console.log(`Roll 4d6, keep lowest 2: ${keepLow.result} (kept: ${keepLow.kept}, dropped: ${keepLow.dropped})`);
console.log();

// Exploding dice
console.log('6. Exploding Dice:');
const exploding = roller.rollExploding(2, 6);
console.log(`Exploding 2d6: ${exploding.result} (all rolls: ${exploding.rolls}, explosions: ${exploding.explosions})`);
console.log();

// Statistics
console.log('7. Statistics for "3d6" (1000 samples):');
const stats = roller.getStatistics('3d6', 1000);
console.log(`Mean: ${stats.mean.toFixed(2)}`);
console.log(`Min: ${stats.min}, Max: ${stats.max}`);
console.log(`Standard Deviation: ${stats.standardDeviation.toFixed(2)}`);
console.log();

// Direct dice expression usage
console.log('8. Direct DiceExpression Usage:');
const expr = new DiceExpression('4d6+2');
console.log(`Expression: ${expr.toString()}`);
console.log(`Min Value: ${expr.getMinValue()}`);
console.log(`Max Value: ${expr.getMaxValue()}`);
console.log(`Evaluation: ${expr.evaluate()}`);
console.log();

// Custom dice demonstrations
console.log('9. Custom Dice:');

// Basic custom die
const customDie = new CustomDie([2, 4, 6, 8, 10]);
console.log(`Custom die with values [2,4,6,8,10]:`);
console.log(`- Rolling 5 times: ${roller.rollCustomDice(customDie, 5)}`);
console.log(`- Sum of 3 rolls: ${roller.rollCustomDiceSum(customDie, 3)}`);
console.log(`- Expected value: ${customDie.getExpectedValue()}`);
console.log(`- Min: ${customDie.minValue}, Max: ${customDie.maxValue}`);
console.log();

// Fibonacci die for Scrum planning
console.log('10. Fibonacci Die (Perfect for Scrum Planning):');
const fibDie = DicePresets.createFibonacciDie(8);
console.log(`Fibonacci die values: [${fibDie.values.join(', ')}]`);
console.log(`- Story point estimate rolls: ${roller.rollCustomDice(fibDie, 5)}`);
console.log(`- Probability of rolling 5: ${(fibDie.getProbability(5) * 100).toFixed(1)}%`);
console.log();

// Scrum planning die
console.log('11. Standard Scrum Planning Die (with actual "?" character):');
const scrumDie = DicePresets.createScrumPlanningDie();
console.log(`Scrum die values: [${scrumDie.values.join(', ')}]`);
const planningRolls = roller.rollCustomDice(scrumDie, 5);
console.log(`- Planning session rolls: [${planningRolls.join(', ')}]`);
console.log();

// Text-based dice
console.log('12. Text-Based Dice:');
const coinDie = DicePresets.createCoinDie();
console.log(`Coin flip: ${coinDie.roll()}`);

const magic8Ball = DicePresets.createMagic8BallDie();
console.log(`Magic 8-Ball says: "${magic8Ball.roll()}"`);

const yesNoDie = DicePresets.createTextDie(['Yes', 'No', 'Maybe']);
console.log(`Decision die: ${yesNoDie.roll()}`);
console.log();

// Weighted die
console.log('13. Weighted Custom Die:');
const weightedDie = DicePresets.createWeightedDie([
  { value: 1, weight: 1 },
  { value: 2, weight: 2 },
  { value: 3, weight: 3 }
]);
console.log(`Weighted die (1: 16.7%, 2: 33.3%, 3: 50%):`);
console.log(`- Rolling 10 times: ${roller.rollCustomDice(weightedDie, 10)}`);
console.log();

// Weighted text die
const lootDie = DicePresets.createWeightedDie([
  { value: 'Common', weight: 5 },
  { value: 'Uncommon', weight: 3 },
  { value: 'Rare', weight: 2 },
  { value: 'Legendary', weight: 1 }
]);
console.log(`Loot rarity die: ${lootDie.roll()}`);
console.log();

// Custom die statistics
console.log('14. Custom Die Statistics:');
const customStats = roller.getCustomDieStatistics(fibDie, 1000);
console.log(`Fibonacci die statistics (1000 samples):`);
if (customStats.hasNumericValues) {
  console.log(`- Mean: ${customStats.mean?.toFixed(2) ?? 'N/A'}`);
  console.log(`- Expected value: ${customStats.expectedValue?.toFixed(2) ?? 'N/A'}`);
  console.log(`- Standard deviation: ${customStats.standardDeviation?.toFixed(2) ?? 'N/A'}`);
}
console.log(`- Has numeric values: ${customStats.hasNumericValues}`);
console.log(`- Has non-numeric values: ${customStats.hasNonNumericValues}`);
console.log(`- Theoretical distribution:`, 
  Object.entries(customStats.theoreticalDistribution)
    .map(([val, prob]) => `${val}: ${(prob * 100).toFixed(1)}%`)
    .join(', ')
);
console.log();

// Dice comparison
console.log('15. Comparing Custom Dice:');
const simpleDie = new CustomDie([1, 2, 3, 4, 5, 6]);
const comparison = roller.compareCustomDice(simpleDie, fibDie, 1000);
console.log(`Standard d6 vs Fibonacci die (1000 rolls each):`);
console.log(`- Standard d6 wins: ${comparison.die1Wins}`);
console.log(`- Fibonacci die wins: ${comparison.die2Wins}`);
console.log(`- Ties: ${comparison.ties}`);
if (comparison.die1Average !== null && comparison.die2Average !== null) {
  console.log(`- Standard d6 average: ${comparison.die1Average.toFixed(2)}`);
  console.log(`- Fibonacci die average: ${comparison.die2Average.toFixed(2)}`);
}
console.log();

console.log('=== Demo Complete ===');
