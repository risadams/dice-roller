import { ExplanationEngine } from '../ExplanationEngine';
import { ExpressionContext } from '../ExpressionContext';

describe('Expression System - ExplanationEngine', () => {
  let engine: ExplanationEngine;
  let context: ExpressionContext;

  beforeEach(() => {
    engine = new ExplanationEngine();
    context = ExpressionContext.createTestContext(12345);
  });

  describe('Basic Explanation Generation', () => {
    it('should initialize with expression', () => {
      engine.initialize('2d6+3', context);
      
      expect(engine).toBeDefined();
    });

    it('should generate text explanation', () => {
      engine.initialize('42', context);
      engine.recordNodeEvaluation({ type: 'number', value: 42 }, 42, 'Evaluated number literal: 42');
      
      const text = engine.generateText();
      
      expect(text).toContain('Expression: 42');
      expect(text).toContain('Final Result: 42');
    });

    it('should generate markdown explanation', () => {
      engine.initialize('42', context);
      engine.recordNodeEvaluation({ type: 'number', value: 42 }, 42, 'Evaluated number literal: 42');
      
      const markdown = engine.generateMarkdown();
      
      expect(markdown).toContain('# Expression Evaluation: `42`');
      expect(markdown).toContain('## Final Result: **42**');
    });

    it('should record dice roll steps', () => {
      engine.initialize('2d6', context);
      const diceResult = { rolls: [4, 5], total: 9, count: 2, sides: 6 };
      engine.recordDiceRoll({ type: 'dice', count: 2, sides: 6 }, diceResult);
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.originalExpression).toBe('2d6');
      expect(explanation.steps).toHaveLength(1);
      expect(explanation.finalResult).toBe(9);
    });

    it('should record operation steps', () => {
      engine.initialize('5+3', context);
      engine.recordOperation('+', 5, 3, 8);
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.steps).toHaveLength(1);
      expect(explanation.finalResult).toBe(8);
    });
  });

  describe('Complex Expression Explanations', () => {
    it('should record multiple steps for complex expressions', () => {
      engine.initialize('2d6+3', context);
      const diceResult = { rolls: [4, 5], total: 9, count: 2, sides: 6 };
      engine.recordDiceRoll({ type: 'dice', count: 2, sides: 6 }, diceResult);
      engine.recordOperation('+', 9, 3, 12);
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.steps).toHaveLength(2);
      expect(explanation.finalResult).toBe(12);
    });

    it('should handle tokenization recording', () => {
      engine.initialize('2d6+3', context);
      engine.recordTokenization(['2d6', '+', '3']);
      
      const text = engine.generateText();
      
      expect(text).toContain('Tokenization: 2d6 → + → 3');
    });

    it('should handle parsing description', () => {
      engine.initialize('(2d6+1)*2', context);
      engine.recordParsing('Parsed as: multiplication of parenthetical expression by constant', 5);
      
      const text = engine.generateText();
      
      expect(text).toContain('Parsing: Parsed as: multiplication of parenthetical expression by constant');
    });
  });

  describe('Markdown Formatting', () => {
    it('should use proper markdown formatting', () => {
      engine.initialize('3d6', context);
      const diceResult = { rolls: [3, 4, 5], total: 12, count: 3, sides: 6 };
      engine.recordDiceRoll({ type: 'dice', count: 3, sides: 6 }, diceResult);
      
      const markdown = engine.generateMarkdown();
      
      expect(markdown).toContain('**');
      expect(markdown).toContain('`');
      expect(markdown).toMatch(/\*\*.*\*\*/); // Bold formatting
      expect(markdown).toMatch(/`.*`/); // Code formatting
    });

    it('should format dice rolls as code blocks', () => {
      engine.initialize('4d6', context);
      const diceResult = { rolls: [2, 5, 4, 5], total: 16, count: 4, sides: 6 };
      engine.recordDiceRoll({ type: 'dice', count: 4, sides: 6 }, diceResult);
      
      const markdown = engine.generateMarkdown();
      
      expect(markdown).toContain('`');
    });
  });

  describe('Step Recording', () => {
    it('should record evaluation steps with details', () => {
      engine.initialize('100', context);
      engine.recordNodeEvaluation({ type: 'number', value: 100 }, 100, 'Value: 100');
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.steps).toHaveLength(1);
      expect(explanation.steps[0].description).toContain('Number literal');
    });

    it('should record conditional dice', () => {
      const conditionalNode = { 
        type: 'conditional_dice', 
        count: 3, 
        sides: 6, 
        operator: '>', 
        threshold: 4 
      } as any;
      
      engine.initialize('3d6>4', context);
      const conditionalResult = {
        rolls: [2, 5, 6],
        total: 13,
        count: 3,
        sides: 6,
        successes: 2,
        threshold: 4,
        condition: '>',
        successfulRolls: [5, 6],
        failedRolls: [2]
      };
      engine.recordConditionalDice(conditionalNode, conditionalResult);
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.steps).toHaveLength(1);
      expect(explanation.finalResult).toBe(2);
    });

    it('should record reroll dice', () => {
      const rerollNode = { 
        type: 'reroll_dice', 
        count: 2, 
        sides: 6, 
        condition: '=1',
        rerollType: 'once'
      } as any;
      
      engine.initialize('2d6ro1', context);
      const rerollResult = {
        rolls: [3, 4],
        total: 7,
        count: 2,
        sides: 6,
        rerollCount: 1,
        maxRerollsReached: false,
        rerollType: 'once',
        condition: '=1',
        allRolls: [1, 4, 3], // original then reroll
        finalRolls: [3, 4]
      };
      engine.recordRerollDice(rerollNode, rerollResult);
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.steps).toHaveLength(1);
      expect(explanation.finalResult).toBe(7);
    });
  });

  describe('Options Configuration', () => {
    it('should respect includeTokenization option', () => {
      const engineWithoutTokens = new ExplanationEngine({ includeTokenization: false });
      engineWithoutTokens.initialize('2d6', context);
      engineWithoutTokens.recordTokenization(['2d6']);
      
      const text = engineWithoutTokens.generateText();
      
      expect(text).not.toContain('Tokenization:');
    });

    it('should respect includeParsing option', () => {
      const engineWithoutParsing = new ExplanationEngine({ includeParsing: false });
      engineWithoutParsing.initialize('2d6', context);
      engineWithoutParsing.recordParsing('Test parsing', 3);
      
      const text = engineWithoutParsing.generateText();
      
      expect(text).not.toContain('Parsing:');
    });

    it('should respect verboseMode option', () => {
      const verboseEngine = new ExplanationEngine({ verboseMode: true });
      verboseEngine.initialize('5', context);
      verboseEngine.recordNodeEvaluation({ type: 'number', value: 5 }, 5, 'Detailed information');
      
      const text = verboseEngine.generateText();
      
      expect(text).toContain('Details: Detailed information');
    });

    it('should respect includeTimestamps option', () => {
      const timestampEngine = new ExplanationEngine({ includeTimestamps: true });
      timestampEngine.initialize('5', context);
      
      const text = timestampEngine.generateText();
      
      expect(text).toContain('Execution Time:');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty steps gracefully', () => {
      engine.initialize('42', context);
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.steps).toHaveLength(0);
      expect(explanation.finalResult).toBe(0);
    });

    it('should handle missing context', () => {
      engine.initialize('42');
      engine.recordNodeEvaluation({ type: 'number', value: 42 }, 42, 'Number literal');
      
      const explanation = engine.generateExplanation();
      
      expect(explanation.executionTime).toBeUndefined();
    });
  });

  describe('Integration with Expression System', () => {
    it('should work with complete evaluation flow', () => {
      // This would typically be called by ExpressionSystem
      engine.initialize('2d6+3', context);
      
      // Simulate evaluation steps
      engine.recordTokenization(['2d6', '+', '3']);
      engine.recordParsing('Parsed as binary operation: dice + constant', 5);
      const diceResult = { rolls: [4, 5], total: 9, count: 2, sides: 6 };
      engine.recordDiceRoll({ type: 'dice', count: 2, sides: 6 }, diceResult);
      engine.recordOperation('+', 9, 3, 12);
      
      const text = engine.generateText();
      
      expect(text).toContain('Expression: 2d6+3');
      expect(text).toContain('Tokenization:');
      expect(text).toContain('Parsing:');
      expect(text).toContain('Evaluation Steps:');
      expect(text).toContain('Final Result: 12');
    });
  });

  describe('Performance', () => {
    it('should generate explanations efficiently', () => {
      engine.initialize('complex expression', context);
      
      // Add many steps
      for (let i = 0; i < 100; i++) {
        engine.recordNodeEvaluation({ type: 'number', value: i }, i, `Step ${i}`);
      }
      
      const startTime = Date.now();
      const text = engine.generateText();
      const endTime = Date.now();
      
      expect(text).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle large expressions efficiently', () => {
      engine.initialize('100d20+50d10+25d8+10d6', context);
      
      const startTime = Date.now();
      const diceResult = { rolls: Array(100).fill(10), total: 1000, count: 100, sides: 20 };
      engine.recordDiceRoll({ type: 'dice', count: 100, sides: 20 }, diceResult);
      const markdown = engine.generateMarkdown();
      const endTime = Date.now();
      
      expect(markdown).toBeDefined();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
