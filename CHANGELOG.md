# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Advanced Dice Mechanics** - Complete implementation of gaming dice mechanics:
  - `rollPenetrating()` - Exploding dice with -1 penalty on subsequent rolls (Savage Worlds style)
  - `rollCompounding()` - Exploding dice that accumulate into single die totals
  - `rollStepDice()` - Savage Worlds step dice system (d4→d6→d8→d10→d12→d12+N)
  - `rollDropHighest()` / `rollDropLowest()` - Drop specific number of highest/lowest dice
  - `rollKeepMiddle()` - Keep middle N dice from a pool
  - `rollKeepConditional()` - Keep dice based on threshold conditions (above/below/equal)

- **Enhanced CLI Commands** for all advanced dice mechanics:
  - `penetrating <count> <sides>` - Roll penetrating dice
  - `compounding <count> <sides>` - Roll compounding dice  
  - `step <die> <steps>` - Roll step dice with progression
  - `keep-highest <count> <sides> <keep>` - Roll and keep highest N dice
  - `keep-lowest <count> <sides> <keep>` - Roll and keep lowest N dice
  - `keep-middle <count> <sides> <keep>` - Roll and keep middle N dice
  - `drop-highest <count> <sides> <drop>` - Roll and drop highest N dice
  - `drop-lowest <count> <sides> <drop>` - Roll and drop lowest N dice
  - `--max-explosions <num>` flag for penetrating/compounding dice

- **Comprehensive Test Coverage** - 25 new test cases covering all advanced mechanics
- **Type Safety** - Full TypeScript support with detailed return types for all new methods

### Enhanced

- CLI help system updated with examples for all new advanced dice mechanics
- Verbose output includes detailed breakdowns of advanced dice results
- Error handling for edge cases (invalid step dice, excessive drops, etc.)

## [1.1.2] - 2025-09-02

### Added

- Enhanced CLI with `--verbose`/`-v` flag for detailed output
- New custom dice CLI commands:
  - `coin` (alias: `flip`) - Coin flip (Heads/Tails)
  - `magic8` (aliases: `8ball`, `magic8ball`) - Magic 8-Ball responses
  - `yesno` (aliases: `yn`, `decision`) - Simple Yes/No decision maker
- Support for flexible flag positioning (before or after commands)
- Comprehensive help documentation for all new commands

### Changed

- **BREAKING**: CLI now shows clean output by default (just the result)
- Verbose output (with emojis and details) now requires `--verbose` or `-v` flag
- Enhanced user experience with minimal default output for quick dice rolls
- Improved help text organization and examples

### Enhanced

- All existing CLI commands now support verbose mode
- Better emoji usage for different die types in verbose mode
- Consistent output formatting across all commands
- Multiple command aliases for better user experience

## [1.1.1] - 2025-09-02

### Added

- CLI support for Scrum planning dice with `npx @risadams/dice-roller scrum` command
- CLI support for Fibonacci dice with `npx @risadams/dice-roller fibonacci` (or `fib`) command
- Enhanced help documentation showing new custom dice commands

### Changed

- Optimized `CustomDie.getPossibleValues()` method to use single-pass reduce instead of multiple filter operations
- Improved performance in `Roller.getCustomDieStatistics()` by tracking numeric values during sampling loop instead of filtering afterwards
- Updated CLI help text to include examples for Scrum and Fibonacci dice

### Performance Improvements

- Reduced memory allocations in custom dice value processing
- Eliminated redundant array traversals in statistics calculations
- Better algorithmic complexity for large datasets

## [1.1.0] - 2025-09-02

### Features Added

- `CustomDie<T>` class for creating dice with arbitrary values (numeric, text, symbols, etc.)
- `DicePresets` factory class with pre-configured dice:
  - `createFibonacciDie()` - Perfect for Scrum story point estimation
  - `createScrumPlanningDie()` - Standard planning poker values (1,2,3,5,8,13,20,?)
  - `createGeometricDie()` - Geometric progression values
  - `createWeightedDie()` - Dice with weighted probabilities
  - `createTextDie()` - Text-based dice (coin flips, decisions, etc.)
- Enhanced `Roller` class with custom dice operations:
  - `rollCustomDice()` - Roll custom dice with various operations
  - `sumCustomDice()` - Sum multiple custom dice rolls
  - `compareCustomDice()` - Compare two custom dice performance
  - `getCustomDieStatistics()` - Comprehensive statistics for custom dice
- Support for mixed numeric and non-numeric dice faces
- Probability calculations for weighted and custom dice
- Comprehensive test suite with 105+ tests covering all new functionality

### Enhancements

- Statistics generation now handles custom dice gracefully
- Demo script showcasing all custom dice features
- README documentation with detailed usage examples and API reference

### Technical Improvements

- Full TypeScript support with generic type safety
- Maintains backward compatibility with existing dice functionality
- Exported through main index for easy importing

## [1.0.0] - 2025-09-01

### Initial Release

- Initial release of the TypeScript dice rolling library
- `Die` class for standard dice (d4, d6, d8, d10, d12, d20, d100)
- `DiceExpression` class for parsing and evaluating complex dice expressions
- `Roller` class as the main dice rolling engine with advanced mechanics
- Support for advantage/disadvantage rolls
- Exploding dice mechanics
- Keep highest/lowest functionality
- Comprehensive statistics generation
- CLI interface for command-line usage
- Full Jest test suite
- Complete TypeScript type definitions
