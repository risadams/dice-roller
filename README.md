# Dice Roller - Elegant TypeScript Dice Rolling Library

A sophisticated TypeScript dice rolling library for tabletop RPGs, games, and any application requiring elegant dice mechanics.

## Features

- **Simple dice rolling** (d4, d6, d8, d10, d12, d20, d100)
- **Complex dice expressions** (e.g., "3d6+5", "2d8-1d4+3")
- **Custom dice** with user-defined values for each side (numeric and non-numeric)
- **Non-numeric dice** support for text, symbols, and mixed content
- **Fibonacci dice** for Scrum planning and estimation
- **Weighted dice** for non-uniform probability distributions
- **Text-based dice** (Yes/No, Magic 8-Ball, etc.)
- **Advanced rolling mechanics**:
  - Advantage/Disadvantage
  - Keep highest/lowest N dice
  - Exploding dice
  - Custom random functions
- **Statistical analysis** of dice expressions and custom dice
- **Comprehensive test suite** with 100% coverage
- **TypeScript support** with full type definitions

## Try It Now with npx

No installation required! Try the dice roller immediately:

```bash
# Quick dice rolls
npx @risadams/dice-roller "3d6+5"
npx @risadams/dice-roller roll d20
npx @risadams/dice-roller "2d8+1d4-2"

# Advanced mechanics
npx @risadams/dice-roller advantage d20
npx @risadams/dice-roller disadvantage d20
npx @risadams/dice-roller exploding 3d6

# Interactive demo
npx @risadams/dice-roller demo

# Statistical analysis
npx @risadams/dice-roller stats "3d6"

# Get help
npx @risadams/dice-roller help
```

## Installation

```bash
npm install @risadams/dice-roller
```

## Quick Start

```typescript
import { Roller, CustomDie, DicePresets } from '@risadams/dice-roller';

const roller = new Roller();

// Basic rolling
const d20Roll = roller.rollDie(20);
const damage = roller.rollSum(3, 6); // 3d6 damage

// Expression rolling
const attack = roller.rollExpression('1d20+5');
const fireball = roller.rollExpression('8d6');

// Custom dice
const customDie = new CustomDie([2, 4, 6, 8, 10]);
const customRolls = roller.rollCustomDice(customDie, 3);

// Fibonacci die for Scrum planning
const fibDie = DicePresets.createFibonacciDie(8);
const storyPoints = fibDie.roll(); // Returns: 0, 1, 1, 2, 3, 5, 8, or 13

// Scrum planning with actual "?" character
const scrumDie = DicePresets.createScrumPlanningDie();
const estimate = scrumDie.roll(); // Returns: 0, 1, 2, 3, 5, 8, 13, 21, or "?"

// Text-based dice
const coinDie = DicePresets.createCoinDie();
const coinFlip = coinDie.roll(); // Returns: "Heads" or "Tails"

const magic8Ball = DicePresets.createMagic8BallDie();
const answer = magic8Ball.roll(); // Returns various text responses

// Weighted dice
const lootDie = DicePresets.createWeightedDie([
  { value: 'Common', weight: 5 },
  { value: 'Rare', weight: 1 }
]); // 83.3% chance of "Common", 16.7% chance of "Rare"

// Advanced mechanics
const advantageRoll = roller.rollWithAdvantage(20);
const abilityScores = roller.rollKeepHighest(4, 6, 3); // 4d6 drop lowest
```

## API Reference

### Roller Class

#### Basic Rolling

- `rollDie(sides: number): number` - Roll a single die
- `rollDice(count: number, sides: number): number[]` - Roll multiple dice
- `rollSum(count: number, sides: number): number` - Roll and sum multiple dice

#### Expression Rolling

- `rollExpression(expression: string): number` - Evaluate dice expression
- `rollExpressionDetailed(expression: string)` - Get detailed results

#### Advanced Rolling

- `rollWithAdvantage(sides: number)` - Roll twice, take higher
- `rollWithDisadvantage(sides: number)` - Roll twice, take lower
- `rollKeepHighest(count: number, sides: number, keep: number)` - Drop lowest dice
- `rollKeepLowest(count: number, sides: number, keep: number)` - Drop highest dice
- `rollExploding(count: number, sides: number, maxExplosions?: number)` - Reroll on max

#### Utilities

- `rollStandard()` - Roll standard RPG dice set
- `getStatistics(expression: string, samples: number)` - Generate statistics
- `rollCustomDice(customDie: CustomDie, count: number)` - Roll custom dice
- `rollCustomDiceSum(customDie: CustomDie, count: number)` - Sum custom dice rolls
- `getCustomDieStatistics(customDie: CustomDie, samples: number)` - Analyze custom dice
- `compareCustomDice(die1: CustomDie, die2: CustomDie, samples: number)` - Compare dice

### CustomDie Class

```typescript
import { CustomDie } from '@risadams/dice-roller';

// Create a custom die with specific values
const customDie = new CustomDie([1, 3, 5, 7, 9]);
console.log(customDie.roll()); // Returns one of: 1, 3, 5, 7, 9
console.log(customDie.getExpectedValue()); // 5
console.log(customDie.getProbability(5)); // 0.2 (20%)
```

### DicePresets Class

```typescript
import { DicePresets } from '@risadams/dice-roller';

// Fibonacci sequence die (perfect for Scrum planning)
const fibDie = DicePresets.createFibonacciDie(8);
// Values: [0, 1, 1, 2, 3, 5, 8, 13]

// Standard Scrum planning poker die
const scrumDie = DicePresets.createScrumPlanningDie();
// Values: [0, 1, 2, 3, 5, 8, 13, 21, -1] (where -1 represents "?")

// Arithmetic progression die
const arithDie = DicePresets.createArithmeticDie(5, 3, 4);
// Values: [5, 8, 11, 14]

// Weighted die (some values more likely than others)
const weightedDie = DicePresets.createWeightedDie([
  { value: 1, weight: 1 },
  { value: 2, weight: 2 },
  { value: 3, weight: 3 }
]);
// 1 appears 16.7% of the time, 2 appears 33.3%, 3 appears 50%
```

### DiceExpression Class

```typescript
import { DiceExpression } from '@risadams/dice-roller';

const expr = new DiceExpression('3d6+5');
console.log(expr.evaluate()); // Roll the expression
console.log(expr.getMinValue()); // 8
console.log(expr.getMaxValue()); // 23
console.log(expr.toString()); // "3d6+5"
```

### Die Class

```typescript
import { Die } from '@risadams/dice-roller';

const d6 = new Die(6);
console.log(d6.roll()); // 1-6
console.log(d6.rollMultiple(3)); // [1-6, 1-6, 1-6]
```

## Supported Dice Expressions

The library supports mathematical expressions with dice notation:

- **Basic notation**: `d6`, `3d6`, `1d20`
- **Arithmetic**: `3d6+5`, `2d8-2`, `1d4*2`, `10d6/2`
- **Complex expressions**: `2d20+1d6+3`, `4d6+2d8-1d4`

## Examples

### Character Creation (D&D 5e)

```typescript
const roller = new Roller();

// Ability scores (4d6 drop lowest)
const strength = roller.rollKeepHighest(4, 6, 3);
console.log(`Strength: ${strength.result} (${strength.kept.join('+')}, dropped: ${strength.dropped})`);

// Attack roll with advantage
const attack = roller.rollWithAdvantage(20);
console.log(`Attack: ${attack.result} (rolled: ${attack.rolls})`);
```

### Damage Calculation

```typescript
const roller = new Roller();

// Weapon damage
const swordDamage = roller.rollExpression('1d8+3');
const criticalHit = roller.rollExpression('2d8+3'); // Double dice on crit

// Spell damage
const fireball = roller.rollExpression('8d6');
const healingPotion = roller.rollExpression('2d4+2');
```

### Custom Dice for Scrum Planning

```typescript
const roller = new Roller();

// Create a Fibonacci die for story point estimation
const fibDie = DicePresets.createFibonacciDie(8);
console.log(`Story points: ${fibDie.roll()}`); // 0, 1, 1, 2, 3, 5, 8, or 13

// Standard Scrum planning poker with actual "?" character
const scrumDie = DicePresets.createScrumPlanningDie();
const estimate = scrumDie.roll();
console.log(`Estimate: ${estimate}`); // Could be 0, 1, 2, 3, 5, 8, 13, 21, or "?"

// Analyze the distribution
const stats = roller.getCustomDieStatistics(fibDie, 1000);
if (stats.expectedValue !== null) {
  console.log(`Average story points: ${stats.expectedValue.toFixed(1)}`);
}
```

### Text-Based Dice

```typescript
const roller = new Roller();

// Simple Yes/No decision
const yesNoDie = DicePresets.createTextDie(['Yes', 'No', 'Maybe']);
console.log(`Decision: ${yesNoDie.roll()}`);

// Magic 8-Ball style responses
const magic8Ball = DicePresets.createMagic8BallDie();
console.log(`Magic 8-Ball says: "${magic8Ball.roll()}"`);

// Coin flip
const coinDie = DicePresets.createCoinDie();
console.log(`Coin flip: ${coinDie.roll()}`);

// Game loot with weighted text values
const lootDie = DicePresets.createWeightedDie([
  { value: 'Common', weight: 5 },
  { value: 'Uncommon', weight: 3 },
  { value: 'Rare', weight: 2 },
  { value: 'Legendary', weight: 1 }
]);
console.log(`Loot rarity: ${lootDie.roll()}`);
```

### Mixed Numeric and Non-Numeric Dice

```typescript
// Custom die with mixed values
const mixedDie = new CustomDie([1, 2, 'Skip', 4, 'Double']);
console.log(`Roll result: ${mixedDie.roll()}`);

// Scrum planning with actual "?" for unknown complexity
const scrumDie = DicePresets.createScrumPlanningDie();
const estimate = scrumDie.roll();
console.log(`Story points: ${estimate}`); // Could be number or "?"

// Statistics handle mixed types gracefully
const stats = roller.getCustomDieStatistics(scrumDie, 1000);
console.log(`Has numeric values: ${stats.hasNumericValues}`);
console.log(`Has non-numeric values: ${stats.hasNonNumericValues}`);
if (stats.expectedValue !== null) {
  console.log(`Expected value of numeric faces: ${stats.expectedValue}`);
}
```

### Statistics and Analysis

```typescript
const roller = new Roller();

// Analyze weapon damage over 1000 rolls
const stats = roller.getStatistics('1d8+3', 1000);
console.log(`Average damage: ${stats.mean.toFixed(1)}`);
console.log(`Range: ${stats.min}-${stats.max}`);
console.log(`Standard deviation: ${stats.standardDeviation.toFixed(2)}`);

// Analyze custom dice (works with both numeric and non-numeric)
const customDie = new CustomDie([2, 4, 6, 8, 10]);
const customStats = roller.getCustomDieStatistics(customDie, 1000);
if (customStats.expectedValue !== null && customStats.mean !== null) {
  console.log(`Expected value: ${customStats.expectedValue}`);
  console.log(`Theoretical vs actual mean: ${customStats.expectedValue} vs ${customStats.mean.toFixed(2)}`);
}

// Mixed dice statistics
const mixedDie = new CustomDie([1, 'A', 2, 'B']);
const mixedStats = roller.getCustomDieStatistics(mixedDie, 1000);
console.log(`Has numeric values: ${mixedStats.hasNumericValues}`);
console.log(`Has non-numeric values: ${mixedStats.hasNonNumericValues}`);
```

### Custom Random Function

```typescript
import { Roller } from 'roller';

// Use a seeded random function for reproducible results
const seededRandom = () => 0.5; // Always returns middle value
const roller = new Roller(seededRandom);

console.log(roller.rollDie(6)); // Always returns 4
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
npm run test:watch
npm run test:coverage
```

### Demo

```bash
npm run demo
```

## TypeScript Support

This library is written in TypeScript and includes full type definitions. All classes and methods are properly typed for excellent IDE support and compile-time error checking.

## License

MIT - see the [LICENSE](LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Changelog

### 1.1.0

- **NEW**: Custom dice with user-defined values for each side
- **NEW**: **Non-numeric dice support** - dice can now have text, symbols, or mixed content
- **NEW**: `CustomDie<T>` class with TypeScript generics for type-safe custom dice
- **NEW**: `DicePresets` with factory methods for common custom dice patterns:
  - Fibonacci sequence dice (perfect for Scrum planning)
  - **Scrum planning poker dice with actual "?" character**
  - **Text-based dice** (Yes/No, Magic 8-Ball, coin flip, etc.)
  - Arithmetic and geometric progression dice
  - **Weighted dice supporting both numeric and text values**
- **NEW**: Enhanced statistics methods that gracefully handle mixed numeric/non-numeric dice
- **NEW**: Dice comparison functionality supporting different value types
- **NEW**: Type detection methods (`hasNumericValues()`, `hasNonNumericValues()`)
- **ENHANCED**: `Roller` class now supports custom dice operations with full type safety
- **ENHANCED**: Fair rolling ensures all custom dice maintain proper probability distributions
- **ENHANCED**: Statistics analysis separates numeric and non-numeric data appropriately

### 1.0.0

- Initial release of TypeScript dice rolling library
- Complete API with Die, DiceExpression, DiceExpressionPart, and Roller classes
- Advanced rolling mechanics (advantage/disadvantage, exploding dice, keep highest/lowest)
- CLI interface with npx support
- Comprehensive test suite with Jest
- Statistical analysis capabilities
- Full TypeScript support with type definitions
