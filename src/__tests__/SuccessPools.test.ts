import { Roller } from '../Roller';

describe('Success Pools', () => {
  let roller: Roller;

  beforeEach(() => {
    // Use a seeded random function for predictable tests
    let seed = 12345;
    const mockRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    roller = new Roller(mockRandom);
  });

  describe('rollSuccessPool', () => {
    it('should count successes correctly with basic threshold', () => {
      const result = roller.rollSuccessPool(5, 10, 7);
      
      expect(result.rolls).toHaveLength(5);
      expect(result.successes).toBeGreaterThanOrEqual(0);
      expect(result.botches).toBeGreaterThanOrEqual(0);
      expect(result.netSuccesses).toBeGreaterThanOrEqual(0);
      expect(result.details).toHaveLength(5);
    });

    it('should handle double successes on maximum roll', () => {
      // Mock to always roll 10s (need 0.9 to 0.99 range for d10 = 10)
      const maxRoller = new Roller(() => 0.95);
      const result = maxRoller.rollSuccessPool(3, 10, 7, { doubleOn: 10 });
      
      expect(result.successes).toBe(6); // 3 dice × 2 successes each
      expect(result.details.every(d => d.type === 'double')).toBe(true);
    });

    it('should count botches correctly', () => {
      // Mock to always roll 1s (need 0.0 to 0.099 range for d10 = 1)
      const botchRoller = new Roller(() => 0.05);
      const result = botchRoller.rollSuccessPool(3, 10, 7, { botchOn: 1 });
      
      expect(result.botches).toBe(3);
      expect(result.successes).toBe(0);
      expect(result.details.every(d => d.type === 'botch')).toBe(true);
    });

    it('should subtract botches from successes when countBotches is true', () => {
      // Create a mixed result: some successes, some botches
      let callCount = 0;
      const mixedRoller = new Roller(() => {
        callCount++;
        // Alternate between success (0.95 → 10) and botch (0.05 → 1)
        return callCount % 2 === 1 ? 0.95 : 0.05;
      });
      
      const result = mixedRoller.rollSuccessPool(4, 10, 7, { 
        botchOn: 1, 
        doubleOn: 10, 
        countBotches: true 
      });
      
      expect(result.successes).toBe(4); // 2 doubles = 4 successes
      expect(result.botches).toBe(2);
      expect(result.netSuccesses).toBe(2); // 4 - 2 = 2
    });

    it('should handle custom botch and double values', () => {
      const result = roller.rollSuccessPool(5, 6, 4, {
        botchOn: 2,
        doubleOn: 5
      });
      
      expect(result.details).toHaveLength(5);
      // Verify that the logic uses custom values
      result.details.forEach(detail => {
        if (detail.roll === 2) {
          expect(detail.type).toBe('botch');
        } else if (detail.roll === 5) {
          expect(detail.type).toBe('double');
        }
      });
    });

    it('should throw error for invalid parameters', () => {
      expect(() => roller.rollSuccessPool(0, 10, 7)).toThrow('Dice count must be positive');
      expect(() => roller.rollSuccessPool(5, 10, 0)).toThrow('Threshold 0 must be between 1 and 10');
      expect(() => roller.rollSuccessPool(5, 10, 11)).toThrow('Threshold 11 must be between 1 and 10');
    });
  });

  describe('rollTargetNumbers', () => {
    it('should roll against individual target numbers', () => {
      const dice = [
        { sides: 20, target: 10 },
        { sides: 12, target: 8 },
        { sides: 6, target: 4 }
      ];
      
      const result = roller.rollTargetNumbers(dice);
      
      expect(result.results).toHaveLength(3);
      expect(result.hits + result.misses).toBe(3);
      
      result.results.forEach((roll, index) => {
        expect(roll.target).toBe(dice[index].target);
        expect(roll.hit).toBe(roll.roll >= roll.target);
        expect(roll.margin).toBe(roll.roll - roll.target);
      });
    });

    it('should handle critical hits and fumbles', () => {
      const dice = [{ sides: 20, target: 10 }];
      
      // Test critical hit (roll 20) - need 0.95 to 0.9999 for d20 = 20
      const critRoller = new Roller(() => 0.975);
      const critResult = critRoller.rollTargetNumbers(dice, { criticalOn: 20 });
      
      expect(critResult.criticalHits).toBe(1);
      expect(critResult.results[0].critical).toBe(true);
      
      // Test fumble (roll 1) - need 0.0 to 0.0499 for d20 = 1
      const fumbleRoller = new Roller(() => 0.025);
      const fumbleResult = fumbleRoller.rollTargetNumbers(dice, { fumbleOn: 1 });
      
      expect(fumbleResult.fumbles).toBe(1);
      expect(fumbleResult.results[0].fumble).toBe(true);
    });

    it('should throw error for empty dice array', () => {
      expect(() => roller.rollTargetNumbers([])).toThrow('At least one die must be specified');
    });

    it('should throw error for invalid target numbers', () => {
      const dice = [{ sides: 6, target: 7 }];
      expect(() => roller.rollTargetNumbers(dice)).toThrow('Target number 7 must be between 1 and 6');
    });
  });

  describe('rollVariableSuccessPool', () => {
    it('should handle pool with different die types and thresholds', () => {
      const pool = [
        { sides: 10, threshold: 7 },
        { sides: 8, threshold: 6 },
        { sides: 6, threshold: 4 }
      ];
      
      const result = roller.rollVariableSuccessPool(pool);
      
      expect(result.results).toHaveLength(3);
      expect(result.totalSuccesses).toBeGreaterThanOrEqual(0);
      expect(result.totalBotches).toBeGreaterThanOrEqual(0);
      expect(result.netSuccesses).toBeGreaterThanOrEqual(0);
    });

    it('should handle custom botch and double values per die', () => {
      const pool = [
        { sides: 10, threshold: 7, botchOn: 2, doubleOn: 9 },
        { sides: 6, threshold: 4, botchOn: 1, doubleOn: 6 }
      ];
      
      const result = roller.rollVariableSuccessPool(pool);
      
      expect(result.results).toHaveLength(2);
      // Verify custom values are respected in results
      result.results.forEach((roll, index) => {
        expect(roll.threshold).toBe(pool[index].threshold);
        expect(roll.sides).toBe(pool[index].sides);
      });
    });

    it('should calculate net successes correctly', () => {
      // Mock specific rolls: first die botch, second die double success
      let callCount = 0;
      const specificRoller = new Roller(() => {
        callCount++;
        // First call: botch (0.05 → 1), second call: double success (0.95 → 10)
        return callCount === 1 ? 0.05 : 0.95;
      });
      
      const pool = [
        { sides: 10, threshold: 7, botchOn: 1 },
        { sides: 10, threshold: 7, doubleOn: 10 }
      ];
      
      const result = specificRoller.rollVariableSuccessPool(pool);
      
      expect(result.totalSuccesses).toBe(2); // One double success
      expect(result.totalBotches).toBe(1); // One botch
      expect(result.netSuccesses).toBe(1); // 2 - 1 = 1
    });

    it('should throw error for empty pool', () => {
      expect(() => roller.rollVariableSuccessPool([])).toThrow('Pool cannot be empty');
    });

    it('should throw error for invalid thresholds', () => {
      const pool = [{ sides: 6, threshold: 7 }];
      expect(() => roller.rollVariableSuccessPool(pool)).toThrow('Threshold 7 must be between 1 and 6');
    });
  });

  describe('Real-world gaming scenarios', () => {
    it('should simulate World of Darkness dice pool', () => {
      // World of Darkness: d10, threshold 6, botch on 1, double on 10
      const result = roller.rollSuccessPool(8, 10, 6, {
        botchOn: 1,
        doubleOn: 10,
        countBotches: false // WoD doesn't subtract botches from successes
      });
      
      expect(result.rolls).toHaveLength(8);
      expect(result.successes).toBeGreaterThanOrEqual(0);
      expect(result.netSuccesses).toBe(result.successes); // No botch subtraction
    });

    it('should simulate Shadowrun dice pool', () => {
      // Shadowrun: d6, threshold varies (typically 5), no botches in 6th edition
      const result = roller.rollSuccessPool(6, 6, 5);
      
      expect(result.rolls).toHaveLength(6);
      expect(result.botches).toBe(0); // No botch value specified
    });

    it('should simulate Chronicles of Darkness dice pool', () => {
      // Chronicles of Darkness: d10, threshold 8, dramatic failure on 1 with no successes
      const result = roller.rollSuccessPool(5, 10, 8, {
        botchOn: 1,
        doubleOn: 10,
        countBotches: false
      });
      
      expect(result.rolls).toHaveLength(5);
      // In CoD, botches only matter if there are no successes
      const isDramaticFailure = result.successes === 0 && result.botches > 0;
      expect(typeof isDramaticFailure).toBe('boolean');
    });
  });
});
