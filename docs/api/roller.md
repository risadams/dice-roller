# 🎲 Roller Class API Reference

The `Roller` class is the main entry point for all dice rolling operations. It provides a comprehensive set of methods for simple rolls, complex expressions, and advanced gaming mechanics.

## Constructor

### `new Roller(randomFunction?: () => number)`

Creates a new Roller instance with an optional custom random function.

**Parameters:**

- `randomFunction` *(optional)*: Custom random number generator function. Must return values between 0 and 1. Defaults to `Math.random`.

**Example:**

```typescript
// Default random function
const roller = new Roller();

// Custom seeded random function
const seededRoller = new Roller(() => mySeededRNG());
```

---

## Basic Rolling Methods

### `roll(count: number, sides: number): DiceResult`

Rolls a specified number of dice with a given number of sides.

**Parameters:**

- `count`: Number of dice to roll (must be positive)
- `sides`: Number of sides per die (must be positive)

**Returns:** `DiceResult` object containing roll results

**Example:**

```typescript
const result = roller.roll(3, 6);
// Returns: { dice: [4, 2, 6], total: 12, count: 3, sides: 6 }
```

### `rollWithModifier(count: number, sides: number, modifier: number): DiceResult`

Rolls dice and applies a modifier to the total.

**Parameters:**

- `count`: Number of dice to roll
- `sides`: Number of sides per die  
- `modifier`: Value to add to (or subtract from) the total

**Returns:** `DiceResult` with modifier applied

**Example:**

```typescript
const attack = roller.rollWithModifier(1, 20, 5);
// Returns: { dice: [15], total: 20, modifier: 5, ... }
```

---

## Expression Rolling

### `rollExpression(expression: string): DiceResult`

Parses and evaluates a dice expression string.

**Parameters:**

- `expression`: Dice expression string (e.g., "2d6+3", "1d20+5")

**Returns:** `DiceResult` object with expression results

**Supported Syntax:**

- Basic dice: `1d20`, `3d6`, `2d8`
- Modifiers: `1d20+5`, `2d6-2`
- Math operations: `(1d4+1)*2`, `1d8+1d4`
- Keep/drop: `4d6kh3`, `4d6dl1`, `5d6km3`
- Conditionals: `5d10>6`, `3d6>=4`
- Rerolls: `4d6r1`, `3d6ro<2`, `2d8rr1`

**Example:**

```typescript
const result = roller.rollExpression('2d6+3');
const advantage = roller.rollExpression('2d20kh1');
const successes = roller.rollExpression('5d10>6');
```

### `validateExpression(expression: string): boolean`

Validates a dice expression without rolling it.

**Parameters:**

- `expression`: Expression string to validate

**Returns:** `true` if expression is valid, `false` otherwise

**Example:**

```typescript
if (roller.validateExpression('1d20+5')) {
  const result = roller.rollExpression('1d20+5');
}
```

---

## Keep/Drop Mechanics

### `rollKeepHighest(count: number, sides: number, keep: number): KeepDropResult`

Rolls dice and keeps only the highest results.

**Parameters:**

- `count`: Number of dice to roll
- `sides`: Number of sides per die
- `keep`: Number of highest dice to keep

**Returns:** `KeepDropResult` with kept and dropped dice

**Example:**

```typescript
// Roll 4d6, keep highest 3 (D&D stat generation)
const stat = roller.rollKeepHighest(4, 6, 3);
console.log(`Stat: ${stat.total} (kept: [${stat.keptDice}])`);
```

### `rollKeepLowest(count: number, sides: number, keep: number): KeepDropResult`

Rolls dice and keeps only the lowest results.

**Example:**

```typescript
// Disadvantage roll (2d20, keep lowest)
const disadvantage = roller.rollKeepLowest(2, 20, 1);
```

### `rollDropHighest(count: number, sides: number, drop: number): KeepDropResult`

Rolls dice and drops the highest results.

**Example:**

```typescript
// Alternative stat generation (4d6, drop highest 1)
const stat = roller.rollDropHighest(4, 6, 1);
```

### `rollDropLowest(count: number, sides: number, drop: number): KeepDropResult`

Rolls dice and drops the lowest results.

**Example:**

```typescript
// Standard stat generation (4d6, drop lowest)
const stat = roller.rollDropLowest(4, 6, 1);
```

### `rollKeepMiddle(count: number, sides: number, keep: number): KeepDropResult`

Rolls dice and keeps the middle results (removes outliers).

**Example:**

```typescript
// Roll 5d6, keep middle 3
const middle = roller.rollKeepMiddle(5, 6, 3);
```

### `rollKeepConditional(count: number, sides: number, condition: (die: number) => boolean): KeepDropResult`

Rolls dice and keeps only those meeting a condition.

**Example:**

```typescript
// Keep only dice that rolled 4 or higher
const conditional = roller.rollKeepConditional(6, 6, die => die >= 4);
```

---

## Advanced Mechanics

### `rollExploding(count: number, sides: number, options?: ExplosionOptions): ExplodingResult`

Rolls exploding dice (dice that roll additional dice on maximum values).

**Parameters:**

- `count`: Number of dice to roll
- `sides`: Number of sides per die
- `options`: Optional explosion configuration

**Options:**

```typescript
interface ExplosionOptions {
  explodeOn?: number;      // Value that triggers explosion (default: max sides)
  maxExplosions?: number;  // Maximum explosions per die (default: 100)
}
```

**Example:**

```typescript
// Standard exploding d6s
const exploding = roller.rollExploding(3, 6);

// Custom explosion threshold
const custom = roller.rollExploding(2, 10, { explodeOn: 9 });
```

### `rollPenetrating(count: number, sides: number, options?: PenetratingOptions): PenetratingResult`

Rolls penetrating dice (exploding dice with -1 penalty on subsequent rolls).

**Example:**

```typescript
// Savage Worlds style penetrating dice
const penetrating = roller.rollPenetrating(2, 8);
```

### `rollCompounding(count: number, sides: number, options?: CompoundingOptions): CompoundingResult`

Rolls compounding dice (explosions are added to the original die total).

**Example:**

```typescript
// Compounding d6s
const compounding = roller.rollCompounding(3, 6);
```

### `rollStepDice(dieType: string, steps: number): StepDiceResult`

Rolls step dice using Savage Worlds progression (d4→d6→d8→d10→d12→d12+1, etc.).

**Parameters:**

- `dieType`: Starting die type (`'d4'`, `'d6'`, `'d8'`, `'d10'`, `'d12'`)
- `steps`: Number of steps to advance

**Example:**

```typescript
// Step up from d6 by 2 steps (d6 → d8 → d10)
const stepped = roller.rollStepDice('d6', 2);
```

---

## Success Pool Systems

### `rollSuccessPool(count: number, sides: number, threshold: number, options?: SuccessPoolOptions): SuccessPoolResult`

Rolls a pool of dice and counts successes against a threshold.

**Parameters:**

- `count`: Number of dice in the pool
- `sides`: Number of sides per die
- `threshold`: Minimum value for success
- `options`: Optional pool configuration

**Options:**

```typescript
interface SuccessPoolOptions {
  botchThreshold?: number;    // Value that counts as botch (default: none)
  explodeOn?: number;         // Value that adds extra dice (default: none)
  maxExplosions?: number;     // Maximum explosions (default: 100)
}
```

**Example:**

```typescript
// World of Darkness style: 8d10, difficulty 6, botch on 1
const wod = roller.rollSuccessPool(8, 10, 6, { 
  botchThreshold: 1,
  explodeOn: 10 
});

console.log(`Successes: ${wod.successes}, Botches: ${wod.botches}`);
```

### `rollTargetNumbers(dice: number[], targets: number[]): TargetNumberResult`

Rolls against specific target numbers for each die.

**Example:**

```typescript
// Different target numbers for each die
const targets = roller.rollTargetNumbers([6, 8, 10], [4, 5, 6]);
```

### `rollVariableSuccessPool(poolSizes: number[], sides: number, threshold: number): VariableSuccessResult`

Rolls multiple pools of different sizes.

**Example:**

```typescript
// Multiple pools: 5 dice, 3 dice, 7 dice
const variable = roller.rollVariableSuccessPool([5, 3, 7], 10, 6);
```

---

## Configuration Methods

### `setRandomFunction(randomFunction: () => number): void`

Changes the random number generator function.

**Example:**

```typescript
// Switch to a seeded random function
roller.setRandomFunction(() => mySeededRNG());
```

### `setDefaultMaxExplosions(max: number): void`

Sets the default maximum explosions for exploding dice.

**Example:**

```typescript
// Increase safety limit for explosions
roller.setDefaultMaxExplosions(1000);
```

### `setVerboseMode(enabled: boolean): void`

Enables or disables verbose explanations in results.

**Example:**

```typescript
// Enable detailed explanations
roller.setVerboseMode(true);
```

---

## Result Types

### `DiceResult`

Standard result object for most dice operations.

```typescript
interface DiceResult {
  dice: number[];           // Individual die results
  total: number;            // Sum of all dice
  count: number;            // Number of dice rolled
  sides: number;            // Number of sides per die
  modifier?: number;        // Applied modifier
  explanation?: string;     // Human-readable explanation
}
```

### `KeepDropResult`

Result object for keep/drop operations.

```typescript
interface KeepDropResult extends DiceResult {
  keptDice: number[];       // Dice that were kept
  droppedDice: number[];    // Dice that were dropped
  keptCount: number;        // Number of dice kept
  droppedCount: number;     // Number of dice dropped
}
```

### `SuccessPoolResult`

Result object for success pool rolls.

```typescript
interface SuccessPoolResult {
  dice: number[];           // All die results
  successes: number;        // Number of successful dice
  failures: number;         // Number of failed dice
  botches: number;          // Number of botched dice
  threshold: number;        // Success threshold used
  totalDice: number;        // Total dice rolled (including explosions)
  explosions: number;       // Number of explosions that occurred
}
```

### `ExplodingResult`

Result object for exploding dice.

```typescript
interface ExplodingResult extends DiceResult {
  explosions: number[];     // Additional dice from explosions
  totalExplosions: number;  // Total number of explosions
  originalDice: number[];   // Original dice before explosions
}
```

---

## Error Handling

All methods validate input parameters and throw descriptive errors for invalid inputs:

```typescript
try {
  const result = roller.roll(0, 6); // Invalid: count must be positive
} catch (error) {
  console.error(error.message); // "Dice count must be positive"
}

try {
  const result = roller.rollExpression('1d20+'); // Invalid expression
} catch (error) {
  console.error(error.message); // "Invalid expression syntax"
}
```

## Performance Considerations

- **Explosion limits**: Always set reasonable `maxExplosions` for exploding dice
- **Large pools**: Consider memory usage for very large dice pools (1000+ dice)
- **Expression complexity**: Complex expressions with many operations may be slower
- **Custom random functions**: Ensure custom RNG functions are performant

---

## See Also

- **[Basic Usage Guide](../guides/basic-usage.md)** - Practical examples and patterns
- **[Advanced Mechanics Guide](../guides/advanced-mechanics.md)** - Detailed exploding dice usage
- **[Success Pools Guide](../guides/success-pools.md)** - Modern RPG systems
- **[Expression System](../architecture/expression-system.md)** - How expressions are parsed

---

*For complete method signatures and additional details, see the TypeScript definitions in the source code.*
