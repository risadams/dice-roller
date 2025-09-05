# 🛠️ Utils Directory - Complete Implementation

## Purpose

The `utils/` directory contains comprehensive utility functions that support the entire dice rolling library architecture. These utilities provide reusable, focused functions for common operations throughout the codebase.

## Contents

### **NumberUtils.ts** - Mathematical Operations

- **Number parsing**: `safeParseInt()`, `safeParseFloat()` with validation
- **Mathematical operations**: `clamp()`, `roundToDecimal()`, `randomInt()`
- **Statistical functions**: `sum()`, `average()`, `standardDeviation()`, `median()`, `mode()`
- **Utility functions**: `percentage()`, `formatWithCommas()`, `isInRange()`

### **ArrayUtils.ts** - Array Manipulation

- **Sorting/filtering**: `sortNumbers()`, `topN()`, `bottomN()`, `dropHighest()`, `dropLowest()`, `keepMiddle()`
- **Array operations**: `unique()`, `shuffle()`, `chunk()`, `flatten()`
- **Analysis**: `countOccurrences()`, `groupBy()`, `intersection()`, `difference()`
- **Random selection**: `randomSample()`, `randomElement()`

### **StringUtils.ts** - Text Processing

- **Formatting**: `capitalize()`, `toTitleCase()`, `pad()`, `truncate()`
- **Grammar**: `pluralize()`, `ordinal()`, `grammarJoin()`
- **Dice-specific**: `formatDiceRolls()`, `formatDiceExpression()`
- **Validation**: `isInteger()`, `isFloat()`, `escapeRegex()`
- **Display**: `progressBar()`, `formatPercentage()`, `wordWrap()`

### **ConsoleUtils.ts** - Console Output

- **Color support**: ANSI color codes and `colorize()` function
- **Symbols**: Unicode symbols for dice, success/failure, navigation
- **Logging**: `log()`, `error()`, `success()`, `warning()`, `info()`
- **Formatting**: `header()`, `box()`, `table()`, `progress()`
- **Dice-specific**: `formatDiceResult()`, `formatSuccessPool()`, `formatStatistics()`

### **TestUtils.ts** - Testing Helpers

- **Mock functions**: `createSequentialMock()`, `createConstantMock()`, `createPatternMock()`
- **Random mocking**: `withMockedRandom()`, `createSeededRandom()`
- **Test data**: `generateTestRolls()`, `createSuccessPoolTestData()`
- **Performance**: `measureTime()`, `benchmark()`
- **Comparison**: `deepEqual()`, `deepClone()`
- **Spies**: `createSpy()` with call tracking

### **index.ts** - Central Exports

- **All utility classes**: Exported individually and collectively
- **Common functions**: Re-exported for convenience
- **Constants**: `DiceConstants` with standard values and Unicode symbols
- **Validation**: `DiceValidation` helpers for dice-specific validation
- **Types**: TypeScript types for common patterns

## Usage Examples

### Number Operations

```typescript
import { NumberUtils } from './utils';

const count = NumberUtils.safeParseInt('3', 'dice count'); // Throws if invalid
const average = NumberUtils.average([1, 2, 3, 4, 5]); // 3
const clamped = NumberUtils.clamp(15, 1, 10); // 10
```

### Array Operations

```typescript
import { ArrayUtils } from './utils';

const rolls = [1, 6, 3, 6, 2];
const highest = ArrayUtils.topN(rolls, 3); // [6, 6, 3]
const dropped = ArrayUtils.dropLowest(rolls, 2); // [6, 3, 6]
```

### String Formatting

```typescript
import { StringUtils } from './utils';

const plural = StringUtils.pluralize('die', 3); // 'dies'
const ordinal = StringUtils.ordinal(21); // '21st'
const joined = StringUtils.grammarJoin(['a', 'b', 'c']); // 'a, b, and c'
```

### Console Output

```typescript
import { ConsoleUtils } from './utils';

ConsoleUtils.success('Roll successful!');
ConsoleUtils.formatDiceResult('3d6', 15, ['Rolled: 4, 5, 6']);
ConsoleUtils.formatSuccessPool(2, [4, 6, 2, 6], 5);
```

### Testing Helpers

```typescript
import { TestUtils } from './utils';

const mock = TestUtils.createSequentialMock([0.1, 0.5, 0.9]);
const rolls = TestUtils.generateTestRolls(10, 6, 12345);

TestUtils.withMockedRandom(() => 0.5, () => {
  // Math.random() will return 0.5 in this block
});
```

## Integration Points

### **Validation System**

- Used by all mechanics for parameter validation
- Replaces scattered validation throughout the codebase
- Consistent error messages and bounds checking

### **CLI System**

- Output formatting utilities used by `OutputFormatter`
- Number parsing used for command-line argument processing
- String utilities for help text and formatting

### **Testing Framework**

- Mock utilities used throughout test suites
- Statistical validation for dice roll tests
- Performance measurement for benchmarking

### **Core Mechanics**

- Array utilities for dice roll manipulation
- Mathematical functions for statistical calculations
- Random number generation with custom providers

## Benefits

### **Code Reuse** ✅

- Eliminates duplication across modules
- Consistent behavior throughout the library
- Single source of truth for common operations

### **Testing** ✅

- Comprehensive test coverage (31 additional tests)
- Utilities for creating test data and mocks
- Validation of edge cases and error conditions

### **Maintainability** ✅

- Small, focused functions with single responsibilities
- Clear documentation and examples
- Easy to extend and modify

### **Performance** ✅

- Optimized implementations of common operations
- Benchmarking utilities for performance monitoring
- Memory-efficient array operations

## Architecture Integration

The utils directory complements the existing architecture:

1. **Core modules** use utilities for validation and mathematical operations
2. **CLI system** uses utilities for output formatting and argument parsing
3. **Testing framework** uses utilities for mock data and validation
4. **New features** can leverage existing utilities instead of reimplementing

This implementation transforms the empty `utils/` directory into a comprehensive toolkit that serves the entire dice rolling library, reducing code duplication and improving consistency across all modules.
