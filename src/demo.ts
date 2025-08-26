import { Roller, DiceExpression, Die } from './index';

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

console.log('=== Demo Complete ===');
