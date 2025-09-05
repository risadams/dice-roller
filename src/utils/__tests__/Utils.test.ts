/**
 * Unit tests for the utils module to ensure all utility functions work correctly
 */

import {
  NumberUtils,
  ArrayUtils,
  StringUtils,
  ConsoleUtils,
  TestUtils,
  DiceConstants,
  DiceValidation
} from '../index';

describe('Utils Module', () => {
  describe('NumberUtils', () => {
    test('safeParseInt should parse valid integers', () => {
      expect(NumberUtils.safeParseInt('42', 'test')).toBe(42);
      expect(NumberUtils.safeParseInt('-10', 'test')).toBe(-10);
    });

    test('safeParseInt should throw for invalid input', () => {
      expect(() => NumberUtils.safeParseInt('abc', 'test')).toThrow('test must be a valid number');
    });

    test('clamp should constrain values to range', () => {
      expect(NumberUtils.clamp(5, 1, 10)).toBe(5);
      expect(NumberUtils.clamp(-5, 1, 10)).toBe(1);
      expect(NumberUtils.clamp(15, 1, 10)).toBe(10);
    });

    test('statistical functions should work correctly', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(NumberUtils.sum(numbers)).toBe(15);
      expect(NumberUtils.average(numbers)).toBe(3);
      expect(NumberUtils.median(numbers)).toBe(3);
    });

    test('percentage should calculate correctly', () => {
      expect(NumberUtils.percentage(25, 100)).toBe(25);
      expect(NumberUtils.percentage(1, 3)).toBe(33.33);
    });
  });

  describe('ArrayUtils', () => {
    test('sortNumbers should sort correctly', () => {
      const numbers = [3, 1, 4, 1, 5];
      expect(ArrayUtils.sortNumbers(numbers)).toEqual([1, 1, 3, 4, 5]);
      expect(ArrayUtils.sortNumbers(numbers, false)).toEqual([5, 4, 3, 1, 1]);
    });

    test('topN and bottomN should work correctly', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(ArrayUtils.topN(numbers, 3)).toEqual([5, 4, 3]);
      expect(ArrayUtils.bottomN(numbers, 3)).toEqual([1, 2, 3]);
    });

    test('dropHighest and dropLowest should work correctly', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(ArrayUtils.dropHighest(numbers, 2)).toEqual([1, 2, 3]);
      expect(ArrayUtils.dropLowest(numbers, 2)).toEqual([3, 4, 5]);
    });

    test('unique should remove duplicates', () => {
      expect(ArrayUtils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    test('countOccurrences should count correctly', () => {
      const counts = ArrayUtils.countOccurrences([1, 2, 2, 3, 3, 3]);
      expect(counts.get(1)).toBe(1);
      expect(counts.get(2)).toBe(2);
      expect(counts.get(3)).toBe(3);
    });
  });

  describe('StringUtils', () => {
    test('capitalize should capitalize first letter', () => {
      expect(StringUtils.capitalize('hello')).toBe('Hello');
      expect(StringUtils.capitalize('WORLD')).toBe('WORLD');
    });

    test('pluralize should handle basic pluralization', () => {
      expect(StringUtils.pluralize('die', 1)).toBe('die');
      expect(StringUtils.pluralize('die', 2)).toBe('dies');
      expect(StringUtils.pluralize('success', 1)).toBe('success');
      expect(StringUtils.pluralize('success', 2)).toBe('successes');
    });

    test('ordinal should add correct suffixes', () => {
      expect(StringUtils.ordinal(1)).toBe('1st');
      expect(StringUtils.ordinal(2)).toBe('2nd');
      expect(StringUtils.ordinal(3)).toBe('3rd');
      expect(StringUtils.ordinal(4)).toBe('4th');
      expect(StringUtils.ordinal(21)).toBe('21st');
    });

    test('grammarJoin should join properly', () => {
      expect(StringUtils.grammarJoin(['a'])).toBe('a');
      expect(StringUtils.grammarJoin(['a', 'b'])).toBe('a and b');
      expect(StringUtils.grammarJoin(['a', 'b', 'c'])).toBe('a, b, and c');
    });

    test('isInteger and isFloat should validate correctly', () => {
      expect(StringUtils.isInteger('42')).toBe(true);
      expect(StringUtils.isInteger('42.5')).toBe(false);
      expect(StringUtils.isFloat('42.5')).toBe(true);
      expect(StringUtils.isFloat('abc')).toBe(false);
    });
  });

  describe('ConsoleUtils', () => {
    test('should have color constants', () => {
      expect(ConsoleUtils.Colors.Red).toBe('\x1b[31m');
      expect(ConsoleUtils.Colors.Green).toBe('\x1b[32m');
      expect(ConsoleUtils.Colors.Reset).toBe('\x1b[0m');
    });

    test('should have symbol constants', () => {
      expect(ConsoleUtils.Symbols.dice).toBe('🎲');
      expect(ConsoleUtils.Symbols.success).toBe('✅');
      expect(ConsoleUtils.Symbols.failure).toBe('❌');
    });

    test('colorize should wrap text with color codes', () => {
      const colored = ConsoleUtils.colorize('test', 'Red');
      expect(colored).toBe('\x1b[31mtest\x1b[0m');
    });
  });

  describe('TestUtils', () => {
    test('createSequentialMock should return values in sequence', () => {
      const mock = TestUtils.createSequentialMock([0.1, 0.5, 0.9]);
      expect(mock()).toBe(0.1);
      expect(mock()).toBe(0.5);
      expect(mock()).toBe(0.9);
      expect(mock()).toBe(0.1); // Should cycle back
    });

    test('createConstantMock should always return same value', () => {
      const mock = TestUtils.createConstantMock(0.5);
      expect(mock()).toBe(0.5);
      expect(mock()).toBe(0.5);
      expect(mock()).toBe(0.5);
    });

    test('withMockedRandom should mock and restore', () => {
      const originalRandom = Math.random;
      const result = TestUtils.withMockedRandom(
        () => 0.5,
        () => Math.random()
      );
      expect(result).toBe(0.5);
      expect(Math.random).toBe(originalRandom);
    });

    test('generateTestRolls should generate valid rolls', () => {
      const rolls = TestUtils.generateTestRolls(10, 6, 12345);
      expect(rolls).toHaveLength(10);
      rolls.forEach(roll => {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
      });
    });

    test('deepEqual should compare objects correctly', () => {
      expect(TestUtils.deepEqual({ a: 1 }, { a: 1 })).toBe(true);
      expect(TestUtils.deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(TestUtils.deepEqual([1, 2], [1, 2])).toBe(true);
      expect(TestUtils.deepEqual([1, 2], [2, 1])).toBe(false);
    });

    test('measureTime should measure execution time', () => {
      const { result, timeMs } = TestUtils.measureTime(() => {
        let sum = 0;
        for (let i = 0; i < 1000; i++) sum += i;
        return sum;
      });
      
      expect(result).toBe(499500);
      expect(timeMs).toBeGreaterThan(0);
    });
  });

  describe('DiceConstants', () => {
    test('should have standard dice values', () => {
      expect(DiceConstants.STANDARD_DICE).toEqual([4, 6, 8, 10, 12, 20, 100]);
      expect(DiceConstants.MIN_DICE_SIDES).toBe(2);
      expect(DiceConstants.MAX_DICE_SIDES).toBe(1000);
    });

    test('should have dice face unicode characters', () => {
      expect(DiceConstants.DICE_FACES[1]).toBe('⚀');
      expect(DiceConstants.DICE_FACES[6]).toBe('⚅');
    });

    test('should have common expressions', () => {
      expect(DiceConstants.COMMON_EXPRESSIONS).toContain('d20');
      expect(DiceConstants.COMMON_EXPRESSIONS).toContain('3d6');
    });
  });

  describe('DiceValidation', () => {
    test('validateDiceCount should validate dice count', () => {
      expect(() => DiceValidation.validateDiceCount(5)).not.toThrow();
      expect(() => DiceValidation.validateDiceCount(0)).toThrow('Dice count must be an integer between 1 and 1000');
      expect(() => DiceValidation.validateDiceCount(1001)).toThrow('Dice count must be an integer between 1 and 1000');
    });

    test('validateDiceSides should validate dice sides', () => {
      expect(() => DiceValidation.validateDiceSides(6)).not.toThrow();
      expect(() => DiceValidation.validateDiceSides(1)).toThrow('Dice sides must be an integer between 2 and 1000');
      expect(() => DiceValidation.validateDiceSides(1001)).toThrow('Dice sides must be an integer between 2 and 1000');
    });

    test('validateThreshold should validate threshold range', () => {
      expect(() => DiceValidation.validateThreshold(3, 6)).not.toThrow();
      expect(() => DiceValidation.validateThreshold(0, 6)).toThrow('Threshold 0 must be between 1 and 6');
      expect(() => DiceValidation.validateThreshold(7, 6)).toThrow('Threshold 7 must be between 1 and 6');
    });

    test('validateExplosionLimit should validate explosion limits', () => {
      expect(() => DiceValidation.validateExplosionLimit(10)).not.toThrow();
      expect(() => DiceValidation.validateExplosionLimit(0)).toThrow('Explosion limit must be an integer between 1 and 1000');
      expect(() => DiceValidation.validateExplosionLimit(1001)).toThrow('Explosion limit must be an integer between 1 and 1000');
    });
  });
});
