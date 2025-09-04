# 🚀 Getting Started with Dice Roller

Welcome to the Dice Roller TypeScript library! This guide will help you get up and running quickly with both the programmatic API and command-line interface.

## 📦 Installation

### Node.js/NPM

```bash
npm install @risadams/dice-roller
```

### Yarn

```bash
yarn add @risadams/dice-roller
```

### From Source

```bash
git clone https://github.com/risadams/dice-roller.git
cd dice-roller
npm install
npm run build
```

## 🎲 Quick Start - Programmatic API

### Basic Dice Rolling

```typescript
import { Roller } from '@risadams/dice-roller';

const roller = new Roller();

// Simple dice rolls
const d20 = roller.roll(1, 20);           // Roll 1d20
const damage = roller.roll(2, 6);         // Roll 2d6
const stats = roller.roll(4, 6);          // Roll 4d6

console.log(`Initiative: ${d20.total}`);
console.log(`Damage: ${damage.total} (${damage.dice.join(', ')})`);
console.log(`Stat Array: [${stats.dice.join(', ')}]`);
```

### Dice Expressions

```typescript
// Parse and evaluate complex expressions
const attack = roller.rollExpression('1d20+5');
const fireball = roller.rollExpression('8d6');
const advantage = roller.rollExpression('2d20kh1');  // Keep highest

console.log(`Attack Roll: ${attack.total}`);
console.log(`Fireball Damage: ${fireball.total}`);
console.log(`Advantage Roll: ${advantage.total}`);
```

### Advanced Mechanics

```typescript
// Exploding dice (Savage Worlds style)
const exploding = roller.rollExploding(3, 6);

// Penetrating dice (explode with -1 penalty)
const penetrating = roller.rollPenetrating(2, 10);

// Success pools (World of Darkness style)
const successes = roller.rollSuccessPool(8, 10, 6); // 8d10, success on 6+

console.log(`Exploding: ${exploding.total}`);
console.log(`Penetrating: ${penetrating.total}`);
console.log(`Successes: ${successes.successes} (Botches: ${successes.botches})`);
```

## 🖥️ Quick Start - Command Line Interface

### Installation for CLI

If you installed globally:

```bash
npm install -g @risadams/dice-roller
dice-roller --help
```

Or run directly with npx:

```bash
npx @risadams/dice-roller --help
```

### Basic CLI Usage

```bash
# Simple rolls
dice-roller roll 1 20                    # Roll 1d20
dice-roller roll 4 6                     # Roll 4d6
dice-roller roll 2 8 --verbose           # Roll 2d8 with detailed output

# Dice expressions
dice-roller expression "1d20+5"          # Attack roll
dice-roller expression "2d6+3"           # Damage with modifier
dice-roller expression "(2d6+2)*2"       # Complex math

# Advanced mechanics
dice-roller exploding 3 6                # Exploding dice
dice-roller success 8 10 --threshold 6   # Success pool
dice-roller penetrating 2 10             # Penetrating dice
```

### CLI Examples

```bash
# Character creation - roll stats
dice-roller roll 4 6 --count 6 --verbose

# Combat - attack and damage
dice-roller expression "1d20+8" --label "Attack"
dice-roller expression "1d8+4" --label "Damage"

# World of Darkness style success pool
dice-roller success 7 10 --threshold 6 --botch-threshold 1

# Savage Worlds - exploding dice with ace
dice-roller exploding 1 6 --label "Fighting"
dice-roller penetrating 1 8 --label "Damage"
```

## 📖 Core Concepts

### Dice Results

All dice operations return result objects with detailed information:

```typescript
interface DiceResult {
  dice: number[];        // Individual die results
  total: number;         // Sum of all dice
  count: number;         // Number of dice rolled
  sides: number;         // Number of sides per die
  modifier?: number;     // Applied modifier
  // ... additional properties for advanced mechanics
}
```

### Success Pool Results

Success-based rolling returns specialized results:

```typescript
interface SuccessPoolResult {
  dice: number[];           // Individual die results
  successes: number;        // Count of successful dice
  failures: number;         // Count of failed dice
  botches: number;          // Count of botched dice (if applicable)
  threshold: number;        // Success threshold used
  // ... additional properties
}
```

### Custom Random Functions

You can provide custom random number generators:

```typescript
// Use a seeded RNG for reproducible results
const seededRNG = () => Math.random(); // Replace with your seeded function
const roller = new Roller(seededRNG);

// Or set it later
roller.setRandomFunction(seededRNG);
```

## 🎮 Common Gaming Scenarios

### D&D 5e Examples

```typescript
// Ability score generation
const stats = [];
for (let i = 0; i < 6; i++) {
  const rolls = roller.rollDropLowest(4, 6, 1); // Roll 4d6, drop lowest
  stats.push(rolls.total);
}

// Attack with advantage
const advantage = roller.rollExpression('2d20kh1+5'); // Keep highest

// Damage with critical hit
const normalDamage = roller.rollExpression('1d8+3');
const critDamage = roller.rollExpression('2d8+3');   // Double dice on crit
```

### World of Darkness Examples

```typescript
// Skill check with 8 dice, difficulty 6
const skill = roller.rollSuccessPool(8, 10, 6);

// Botch check (failures on difficulty 6+, botches on 1s)
const risky = roller.rollSuccessPool(3, 10, 6, {
  botchThreshold: 1,
  explodeOn: 10  // 10s explode for additional dice
});
```

### Savage Worlds Examples

```typescript
// Wild die with exploding
const wildDie = roller.rollExploding(1, 6);
const traitDie = roller.rollExploding(1, 8);
const result = Math.max(wildDie.total, traitDie.total);

// Step dice progression
const stepped = roller.rollStepDice('d6', 2); // Step up from d6 twice
```

## 🔧 Configuration Options

### Global Configuration

```typescript
const roller = new Roller();

// Set default maximum explosions for safety
roller.setDefaultMaxExplosions(100);

// Configure CLI-style verbose output
roller.setVerboseMode(true);
```

### Per-Roll Configuration

```typescript
// Custom explosion limits
const exploding = roller.rollExploding(3, 6, { maxExplosions: 50 });

// Custom success thresholds
const successes = roller.rollSuccessPool(5, 10, 7, {
  botchThreshold: 1,
  explodeOn: 10,
  maxExplosions: 10
});
```

## 🚨 Common Gotchas

### Performance Considerations

```typescript
// ❌ Avoid unlimited explosions in production
const dangerous = roller.rollExploding(10, 2); // Can explode forever!

// ✅ Always set reasonable limits
const safe = roller.rollExploding(10, 2, { maxExplosions: 100 });
```

### Expression Parsing

```typescript
// ❌ Invalid expressions will throw
try {
  const invalid = roller.rollExpression('1d20+');
} catch (error) {
  console.error('Invalid expression:', error.message);
}

// ✅ Validate expressions if user input
if (roller.validateExpression('1d20+5')) {
  const result = roller.rollExpression('1d20+5');
}
```

## 📚 Next Steps

Now that you're up and running, explore these topics:

- **[Advanced Mechanics](advanced-mechanics.md)** - Exploding, penetrating, and compounding dice
- **[Success Pools](success-pools.md)** - Modern RPG dice pool systems  
- **[Expressions](expressions.md)** - Complex dice expression syntax
- **[CLI Usage](cli-usage.md)** - Complete command-line reference
- **[API Reference](../api/)** - Detailed method documentation

## 💡 Need Help?

- 📖 **Documentation**: Browse the [full documentation](../README.md)
- 🐛 **Issues**: Report bugs on [GitHub Issues](https://github.com/risadams/dice-roller/issues)
- 💬 **Discussions**: Ask questions in [GitHub Discussions](https://github.com/risadams/dice-roller/discussions)
- 📧 **Email**: Contact the maintainers directly

---

*Happy rolling! 🎲*
