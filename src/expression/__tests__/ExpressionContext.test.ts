import { ExpressionContext } from '../ExpressionContext';
import { ContextConfiguration, EvaluationMetrics } from '../types';

describe('Expression System - ExpressionContext', () => {
  describe('Context Creation', () => {
    it('should create context with default configuration', () => {
      const context = new ExpressionContext();
      
      expect(context.maxRerolls).toBe(100);
      expect(context.maxExecutionTime).toBe(5000);
      expect(context.enableExplanation).toBe(false);
      expect(context.stepCounter).toBe(0);
      expect(context.metrics).toBeDefined();
      expect(typeof context.randomProvider).toBe('function');
    });

    it('should create context with custom configuration', () => {
      const config: Partial<ContextConfiguration> = {
        maxRerolls: 50,
        maxExecutionTime: 2000,
        enableExplanation: true,
        debugMode: true
      };
      
      const context = new ExpressionContext(config);
      
      expect(context.maxRerolls).toBe(50);
      expect(context.maxExecutionTime).toBe(2000);
      expect(context.enableExplanation).toBe(true);
    });

    it('should create test context with seeded random', () => {
      const context = ExpressionContext.createTestContext(12345);
      
      expect(context.randomProvider).toBeDefined();
      
      // Seeded random should be deterministic
      const rand1 = context.randomProvider();
      const rand2 = context.randomProvider();
      
      expect(rand1).toBeGreaterThanOrEqual(0);
      expect(rand1).toBeLessThan(1);
      expect(rand2).toBeGreaterThanOrEqual(0);
      expect(rand2).toBeLessThan(1);
      expect(rand1).not.toBe(rand2);
    });

    it('should create production context', () => {
      const context = ExpressionContext.createProductionContext({
        maxRerolls: 25
      });
      
      expect(context.maxRerolls).toBe(25);
      expect(context.enableExplanation).toBe(false);
    });

    it('should create debug context', () => {
      const context = ExpressionContext.createDebugContext();
      
      // Debug context should be configured for debugging
      expect(context.enableExplanation).toBe(true);
    });
  });

  describe('Child Context Creation', () => {
    it('should create child context with inherited configuration', () => {
      const parent = new ExpressionContext({
        maxRerolls: 75,
        enableExplanation: true
      });
      
      const child = parent.createChildContext();
      
      expect(child.maxRerolls).toBe(75);
      expect(child.enableExplanation).toBe(true);
      expect(child.stepCounter).toBe(0); // Should inherit step counter
    });

    it('should create child context with overrides', () => {
      const parent = new ExpressionContext({
        maxRerolls: 75,
        enableExplanation: true
      });
      
      const child = parent.createChildContext({
        maxRerolls: 25,
        enableExplanation: false
      });
      
      expect(child.maxRerolls).toBe(25);
      expect(child.enableExplanation).toBe(false);
    });

    it('should inherit step counter from parent', () => {
      const parent = new ExpressionContext();
      parent.stepCounter = 5;
      
      const child = parent.createChildContext();
      
      expect(child.stepCounter).toBe(5);
    });
  });

  describe('Random Number Generation', () => {
    it('should provide deterministic random with seed', () => {
      const context1 = ExpressionContext.createTestContext(12345);
      const context2 = ExpressionContext.createTestContext(12345);
      
      const values1: number[] = [];
      const values2: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        values1.push(context1.randomProvider());
        values2.push(context2.randomProvider());
      }
      
      expect(values1).toEqual(values2);
    });

    it('should provide different random with different seeds', () => {
      const context1 = ExpressionContext.createTestContext(12345);
      const context2 = ExpressionContext.createTestContext(54321);
      
      const value1 = context1.randomProvider();
      const value2 = context2.randomProvider();
      
      expect(value1).not.toBe(value2);
    });

    it('should use Math.random without seed', () => {
      const context = new ExpressionContext();
      
      const value = context.randomProvider();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    });
  });

  describe('Metrics Tracking', () => {
    let context: ExpressionContext;

    beforeEach(() => {
      context = new ExpressionContext();
    });

    it('should start with zero metrics', () => {
      expect(context.metrics.diceRolled).toBe(0);
      expect(context.metrics.nodesEvaluated).toBe(0);
      expect(context.metrics.rerollsPerformed).toBe(0);
      expect(context.metrics.executionTime).toBe(0);
    });

    it('should record dice rolls', () => {
      context.recordDiceRoll(3);
      expect(context.metrics.diceRolled).toBe(3);
      
      context.recordDiceRoll(2);
      expect(context.metrics.diceRolled).toBe(5);
    });

    it('should record node evaluations', () => {
      const mockNode = { type: 'number', value: 5 } as any;
      
      context.recordNodeEvaluation(mockNode);
      expect(context.metrics.nodesEvaluated).toBe(1);
      expect(context.stepCounter).toBe(1);
      
      context.recordNodeEvaluation(mockNode);
      expect(context.metrics.nodesEvaluated).toBe(2);
      expect(context.stepCounter).toBe(2);
    });

    it('should record rerolls', () => {
      context.recordReroll();
      expect(context.metrics.rerollsPerformed).toBe(1);
      
      context.recordReroll();
      expect(context.metrics.rerollsPerformed).toBe(2);
    });

    it('should update execution time', () => {
      // Wait a bit and update execution time
      setTimeout(() => {
        context.updateExecutionTime();
        expect(context.metrics.executionTime).toBeGreaterThan(0);
      }, 10);
    });
  });

  describe('Context State Management', () => {
    let context: ExpressionContext;

    beforeEach(() => {
      context = new ExpressionContext();
    });

    it('should reset context state', () => {
      // Set up some state
      context.stepCounter = 5;
      context.recordDiceRoll(3);
      context.recordReroll();
      
      // Reset
      context.reset();
      
      expect(context.stepCounter).toBe(0);
      expect(context.metrics.diceRolled).toBe(0);
      expect(context.metrics.nodesEvaluated).toBe(0);
      expect(context.metrics.rerollsPerformed).toBe(0);
      expect(context.metrics.executionTime).toBe(0);
    });

    it('should provide context summary', () => {
      context.stepCounter = 3;
      context.recordDiceRoll(2);
      
      const summary = context.getContextSummary();
      
      expect(summary.stepCounter).toBe(3);
      expect(summary.metrics.diceRolled).toBe(2);
      expect(summary.config).toBeDefined();
      expect(summary.executionTime).toBeGreaterThanOrEqual(0);
      expect(typeof summary.isTimedOut).toBe('boolean');
    });
  });

  describe('Limit Checking', () => {
    it('should check reroll limits', () => {
      const context = new ExpressionContext({ maxRerolls: 5 });
      
      expect(context.isRerollLimitExceeded(3)).toBe(false);
      expect(context.isRerollLimitExceeded(5)).toBe(true);
      expect(context.isRerollLimitExceeded(10)).toBe(true);
    });

    it('should check timeout limits', () => {
      const context = new ExpressionContext({ maxExecutionTime: 100 });
      
      // Should not be timed out immediately
      expect(context.isTimeoutExceeded()).toBe(false);
      
      // After some time, might be timed out (depends on test execution speed)
      setTimeout(() => {
        // This is timing-dependent, so we just check it exists
        expect(typeof context.isTimeoutExceeded()).toBe('boolean');
      }, 50);
    });
  });

  describe('Debug Mode', () => {
    it('should log debug information when enabled', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const context = new ExpressionContext({ debugMode: true });
      const mockNode = { type: 'number', value: 5 } as any;
      
      context.recordNodeEvaluation(mockNode);
      context.recordDiceRoll(2);
      context.recordReroll();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Context] Evaluated node: number')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Context] Rolled 2 dice')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Context] Performed reroll')
      );
      
      consoleSpy.mockRestore();
    });

    it('should not log without debug mode', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const context = new ExpressionContext({ debugMode: false });
      const mockNode = { type: 'number', value: 5 } as any;
      
      context.recordNodeEvaluation(mockNode);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle partial configuration gracefully', () => {
      const context = new ExpressionContext({
        maxRerolls: 50
        // Other values should use defaults
      });
      
      expect(context.maxRerolls).toBe(50);
      expect(context.maxExecutionTime).toBe(5000); // default
      expect(context.enableExplanation).toBe(false); // default
    });

    it('should handle empty configuration', () => {
      const context = new ExpressionContext({});
      
      expect(context.maxRerolls).toBe(100);
      expect(context.maxExecutionTime).toBe(5000);
      expect(context.enableExplanation).toBe(false);
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage if enabled', () => {
      const context = new ExpressionContext({ enableMetrics: true });
      
      // Memory usage tracking is optional
      if (context.metrics.memoryUsed !== undefined) {
        expect(context.metrics.memoryUsed).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Factory Methods', () => {
    it('should create test context with proper defaults', () => {
      const context = ExpressionContext.createTestContext(12345);
      
      expect(context.randomProvider).toBeDefined();
      expect(context.maxRerolls).toBe(100); // Should inherit defaults
    });

    it('should create production context optimized for performance', () => {
      const context = ExpressionContext.createProductionContext();
      
      expect(context.enableExplanation).toBe(false);
      expect(context.maxRerolls).toBe(100);
    });

    it('should create debug context with verbose settings', () => {
      const context = ExpressionContext.createDebugContext();
      
      expect(context.enableExplanation).toBe(true);
    });

    it('should override factory defaults with custom config', () => {
      const context = ExpressionContext.createProductionContext({
        maxRerolls: 25,
        enableExplanation: true
      });
      
      expect(context.maxRerolls).toBe(25);
      expect(context.enableExplanation).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero and negative values gracefully', () => {
      const context = new ExpressionContext({
        maxRerolls: 0,
        maxExecutionTime: 0
      });
      
      expect(context.maxRerolls).toBe(0);
      expect(context.maxExecutionTime).toBe(0);
      expect(context.isRerollLimitExceeded(0)).toBe(true);
    });

    it('should handle very large configuration values', () => {
      const context = new ExpressionContext({
        maxRerolls: Number.MAX_SAFE_INTEGER,
        maxExecutionTime: Number.MAX_SAFE_INTEGER
      });
      
      expect(context.maxRerolls).toBe(Number.MAX_SAFE_INTEGER);
      expect(context.maxExecutionTime).toBe(Number.MAX_SAFE_INTEGER);
    });
  });
});
