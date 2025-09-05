import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter, DiceRollOutput } from '../OutputFormatter';
import { Roller } from '../../Roller';

/**
 * Command to roll step dice (Savage Worlds style)
 */
export class StepCommand extends BaseCommand {
  name = 'step';
  aliases = ['savage'];

  validate(args: string[]): void {
    this.validateMinArgs(args, 2, 'base die and steps (e.g., step 6 2)');
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      
      const [baseDie, steps] = this.parseIntegers(
        args.slice(0, 2), 
        ['base die', 'steps']
      );
      
      const roller = new Roller();
      const result = roller.rollStepDice(baseDie, steps);
      
      const output: DiceRollOutput = {
        result: result.result
      };

      if (flags.isVerbose) {
        const stepsDisplay = steps >= 0 ? `+${steps}` : `${steps}`;
        output.verbose = {
          expression: `Rolling d${baseDie} ${stepsDisplay} steps`,
          details: [
            `🎯 Result: ${result.result}`,
            `🎲 Final die: d${result.finalDie}${result.modifier !== 0 ? (result.modifier > 0 ? `+${result.modifier}` : `${result.modifier}`) : ''}`,
            `📊 Base roll: ${result.rolled}`,
            result.aced ? `💥 Aced! Ace rolls: ${result.aceRolls?.join(', ')}` : '🚫 No ace'
          ]
        };
      }

      OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
    } catch (error) {
      this.handleAnyError(error, 'step');
    }
  }

  getHelp(): string {
    return `
step <die> <steps>               Roll step dice (Savage Worlds style)

Examples:
  step 6 2                       Step up d6 by 2 steps (becomes d10)
  step 8 -1                      Step down d8 by 1 step (becomes d6)
  step 12 3                      Step up d12 by 3 steps (becomes d12+3)
  step 4 -2 --verbose            Step down d4 by 2 with details
`;
  }
}
