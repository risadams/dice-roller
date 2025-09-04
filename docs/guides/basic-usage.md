# 📖 Basic Usage Guide

This guide covers the fundamental operations of the Dice Roller library. For installation and setup, see the [Getting Started](getting-started.md) guide.

## 🎲 Core Dice Rolling

### Simple Rolls

The most basic operation is rolling a set of dice:

```typescript
import { Roller } from '@risadams/dice-roller';

const roller = new Roller();

// Basic syntax: roll(count, sides)
const d20 = roller.roll(1, 20);        // Single d20
const damage = roller.roll(2, 6);      // Two d6 dice
const stats = roller.roll(4, 6);       // Four d6 dice

// Access results
console.log(`d20 result: ${d20.total}`);
console.log(`Individual dice: [${d20.dice.join(', ')}]`);
console.log(`Average: ${d20.total / d20.count}`);
```

### Result Properties

Every dice roll returns a `DiceResult` object:

```typescript
interface DiceResult {
  dice: number[];       // Individual die results [4, 2, 6, 1]
  total: number;        // Sum of all dice: 13
  count: number;        // Number of dice rolled: 4
  sides: number;        // Sides per die: 6
  modifier?: number;    // Applied modifier (if any)
  explanation?: string; // Human-readable explanation
}

const result = roller.roll(3, 8);
console.log(`Rolled ${result.count}d${result.sides}`);
console.log(`Results: [${result.dice.join(', ')}]`);
console.log(`Total: ${result.total}`);
```

## 🧮 Dice with Modifiers

### Adding Modifiers

```typescript
// Roll with positive modifier
const attack = roller.rollWithModifier(1, 20, 5);  // 1d20+5
console.log(`Attack: ${attack.total} (${attack.dice[0]}+${attack.modifier})`);

// Roll with negative modifier  
const penalty = roller.rollWithModifier(2, 6, -2); // 2d6-2
console.log(`Damage: ${penalty.total}`);

// Modifier is stored in the result
console.log(`Base roll: ${penalty.total - penalty.modifier}`);
console.log(`Modifier: ${penalty.modifier}`);
```

## 📐 Dice Expressions

### Basic Expression Syntax

Dice expressions provide a powerful way to describe complex rolls:

```typescript
// Simple expressions
const simple = roller.rollExpression('1d20');      // Basic d20
const modified = roller.rollExpression('1d20+5');  // d20 with +5 bonus
const multiple = roller.rollExpression('2d6+3');   // 2d6 with +3 bonus

// Mathematical operations
const complex = roller.rollExpression('(1d4+1)*2'); // Multiply result by 2
const mixed = roller.rollExpression('1d8+1d4');     // Different die types

console.log(`Attack: ${modified.total}`);
console.log(`Damage: ${complex.total}`);
```

### Expression Components

| Component | Description | Example |
|-----------|-------------|---------|
| `XdY` | Roll X dice with Y sides | `3d6`, `1d20` |
| `+N` / `-N` | Add/subtract modifier | `1d20+5`, `2d6-1` |
| `*N` / `/N` | Multiply/divide result | `(1d4)*2`, `1d100/10` |
| `()` | Grouping for order of operations | `(2d6+3)*2` |

### Advanced Expression Features

```typescript
// Keep/drop mechanics
const advantage = roller.rollExpression('2d20kh1');   // Keep highest 1
const disadvantage = roller.rollExpression('2d20kl1'); // Keep lowest 1
const stats = roller.rollExpression('4d6dh1');        // Drop highest 1

// Conditional counting
const successes = roller.rollExpression('5d10>6');    // Count dice ≥ 7
const failures = roller.rollExpression('3d6<3');      // Count dice < 3

// Reroll mechanics
const reroll = roller.rollExpression('4d6r1');        // Reroll 1s (exploding)
const rerollOnce = roller.rollExpression('3d6ro<2');  // Reroll <2 once
const rerollMany = roller.rollExpression('2d8rr1');   // Reroll 1s repeatedly
```

## 🎯 Keep and Drop Mechanics

### Keep Highest/Lowest

```typescript
// Roll 4d6, keep highest 3 (standard D&D stat generation)
const statRoll = roller.rollKeepHighest(4, 6, 3);
console.log(`Stat: ${statRoll.total} (kept: [${statRoll.keptDice.join(', ')}])`);

// Roll with advantage (2d20, keep highest)
const advantage = roller.rollKeepHighest(2, 20, 1);
console.log(`Advantage: ${advantage.total}`);

// Roll with disadvantage (2d20, keep lowest)  
const disadvantage = roller.rollKeepLowest(2, 20, 1);
console.log(`Disadvantage: ${disadvantage.total}`);
```

### Drop Highest/Lowest

```typescript
// Alternative syntax - drop lowest instead of keep highest
const statRoll2 = roller.rollDropLowest(4, 6, 1);  // Same as keep highest 3

// Drop the highest die (unusual but possible)
const dropHigh = roller.rollDropHighest(5, 6, 2);  // Keep lowest 3 of 5d6
```

### Keep Middle Dice

```typescript
// Roll 5 dice, keep the middle 3 (removes outliers)
const middle = roller.rollKeepMiddle(5, 6, 3);
console.log(`Middle dice: ${middle.total}`);
console.log(`Kept: [${middle.keptDice.join(', ')}]`);
console.log(`Dropped: [${middle.droppedDice.join(', ')}]`);
```

## 🎨 Custom Random Functions

### Using Seeded Generators

```typescript
// Example with a simple seeded RNG (use a real library for production)
class SeededRandom {
  private seed: number;
  
  constructor(seed: number) {
    this.seed = seed;
  }
  
  random(): number {
    // Simple LCG (Linear Congruential Generator)
    this.seed = (this.seed * 1664525 + 1013904223) % 2**32;
    return this.seed / 2**32;
  }
}

const seeded = new SeededRandom(12345);
const roller = new Roller(() => seeded.random());

// Now all rolls are reproducible
const roll1 = roller.roll(1, 20);
const roll2 = roller.roll(1, 20);
console.log(`Seeded rolls: ${roll1.total}, ${roll2.total}`);
```

### Testing with Predictable Results

```typescript
// For testing - always return maximum result
const maxRoller = new Roller(() => 0.999);
const maxRoll = maxRoller.roll(3, 6);  // Will always roll [6, 6, 6]

// For testing - always return minimum result  
const minRoller = new Roller(() => 0.001);
const minRoll = minRoller.roll(3, 6);  // Will always roll [1, 1, 1]

// Specific sequence for testing
let sequence = [0.5, 0.8, 0.2];
let index = 0;
const sequenceRoller = new Roller(() => sequence[index++ % sequence.length]);
```

## 📊 Working with Results

### Analyzing Roll Results

```typescript
const rolls = roller.roll(10, 6);

// Basic statistics
const sum = rolls.total;
const average = rolls.total / rolls.count;
const min = Math.min(...rolls.dice);
const max = Math.max(...rolls.dice);

console.log(`Total: ${sum}, Average: ${average.toFixed(2)}`);
console.log(`Range: ${min}-${max}`);

// Count specific results
const sixes = rolls.dice.filter(die => die === 6).length;
const ones = rolls.dice.filter(die => die === 1).length;
console.log(`Sixes: ${sixes}, Ones: ${ones}`);

// Sort results
const sorted = [...rolls.dice].sort((a, b) => b - a); // Descending
console.log(`Sorted: [${sorted.join(', ')}]`);
```

### Combining Multiple Rolls

```typescript
// Attack and damage for multiple attacks
const attacks = [];
for (let i = 0; i < 3; i++) {
  const attack = roller.rollExpression('1d20+8');
  const damage = roller.rollExpression('1d8+5');
  attacks.push({ attack: attack.total, damage: damage.total });
}

console.log('Multiple attacks:');
attacks.forEach((attack, i) => {
  console.log(`Attack ${i+1}: ${attack.attack} to hit, ${attack.damage} damage`);
});

// Total damage if all hit
const totalDamage = attacks.reduce((sum, attack) => sum + attack.damage, 0);
console.log(`Total potential damage: ${totalDamage}`);
```

## 🎮 Common Gaming Patterns

### D&D Character Creation

```typescript
// Generate a full set of ability scores
function generateStats(): number[] {
  const stats = [];
  for (let i = 0; i < 6; i++) {
    const roll = roller.rollDropLowest(4, 6, 1); // 4d6 drop lowest
    stats.push(roll.total);
  }
  return stats.sort((a, b) => b - a); // Sort highest to lowest
}

const abilityScores = generateStats();
console.log(`Ability Scores: [${abilityScores.join(', ')}]`);
```

### Initiative Tracking

```typescript
// Roll initiative for multiple characters
const characters = ['Fighter', 'Wizard', 'Rogue', 'Cleric'];
const initiatives = characters.map(char => ({
  name: char,
  initiative: roller.rollExpression('1d20+2').total // +2 dex modifier
}));

// Sort by initiative (highest first)
initiatives.sort((a, b) => b.initiative - a.initiative);

console.log('Initiative Order:');
initiatives.forEach((char, i) => {
  console.log(`${i+1}. ${char.name}: ${char.initiative}`);
});
```

### Damage Rolling with Criticals

```typescript
function rollDamage(expression: string, isCritical: boolean = false): number {
  if (isCritical) {
    // Double the number of dice on a critical hit
    const doubled = expression.replace(/(\d+)d(\d+)/g, (match, count, sides) => 
      `${parseInt(count) * 2}d${sides}`
    );
    return roller.rollExpression(doubled).total;
  }
  return roller.rollExpression(expression).total;
}

// Normal hit
const normalDamage = rollDamage('1d8+3');
console.log(`Normal damage: ${normalDamage}`);

// Critical hit  
const critDamage = rollDamage('1d8+3', true);
console.log(`Critical damage: ${critDamage}`);
```

## 🔍 Error Handling

### Validating Input

```typescript
// Check for valid dice parameters
function safeDiceRoll(count: number, sides: number): DiceResult | null {
  if (count <= 0 || sides <= 0) {
    console.error('Dice count and sides must be positive');
    return null;
  }
  
  if (count > 1000) {
    console.error('Too many dice - maximum 1000');
    return null;
  }
  
  return roller.roll(count, sides);
}

// Expression validation
function safeExpressionRoll(expression: string): DiceResult | null {
  try {
    return roller.rollExpression(expression);
  } catch (error) {
    console.error(`Invalid expression "${expression}": ${error.message}`);
    return null;
  }
}

// Usage
const result = safeDiceRoll(3, 6);
if (result) {
  console.log(`Safe roll: ${result.total}`);
}
```

## 📚 What's Next?

Now that you understand basic usage, explore these advanced topics:

- **[Advanced Mechanics](advanced-mechanics.md)** - Exploding, penetrating, and compounding dice
- **[Success Pools](success-pools.md)** - Pool-based systems for modern RPGs
- **[CLI Usage](cli-usage.md)** - Using the command-line interface
- **[API Reference](../api/roller.md)** - Complete method documentation

---

*Continue to [Advanced Mechanics →](advanced-mechanics.md)*
