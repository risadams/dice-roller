import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter, DiceRollOutput } from '../OutputFormatter';
import { Roller } from '../../Roller';

/**
 * Command to roll compounding dice
 */
export class CompoundingCommand extends BaseCommand {
  name = 'compounding';
  aliases = ['compound', 'comp'];

  validate(args: string[]): void {
    this.validateMinArgs(args, 2, 'count and sides (e.g., compounding 4 8)');
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      
      const [count, sides] = this.parseIntegers(
        args.slice(0, 2), 
        ['count', 'sides']
      );
      
      const roller = new Roller();
      const result = roller.rollCompounding(count, sides, flags.maxExplosions || 10);
      
      const output: DiceRollOutput = {
        result: result.result
      };

      if (flags.isVerbose) {
        output.verbose = {
          expression: `Rolling ${count}d${sides} with compounding`,
          details: [
            `🎯 Result: ${result.result}`,
            `🎲 Compounded dice: ${result.compoundedRolls.join(', ')}`,
            `💥 Total explosions: ${result.totalExplosions}`,
            `📋 All rolls: ${result.allRolls.map(rolls => `[${rolls.join(', ')}]`).join(', ')}`
          ]
        };
      }

      OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
    } catch (error) {
      this.handleAnyError(error, 'compounding');
    }
  }

  getHelp(): string {
    return `
compounding <count> <sides>      Roll compounding dice (explosions add to original die)
  --max-explosions <num>         Maximum number of explosions allowed

Examples:
  compounding 4 8                Roll 4d8 with compounding explosions
  compounding 2 10 --verbose     Roll 2d10 with detailed output
  compounding 3 6 --max-explosions 3  Limit explosions to 3
`;
  }
}
