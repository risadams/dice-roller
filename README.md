# Dice Roller - Elegant TypeScript Dice Rolling Library

A sophisticated TypeScript dice rolling library for tabletop RPGs, games, and any application requiring elegant dice mechanics.

## Features

- **Simple dice rolling** (d4, d6, d8, d10, d12, d20, d100)
- **Complex dice expressions** (e.g., "3d6+5", "2d8-1d4+3")
- **Advanced rolling mechanics**:
  - Advantage/Disadvantage
  - Keep highest/lowest N dice
  - Exploding dice
  - Custom random functions
- **Statistical analysis** of dice expressions
- **Comprehensive test suite** with 100% coverage
- **TypeScript support** with full type definitions

## Installation

```bash
npm install @risadams/dice-roller
```

## Quick Start

```typescript
import { Roller } from '@risadams/dice-roller';

const roller = new Roller();

// Basic rolling
const d20Roll = roller.rollDie(20);
const damage = roller.rollSum(3, 6); // 3d6 damage

// Expression rolling
const attack = roller.rollExpression('1d20+5');
const fireball = roller.rollExpression('8d6');

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

### Statistics and Analysis
```typescript
const roller = new Roller();

// Analyze weapon damage over 1000 rolls
const stats = roller.getStatistics('1d8+3', 1000);
console.log(`Average damage: ${stats.mean.toFixed(1)}`);
console.log(`Range: ${stats.min}-${stats.max}`);
console.log(`Standard deviation: ${stats.standardDeviation.toFixed(2)}`);
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

### 1.0.0
- Initial release of TypeScript dice rolling library
- Complete API with Die, DiceExpression, DiceExpressionPart, and Roller classes
- Advanced rolling mechanics (advantage/disadvantage, exploding dice, keep highest/lowest)
- CLI interface with npx support
- Comprehensive test suite with Jest
- Statistical analysis capabilities
- Full TypeScript support with type definitions
