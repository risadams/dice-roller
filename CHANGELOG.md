# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
