import { BaseCommand } from './BaseCommand';
import { ParsedFlags, FlagParser } from '../FlagParser';
import { OutputFormatter } from '../OutputFormatter';
import { Roller } from '../../Roller';

/**
 * Command to roll success pools for various game systems
 */
export class SuccessCommand extends BaseCommand {
  name = 'success';
  aliases = ['pool'];

  validate(args: string[]): void {
    this.validateMinArgs(args, 3, 'count, sides, and threshold (e.g., success 8 10 6)');
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      
      const [count, sides, threshold] = this.parseIntegers(
        args.slice(0, 3), 
        ['count', 'sides', 'threshold']
      );
      
      const roller = new Roller();
      const options = FlagParser.createSuccessPoolOptions(flags);
      
      const result = roller.rollSuccessPool(count, sides, threshold, options);
      
      OutputFormatter.formatSuccessPool(count, sides, threshold, result, flags.isVerbose);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Unknown error'), 'success');
    }
  }

  getHelp(): string {
    return `
success <count> <sides> <threshold>    Roll dice pool and count successes
  --botch <value>                      Value that counts as botch
  --double <value>                     Value that counts as double success
  --count-botches                      Subtract botches from successes

Examples:
  success 8 10 6                       Roll 8d10, count successes >= 6
  success 6 6 5 --verbose              Shadowrun-style pool with details
  success 5 10 7 --botch 1 --double 10 --count-botches  World of Darkness style
`;
  }
}
