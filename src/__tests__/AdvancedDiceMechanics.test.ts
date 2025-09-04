import { Roller } from '../Roller';

describe('Advanced Dice Mechanics', () => {
  let roller: Roller;

  beforeEach(() => {
    roller = new Roller();
  });

  describe('Penetrating Dice', () => {
    test('should handle normal rolls without penetration', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.33); // Roll 2 on d6 (0.33 * 6 = 1.98, floor = 1, +1 = 2)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollPenetrating(1, 6);

      expect(result.result).toBe(2);
      expect(result.rolls).toEqual([2]);
      expect(result.penetrations).toBe(0);
      expect(result.originalRolls).toEqual([2]);
    });

    test('should handle penetrating dice correctly', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Roll 6 on d6 (max)
        .mockReturnValueOnce(0.33); // Roll 2 on d6, becomes 1 (2-1)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollPenetrating(1, 6);

      expect(result.result).toBe(7); // 6 + 1 = 7
      expect(result.rolls).toEqual([6, 1]);
      expect(result.penetrations).toBe(1);
      expect(result.originalRolls).toEqual([6, 2]);
    });

    test('should stop penetration when roll becomes 0 or negative', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Roll 6 on d6 (max)
        .mockReturnValueOnce(0.0);  // Roll 1 on d6, becomes 0 (1-1)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollPenetrating(1, 6);

      expect(result.result).toBe(6); // Only the original 6
      expect(result.rolls).toEqual([6]);
      expect(result.penetrations).toBe(0);
    });

    test('should respect max explosions limit', () => {
      const mockRandom = jest.fn()
        .mockReturnValue(5/6); // Always roll max (6)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollPenetrating(1, 6, 2);

      expect(result.penetrations).toBe(2);
      expect(result.rolls.length).toBe(3); // Original + 2 penetrations (6, 5, 5)
      expect(result.result).toBe(16); // 6 + 5 + 5 = 16
      expect(result.originalRolls).toEqual([6, 6, 6]); // All original rolls were 6
    });
  });

  describe('Compounding Dice', () => {
    test('should handle normal rolls without compounding', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.33); // Roll 2 on d6
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollCompounding(1, 6);

      expect(result.result).toBe(2);
      expect(result.compoundedRolls).toEqual([2]);
      expect(result.totalExplosions).toBe(0);
      expect(result.allRolls).toEqual([[2]]);
    });

    test('should compound exploding dice correctly', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Roll 6 on d6 (max)
        .mockReturnValueOnce(5/6)   // Roll 6 on d6 (max again)
        .mockReturnValueOnce(0.33); // Roll 2 on d6 (no more explosion)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollCompounding(1, 6);

      expect(result.result).toBe(14); // 6 + 6 + 2 = 14 (all in one die)
      expect(result.compoundedRolls).toEqual([14]);
      expect(result.totalExplosions).toBe(2);
      expect(result.allRolls).toEqual([[6, 6, 2]]);
    });

    test('should handle multiple dice with compounding', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Die 1: Roll 6 (max)
        .mockReturnValueOnce(0.33)  // Die 1: Roll 2 (no more explosion)
        .mockReturnValueOnce(0.0);  // Die 2: Roll 1 (no explosion)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollCompounding(2, 6);

      expect(result.result).toBe(9); // (6+2) + 1 = 9
      expect(result.compoundedRolls).toEqual([8, 1]);
      expect(result.totalExplosions).toBe(1);
      expect(result.allRolls).toEqual([[6, 2], [1]]);
    });
  });

  describe('Extended Keep/Drop Mechanics', () => {
    describe('Drop Highest', () => {
      test('should drop highest dice correctly', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.33)  // Roll 2
          .mockReturnValueOnce(5/6);  // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollDropHighest(3, 6, 1);

        expect(result.result).toBe(3); // 1 + 2 = 3 (6 dropped)
        expect(result.kept).toEqual([2, 1]); // Sorted: kept lowest 2
        expect(result.dropped).toEqual([6]);
        expect(result.allRolls).toEqual([1, 2, 6]);
      });

      test('should throw error when dropping too many dice', () => {
        expect(() => {
          roller.rollDropHighest(3, 6, 3);
        }).toThrow('Cannot drop more dice than or equal to the number rolled');
      });
    });

    describe('Drop Lowest', () => {
      test('should drop lowest dice correctly', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.33)  // Roll 2
          .mockReturnValueOnce(5/6);  // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollDropLowest(3, 6, 1);

        expect(result.result).toBe(8); // 2 + 6 = 8 (1 dropped)
        expect(result.kept).toEqual([2, 6]); // Sorted: kept highest 2
        expect(result.dropped).toEqual([1]);
        expect(result.allRolls).toEqual([1, 2, 6]);
      });
    });

    describe('Keep Middle', () => {
      test('should keep middle dice correctly with odd number', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.16)  // Roll 1 (0.16 * 6 = 0.96, floor = 0, +1 = 1)
          .mockReturnValueOnce(0.33)  // Roll 2 (0.33 * 6 = 1.98, floor = 1, +1 = 2)
          .mockReturnValueOnce(0.5)   // Roll 3 (0.5 * 6 = 3, floor = 3, +1 = 4) - wait, I need this to be 3
          .mockReturnValueOnce(5/6);  // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollKeepMiddle(5, 6, 3);

        // Actual rolls: [1, 1, 2, 4, 6]
        // Sorted: [1, 1, 2, 4, 6]
        // Keep middle 3: drop 1 from each end -> [1, 2, 4]
        expect(result.result).toBe(7); // 1 + 2 + 4 = 7
        expect(result.kept).toEqual([1, 2, 4]); // Middle 3 dice
        expect(result.dropped).toEqual([1, 6]); // Highest and lowest
        expect(result.allRolls).toEqual([1, 1, 2, 4, 6]);
      });

      test('should keep all dice when keep equals count', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.99); // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollKeepMiddle(2, 6, 2);

        expect(result.result).toBe(7); // 1 + 6 = 7
        expect(result.kept).toEqual([1, 6]);
        expect(result.dropped).toEqual([]);
        expect(result.allRolls).toEqual([1, 6]);
      });
    });

    describe('Keep Conditional', () => {
      test('should keep dice above threshold', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.33)  // Roll 2
          .mockReturnValueOnce(0.66)  // Roll 4
          .mockReturnValueOnce(0.99); // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollKeepConditional(4, 6, 'above', 3);

        expect(result.result).toBe(10); // 4 + 6 = 10
        expect(result.kept).toEqual([4, 6]);
        expect(result.dropped).toEqual([1, 2]);
        expect(result.allRolls).toEqual([1, 2, 4, 6]);
      });

      test('should keep dice below threshold', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.33)  // Roll 2
          .mockReturnValueOnce(0.66)  // Roll 4
          .mockReturnValueOnce(0.99); // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollKeepConditional(4, 6, 'below', 3);

        expect(result.result).toBe(3); // 1 + 2 = 3
        expect(result.kept).toEqual([1, 2]);
        expect(result.dropped).toEqual([4, 6]);
        expect(result.allRolls).toEqual([1, 2, 4, 6]);
      });

      test('should keep dice equal to threshold', () => {
        const mockRandom = jest.fn()
          .mockReturnValueOnce(0.0)   // Roll 1
          .mockReturnValueOnce(0.16)  // Roll 1
          .mockReturnValueOnce(0.33)  // Roll 2
          .mockReturnValueOnce(5/6);  // Roll 6
        
        const testRoller = new Roller(mockRandom);
        const result = testRoller.rollKeepConditional(4, 6, 'equal', 1);

        expect(result.result).toBe(2); // 1 + 1 = 2
        expect(result.kept).toEqual([1, 1]);
        expect(result.dropped).toEqual([2, 6]);
        expect(result.allRolls).toEqual([1, 1, 2, 6]);
      });
    });
  });

  describe('Step Dice System (Savage Worlds)', () => {
    test('should handle base dice without steps', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.33); // Roll 2 on d6
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(6, 0);

      expect(result.result).toBe(2);
      expect(result.finalDie).toBe(6);
      expect(result.modifier).toBe(0);
      expect(result.rolled).toBe(2);
      expect(result.aced).toBe(false);
    });

    test('should step dice up correctly', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.375); // Roll 4 on d8 (0.375 * 8 = 3, floor = 3, +1 = 4)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(6, 1); // d6 -> d8

      expect(result.result).toBe(4);
      expect(result.finalDie).toBe(8);
      expect(result.modifier).toBe(0);
      expect(result.rolled).toBe(4);
      expect(result.aced).toBe(false);
    });

    test('should step dice down correctly', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.0); // Roll 1 on d4
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(6, -1); // d6 -> d4

      expect(result.result).toBe(1);
      expect(result.finalDie).toBe(4);
      expect(result.modifier).toBe(0);
      expect(result.rolled).toBe(1);
      expect(result.aced).toBe(false);
    });

    test('should handle stepping above d12 with modifier', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.33); // Roll 4 on d12 (0.33 * 12 = 3.96, floor = 3, +1 = 4)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(12, 2); // d12 -> d12+2

      expect(result.result).toBe(6); // 4 + 2 = 6
      expect(result.finalDie).toBe(12);
      expect(result.modifier).toBe(2);
      expect(result.rolled).toBe(4);
      expect(result.aced).toBe(false);
    });

    test('should handle stepping below d4 with penalty', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.0); // Roll 1 on d4
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(4, -2); // d4 -> d4-2

      expect(result.result).toBe(1); // Max(1, 1-2) = 1 (minimum is 1)
      expect(result.finalDie).toBe(4);
      expect(result.modifier).toBe(-2);
      expect(result.rolled).toBe(1);
      expect(result.aced).toBe(false);
    });

    test('should handle "Aces" (exploding dice)', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Roll 6 on d6 (ace!)
        .mockReturnValueOnce(5/6)   // Roll 6 on d6 (ace again!)
        .mockReturnValueOnce(0.33); // Roll 2 on d6 (no more ace)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(6, 0);

      expect(result.result).toBe(14); // 6 + 6 + 2 = 14
      expect(result.finalDie).toBe(6);
      expect(result.modifier).toBe(0);
      expect(result.rolled).toBe(14);
      expect(result.aced).toBe(true);
      expect(result.aceRolls).toEqual([6, 6, 2]);
    });

    test('should throw error for invalid base die', () => {
      expect(() => {
        roller.rollStepDice(7, 0); // d7 is not valid
      }).toThrow('Invalid base die: d7. Must be one of: d4, d6, d8, d10, d12');
    });

    test('should handle multiple step progression', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.3); // Roll 4 on d10 (0.3 * 10 = 3, floor = 3, +1 = 4)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollStepDice(4, 3); // d4 -> d6 -> d8 -> d10

      expect(result.result).toBe(4);
      expect(result.finalDie).toBe(10);
      expect(result.modifier).toBe(0);
      expect(result.rolled).toBe(4);
      expect(result.aced).toBe(false);
    });
  });

  describe('Integration with Existing Systems', () => {
    test('penetrating dice should work with multiple dice', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Die 1: Roll 6 (max)
        .mockReturnValueOnce(0.16)  // Die 1: Roll 1, becomes 0 (stops)
        .mockReturnValueOnce(0.0);  // Die 2: Roll 1 (no penetration)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollPenetrating(2, 6);

      expect(result.result).toBe(7); // 6 + 1 = 7
      expect(result.penetrations).toBe(0); // No penetrations because second roll became 0
      expect(result.rolls.length).toBe(2); // 6, 1
    });

    test('compounding dice should work with multiple dice', () => {
      const mockRandom = jest.fn()
        .mockReturnValueOnce(5/6)   // Die 1: Roll 6 (max)
        .mockReturnValueOnce(0.33)  // Die 1: Roll 2 (compound to 8)
        .mockReturnValueOnce(0.0);  // Die 2: Roll 1 (no compound)
      
      const testRoller = new Roller(mockRandom);
      const result = testRoller.rollCompounding(2, 6);

      expect(result.result).toBe(9); // 8 + 1 = 9
      expect(result.compoundedRolls).toEqual([8, 1]);
      expect(result.totalExplosions).toBe(1);
    });
  });
});
