import { Roller } from '../Roller';

describe('Roller', () => {
  describe('basic rolling', () => {
    it('should roll a single die', () => {
      const roller = new Roller();
      const result = roller.rollDie(6);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('should roll multiple dice', () => {
      const roller = new Roller();
      const results = roller.rollDice(3, 6);
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(6);
      });
    });

    it('should calculate sum of multiple dice', () => {
      const roller = new Roller();
      const sum = roller.rollSum(3, 6);
      expect(sum).toBeGreaterThanOrEqual(3);
      expect(sum).toBeLessThanOrEqual(18);
    });
  });

  describe('expression rolling', () => {
    it('should roll dice expressions', () => {
      const roller = new Roller();
      const result = roller.rollExpression('3d6+5');
      expect(result).toBeGreaterThanOrEqual(8);
      expect(result).toBeLessThanOrEqual(23);
    });

    it('should provide detailed expression results', () => {
      const roller = new Roller();
      const result = roller.rollExpressionDetailed('2d6+3');
      
      expect(result.result).toBeGreaterThanOrEqual(5);
      expect(result.result).toBeLessThanOrEqual(15);
      expect(result.expression).toBe('2d6+3');
      expect(result.minValue).toBe(5);
      expect(result.maxValue).toBe(15);
      expect(result.parts).toHaveLength(3);
    });
  });

  describe('standard dice', () => {
    it('should roll standard RPG dice set', () => {
      const roller = new Roller();
      const results = roller.rollStandard();
      
      expect(results.d4).toBeGreaterThanOrEqual(1);
      expect(results.d4).toBeLessThanOrEqual(4);
      expect(results.d6).toBeGreaterThanOrEqual(1);
      expect(results.d6).toBeLessThanOrEqual(6);
      expect(results.d20).toBeGreaterThanOrEqual(1);
      expect(results.d20).toBeLessThanOrEqual(20);
      expect(results.d100).toBeGreaterThanOrEqual(1);
      expect(results.d100).toBeLessThanOrEqual(100);
    });
  });

  describe('advantage/disadvantage', () => {
    it('should roll with advantage', () => {
      const roller = new Roller();
      const result = roller.rollWithAdvantage(20);
      
      expect(result.result).toBeGreaterThanOrEqual(1);
      expect(result.result).toBeLessThanOrEqual(20);
      expect(result.rolls).toHaveLength(2);
      expect(result.result).toBe(Math.max(...result.rolls));
    });

    it('should roll with disadvantage', () => {
      const roller = new Roller();
      const result = roller.rollWithDisadvantage(20);
      
      expect(result.result).toBeGreaterThanOrEqual(1);
      expect(result.result).toBeLessThanOrEqual(20);
      expect(result.rolls).toHaveLength(2);
      expect(result.result).toBe(Math.min(...result.rolls));
    });
  });

  describe('keep highest/lowest', () => {
    it('should keep highest dice', () => {
      const roller = new Roller();
      const result = roller.rollKeepHighest(4, 6, 3);
      
      expect(result.kept).toHaveLength(3);
      expect(result.dropped).toHaveLength(1);
      expect(result.result).toBe(result.kept.reduce((sum, die) => sum + die, 0));
      
      // Verify kept dice are higher than dropped dice
      const minKept = Math.min(...result.kept);
      const maxDropped = Math.max(...result.dropped);
      expect(minKept).toBeGreaterThanOrEqual(maxDropped);
    });

    it('should keep lowest dice', () => {
      const roller = new Roller();
      const result = roller.rollKeepLowest(4, 6, 2);
      
      expect(result.kept).toHaveLength(2);
      expect(result.dropped).toHaveLength(2);
      expect(result.result).toBe(result.kept.reduce((sum, die) => sum + die, 0));
      
      // Verify kept dice are lower than dropped dice
      const maxKept = Math.max(...result.kept);
      const minDropped = Math.min(...result.dropped);
      expect(maxKept).toBeLessThanOrEqual(minDropped);
    });

    it('should throw error when trying to keep more dice than rolled', () => {
      const roller = new Roller();
      expect(() => roller.rollKeepHighest(3, 6, 5)).toThrow();
      expect(() => roller.rollKeepLowest(3, 6, 5)).toThrow();
    });
  });

  describe('exploding dice', () => {
    it('should handle exploding dice', () => {
      // Create a roller with controlled random values
      let callIndex = 0;
      const values = [5/6, 2/6, 0/6]; // Will roll 6 (explode), 3, 1
      const mockRandom = () => values[callIndex++] || 0;

      const roller = new Roller(mockRandom);
      const result = roller.rollExploding(2, 6);
      
      expect(result.rolls).toHaveLength(3); // 2 initial + 1 explosion
      expect(result.explosions).toBe(1);
      expect(result.result).toBe(6 + 3 + 1); // 10
    });

    it('should limit explosions', () => {
      // Create a roller that always rolls max value
      const mockRandom = () => 5/6; // Always roll 6
      
      const roller = new Roller(mockRandom);
      const result = roller.rollExploding(1, 6, 3); // Limit to 3 explosions
      
      expect(result.explosions).toBe(3);
      expect(result.rolls).toHaveLength(4); // 1 initial + 3 explosions
    });
  });

  describe('statistics', () => {
    it('should generate statistics for expressions', () => {
      const roller = new Roller();
      const stats = roller.getStatistics('3d6', 1000);
      
      expect(stats.mean).toBeCloseTo(10.5, 0.5);
      expect(stats.min).toBeGreaterThanOrEqual(3);
      expect(stats.max).toBeLessThanOrEqual(18);
      expect(stats.standardDeviation).toBeGreaterThan(0);
      expect(Object.keys(stats.distribution)).toContain('10');
    });
  });

  describe('custom random function', () => {
    it('should use custom random function', () => {
      let callCount = 0;
      const customRandom = () => {
        callCount++;
        return 0.5; // Always return middle value
      };

      const roller = new Roller(customRandom);
      const result = roller.rollDie(6);
      
      expect(result).toBe(4); // 0.5 * 6 + 1 = 4
      expect(callCount).toBe(1);
    });
  });
});
