# 🏗️ Expression System Architecture Plan

## Current Analysis (DiceExpression.ts - 1,126 lines)

### **Responsibility Breakdown:**

- **36 private methods** - Complex internal logic mixed together
- **10 public methods** - External API surface
- **3 exported interfaces** - Type definitions
- **Mixed concerns**: Parsing, evaluation, explanation, state management

### **Identified Separation Points:**

#### **1. Tokenization & Parsing (Lines 81-300)**

- `tokenize()` - Convert string to tokens
- `parseExpression()` - Recursive descent parser
- `parseAdditionSubtraction()` - Operator precedence
- `parseMultiplicationDivision()` - Math operations
- `parsePrimary()` - Base expressions
- `parseDiceNotation()` - Dice syntax parsing
- `parseRerollMechanics()` - Reroll syntax
- `validateStructure()` - Syntax validation

#### **2. Evaluation Logic (Lines 330-700)**

- `evaluate()` - Main evaluation entry
- `evaluatePartsList()` - Expression evaluation
- `evaluateConditionalDice()` - Conditional dice logic
- `evaluateRerollDice()` - Reroll mechanics
- `rollSingleDieWithRerolls()` - Dice rolling logic

#### **3. Explanation System (Lines 341-600)**

- `evaluateWithExplanation()` - Step tracking
- `addExplanationStep()` - Step recording
- `formatParsingExplanation()` - Format parsing info
- All `*WithExplanation()` methods - Dual-purpose evaluation

#### **4. Utility Methods (Lines 700-1126)**

- `getMinValue()` / `getMaxValue()` - Range calculations
- `shouldReroll()` - Reroll condition checking
- `toString()` / `getParts()` - Serialization
- Various helper methods

#### **5. State Management**

- `parts: DiceExpressionPart[]` - Parsed expression
- `explanation: EvaluationExplanation | null` - Explanation state
- `currentStep: number` - Step counter
- `static config` - Global configuration

---

## 🎯 **Proposed Modular Architecture**

### **Directory Structure:**

```
src/expression/
├── types/
│   ├── TokenTypes.ts           # Token and parsing types
│   ├── ExpressionTypes.ts      # Expression AST types  
│   ├── EvaluationTypes.ts      # Evaluation result types
│   └── index.ts               # Unified type exports
├── parsing/
│   ├── Tokenizer.ts           # String → tokens conversion
│   ├── Parser.ts              # Tokens → AST conversion
│   ├── DiceNotationParser.ts  # Specialized dice parsing
│   └── ValidationRules.ts     # Syntax validation
├── evaluation/
│   ├── Evaluator.ts           # AST → result evaluation
│   ├── DiceEvaluator.ts       # Dice rolling logic
│   ├── ConditionalEvaluator.ts # Conditional dice logic
│   └── RerollEvaluator.ts     # Reroll mechanics
├── explanation/
│   ├── ExplanationEngine.ts   # Step-by-step tracking
│   ├── ExplanationFormatter.ts # Output formatting
│   └── StepTracker.ts         # Step management
├── context/
│   ├── ExpressionContext.ts   # Shared state management
│   ├── Configuration.ts       # Global config
│   └── RandomProvider.ts     # Random number handling
├── utils/
│   ├── RangeCalculator.ts     # Min/max calculations
│   ├── ConditionEvaluator.ts  # Condition checking
│   └── ExpressionSerializer.ts # toString/serialization
├── DiceExpression.ts          # Main facade (maintains API)
└── index.ts                   # Public exports
```

### **Component Responsibilities:**

#### **1. Tokenizer (50 lines)**

- Convert dice expression strings to token arrays
- Handle regex patterns and validation
- Error reporting for invalid syntax

#### **2. Parser (120 lines)**

- Recursive descent parsing with operator precedence
- Convert tokens to Abstract Syntax Tree (AST)
- Handle parentheses, dice notation, conditionals

#### **3. Evaluator (100 lines)**

- Traverse AST and compute results
- Delegate to specialized evaluators
- Handle operators and mathematical operations

#### **4. ExplanationEngine (80 lines)**

- Track evaluation steps
- Format step-by-step explanations
- Manage explanation state

#### **5. ExpressionContext (60 lines)**

- Manage shared state between components
- Handle configuration and random providers
- Coordinate component communication

#### **6. Specialized Evaluators (60-80 lines each)**

- **DiceEvaluator**: Basic dice rolling
- **ConditionalEvaluator**: Success counting
- **RerollEvaluator**: Reroll mechanics

#### **7. DiceExpression Facade (80 lines)**

- Maintain existing public API
- Coordinate modular components
- Ensure backward compatibility

---

## 🔄 **Migration Benefits**

### **Before (Monolithic):**

- **1,126 lines** in single file
- **Mixed concerns** - parsing, evaluation, explanation
- **Hard to test** individual components
- **Difficult to extend** without touching core file

### **After (Modular):**

- **~80 lines** per focused component
- **Single responsibility** per module
- **Easy testing** of individual components  
- **Simple extension** through composition

### **Performance Considerations:**

- **Parsing separation** enables expression caching
- **Evaluation optimization** through specialized evaluators
- **Memory efficiency** through focused object creation
- **Lazy loading** of explanation engine when not needed

### **Testing Improvements:**

- **Unit tests** for each component
- **Mock dependencies** for isolated testing
- **Performance benchmarks** for each module
- **Integration tests** for component interaction

---

## 🚀 **Implementation Order**

1. **Types First** - Define interfaces for component communication
2. **Tokenizer** - Foundation for all parsing
3. **Parser** - Core AST generation
4. **Basic Evaluator** - Simple expression evaluation
5. **Specialized Evaluators** - Dice-specific logic
6. **ExplanationEngine** - Step tracking system
7. **Context Management** - State coordination
8. **Facade Integration** - Backward compatibility
9. **Test Migration** - Comprehensive test coverage
10. **Performance Optimization** - Caching and improvements

This architecture follows the same successful patterns used in the core mechanics and CLI refactoring, ensuring consistency across the entire codebase while dramatically improving maintainability and extensibility.
