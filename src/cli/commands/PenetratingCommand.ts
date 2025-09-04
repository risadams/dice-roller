import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter, DiceRollOutput } from '../OutputFormatter';
import { Roller } from '../../Roller';

/**
 * Command to roll penetrating dice (Savage Worlds style)
 */
export class PenetratingCommand extends BaseCommand {
  name = 'penetrating';
  aliases = ['penetrate', 'pen'];

  validate(args: string[]): void {
    this.validateMinArgs(args, 2, 'count and sides (e.g., penetrating 3 6)');
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      
      const [count, sides] = this.parseIntegers(
        args.slice(0, 2), 
        ['count', 'sides']
      );
      
      const roller = new Roller();
      const result = roller.rollPenetrating(count, sides, flags.maxExplosions || 10);
      
      const output: DiceRollOutput = {
        result: result.result
      };

      if (flags.isVerbose) {
        output.verbose = {
          expression: `Rolling ${count}d${sides} with penetrating`,
          details: [
            `🎯 Result: ${result.result}`,
            `🎲 Rolls: ${result.rolls.join(', ')}`,
            `💥 Penetrations: ${result.penetrations}`,
            `� Original rolls: ${result.originalRolls.join(', ')}`
          ]
        };
      }

      OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Unknown error'), 'penetrating');
    }
  }

  getHelp(): string {
    return `
penetrating <count> <sides>      Roll penetrating dice (Savage Worlds style)
  --max-explosions <num>         Maximum number of explosions allowed

Examples:
  penetrating 3 6                Roll 3d6 with penetrating dice
  penetrating 2 8 --verbose      Roll 2d8 with detailed output
  penetrating 4 10 --max-explosions 5  Limit explosions to 5
`;
  }
}
