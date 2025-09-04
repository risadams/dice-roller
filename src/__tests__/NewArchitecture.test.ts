import { Roller } from '../Roller';

describe('New Roller Architecture', () => {
  let roller: Roller;

  beforeEach(() => {
    // Use a predictable random function for testing
    roller = new Roller(() => 0.5);
  });

  describe('Basic Dice Rolling', () => {
    it('should roll single die', () => {
      const result = roller.rollDie(6);
      expect(result).toBe(4); // 0.5 * 6 = 3, floor = 3, +1 = 4
    });

    it('should roll multiple dice', () => {
      const results = roller.rollDice(2, 6);
      expect(results).toEqual([4, 4]);
    });

    it('should sum dice rolls', () => {
      const result = roller.rollSum(3, 6);
      expect(result).toBe(12); // 3 dice, each rolling 4
    });
  });

  describe('Advanced Mechanics', () => {
    it('should roll exploding dice', () => {
      // Use simple predictable roller for basic test
      const result = roller.rollExploding(1, 6);
      expect(result.result).toBeGreaterThan(0);
      expect(result.rolls).toHaveLength(1);
      expect(result.explosions).toBeGreaterThanOrEqual(0);
    });

    it('should roll penetrating dice', () => {
      const result = roller.rollPenetrating(2, 6);
      expect(result.result).toBeGreaterThan(0);
      expect(result.rolls).toHaveLength(2);
    });

    it('should roll compounding dice', () => {
      const result = roller.rollCompounding(2, 6);
      expect(result.result).toBeGreaterThan(0);
      expect(result.compoundedRolls).toHaveLength(2);
    });

    it('should roll step dice', () => {
      const result = roller.rollStepDice(6, 2); // d6 stepped up 2 = d10
      expect(result.finalDie).toBe(10);
      expect(result.modifier).toBe(0);
    });
  });

  describe('Keep/Drop Mechanics', () => {
    it('should keep highest dice', () => {
      const result = roller.rollKeepHighest(4, 6, 2);
      expect(result.kept).toHaveLength(2);
      expect(result.dropped).toHaveLength(2);
    });

    it('should drop lowest dice', () => {
      const result = roller.rollDropLowest(4, 6, 1);
      expect(result.kept).toHaveLength(3);
      expect(result.dropped).toHaveLength(1);
    });
  });

  describe('Success Pools', () => {
    it('should count successes', () => {
      const result = roller.rollSuccessPool(5, 10, 7);
      expect(result.successes).toBeGreaterThanOrEqual(0);
      expect(result.rolls).toHaveLength(5);
    });
  });

  describe('Expression Rolling', () => {
    it('should evaluate simple expressions', () => {
      const result = roller.rollExpression('2d6+3');
      expect(result).toBeGreaterThan(0);
    });

    it('should provide detailed expression results', () => {
      const result = roller.rollExpressionDetailed('2d6+3');
      expect(result.result).toBeGreaterThan(0);
      expect(result.expression).toBe('2d6+3');
      expect(result.parts).toBeDefined();
    });
  });

  describe('Advantage/Disadvantage', () => {
    it('should roll with advantage', () => {
      const result = roller.rollWithAdvantage(20);
      expect(result.rolls).toHaveLength(2);
      expect(result.result).toBe(Math.max(...result.rolls));
    });

    it('should roll with disadvantage', () => {
      const result = roller.rollWithDisadvantage(20);
      expect(result.rolls).toHaveLength(2);
      expect(result.result).toBe(Math.min(...result.rolls));
    });
  });
});
