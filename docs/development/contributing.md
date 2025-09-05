# Contributing to Dice Roller

Thank you for your interest in contributing to the Dice Roller TypeScript library! This document provides guidelines for contributing to the project.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 16+
- npm or yarn
- TypeScript knowledge

### Installation

```bash
git clone https://github.com/your-username/roller.git
cd roller
npm install
```

### Running Tests

```bash
npm test          # Run all tests
npm run test:watch # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Building

```bash
npm run build     # Compile TypeScript
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
```

## Code Guidelines

### TypeScript Standards

- Use TypeScript strict mode
- Provide explicit type annotations for public APIs
- Avoid `any` types - use proper typing
- Follow ES6+ conventions where appropriate

### Code Style

- Use Prettier for formatting (configured in `.prettierrc`)
- Follow ESLint rules (configured in `.eslintrc.js`)
- Use meaningful variable and function names
- Keep functions focused and single-purpose

### API Compatibility

- Maintain compatibility with the original C# implementation
- Preserve existing method signatures and behavior
- Document any breaking changes in pull requests

## Testing Requirements

### Coverage Standards

- Target 100% test coverage
- Test all public methods and edge cases
- Include error condition testing
- Use Jest for all testing

### Test Structure

```typescript
describe('ClassName', () => {
  describe('methodName', () => {
    it('should handle normal case', () => {
      // Test implementation
    });
    
    it('should handle edge case', () => {
      // Test implementation
    });
    
    it('should throw error for invalid input', () => {
      // Error testing
    });
  });
});
```

## Pull Request Process

1. **Create an Issue**: For significant changes, create an issue first to discuss
2. **Branch Naming**: Use descriptive names like `feature/add-custom-dice` or `fix/parser-bug`
3. **Commit Messages**: Use conventional commits format:
   - `feat: add new dice expression parser`
   - `fix: resolve random number generation issue`
   - `docs: update API documentation`
   - `test: add edge case tests for Die class`

4. **Pull Request Requirements**:
   - Include description of changes
   - Reference related issues
   - Ensure all tests pass
   - Maintain or improve test coverage
   - Update documentation if needed

5. **Code Review**: Address feedback promptly and professionally

## Core Classes Overview

When contributing, understand these key components:

- **Roller**: Main dice rolling engine with advanced mechanics
- **Die**: Individual die representation with customizable random functions  
- **DiceExpression**: Parses and evaluates complex dice expressions
- **DiceExpressionPart**: Components of dice expressions

## Documentation

- Update JSDoc comments for new/modified public methods
- Include usage examples for significant features
- Update README.md if adding new functionality
- Maintain API documentation accuracy

## Bug Reports

When reporting bugs:

- Use the issue template
- Provide minimal reproduction case
- Include environment details (Node.js version, OS)
- Specify expected vs actual behavior

## Feature Requests

For new features:

- Check existing issues first
- Describe the use case clearly
- Consider backward compatibility
- Propose API design if applicable

## Questions?

- Open an issue with the "question" label
- Check existing documentation first
- Be specific about what you're trying to achieve

## License

By contributing, you agree that your contributions will be licensed under the same license
