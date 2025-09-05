import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter } from '../OutputFormatter';
import { DiceExpression } from '../../DiceExpression';

/**
 * Command to show statistics for dice expressions
 */
export class StatsCommand extends BaseCommand {
  name = 'stats';
  aliases = ['statistics', 'stat'];

  validate(args: string[]): void {
    this.validateMinArgs(args, 1, 'expression for statistics (e.g., "3d6")');
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      const expression = args[0];
      
      const stats = this.calculateStatistics(expression);
      OutputFormatter.formatStatistics(stats, expression);
    } catch (error) {
      this.handleAnyError(error, 'stats');
    }
  }

  /**
   * Calculate statistics for a dice expression by sampling
   */
  private calculateStatistics(expressionStr: string) {
    const expression = new DiceExpression(expressionStr);
    const samples = 10000;
    const results: number[] = [];
    const distribution: { [key: number]: number } = {};

    // Generate samples
    for (let i = 0; i < samples; i++) {
      const result = expression.evaluate();
      results.push(result);
      distribution[result] = (distribution[result] || 0) + 1;
    }

    // Calculate statistics
    const sum = results.reduce((a, b) => a + b, 0);
    const average = sum / samples;
    
    const sortedResults = [...results].sort((a, b) => a - b);
    const min = sortedResults[0];
    const max = sortedResults[sortedResults.length - 1];
    const median = sortedResults[Math.floor(samples / 2)];
    
    // Find mode(s)
    let maxCount = 0;
    const mode: number[] = [];
    Object.entries(distribution).forEach(([value, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mode.length = 0;
        mode.push(parseInt(value));
      } else if (count === maxCount) {
        mode.push(parseInt(value));
      }
    });

    // Calculate standard deviation
    const variance = results.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / samples;
    const standardDeviation = Math.sqrt(variance);

    return {
      min,
      max,
      average,
      median,
      mode,
      standardDeviation,
      distribution,
      samples
    };
  }

  getHelp(): string {
    return `
stats <expression>               Show statistics for dice expression

Examples:
  stats "3d6"                    Show statistics for 3d6
  stats "2d20+5"                 Show statistics for 2d20+5
  stats "4d6kh3"                 Show statistics for 4d6 keep highest 3
`;
  }
}
