import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter, DiceRollOutput } from '../OutputFormatter';
import { DicePresets } from '../../CustomDie';

/**
 * Command to roll custom dice presets
 */
export class CustomDiceCommand extends BaseCommand {
  name = 'custom';
  aliases = [];

  validate(args: string[]): void {
    // Validation handled per subcommand
  }

  execute(args: string[], flags: ParsedFlags): void {
    if (args.length === 0) {
      OutputFormatter.formatError('Please specify a custom die type: scrum, fibonacci, coin, magic8, yesno');
      return;
    }

    const diceType = args[0].toLowerCase();
    
    try {
      switch (diceType) {
        case 'scrum':
          this.rollScrumDie(flags);
          break;
        case 'fibonacci':
        case 'fib':
          this.rollFibonacciDie(flags);
          break;
        case 'coin':
        case 'flip':
          this.flipCoin(flags);
          break;
        case 'magic8':
        case '8ball':
        case 'magic8ball':
          this.rollMagic8Ball(flags);
          break;
        case 'yesno':
        case 'yn':
        case 'decision':
          this.rollYesNo(flags);
          break;
        default:
          OutputFormatter.formatError(`Unknown custom die type: ${diceType}`);
          break;
      }
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Unknown error'), 'custom');
    }
  }

  private rollScrumDie(flags: ParsedFlags): void {
    const scrumDie = DicePresets.createScrumPlanningDie();
    const result = scrumDie.roll();
    
    const output: DiceRollOutput = { result };
    
    if (flags.isExplain) {
      output.explanation = {
        originalExpression: 'scrum',
        tokenization: ['scrum'],
        parsing: 'Scrum planning die with custom values',
        steps: [{
          step: 1,
          operation: `Scrum Die = ${result}`,
          description: 'roll 1 custom Scrum planning die',
          details: 'Possible values: [1, 2, 3, 5, 8, 13, 20, ?]'
        }],
        finalResult: result.toString()
      };
    } else if (flags.isVerbose) {
      output.verbose = {
        expression: 'Rolling Scrum Planning Die',
        details: ['📋 Possible values: 1, 2, 3, 5, 8, 13, 20, ?']
      };
    }
    
    OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
  }

  private rollFibonacciDie(flags: ParsedFlags): void {
    const fibDie = DicePresets.createFibonacciDie();
    const result = fibDie.roll();
    
    const output: DiceRollOutput = { result };
    
    if (flags.isExplain) {
      output.explanation = {
        originalExpression: 'fibonacci',
        tokenization: ['fibonacci'],
        parsing: 'Fibonacci sequence die with custom values',
        steps: [{
          step: 1,
          operation: `Fibonacci Die = ${result}`,
          description: 'roll 1 custom Fibonacci sequence die',
          details: 'Possible values: [0, 1, 1, 2, 3, 5, 8, 13]'
        }],
        finalResult: result.toString()
      };
    } else if (flags.isVerbose) {
      output.verbose = {
        expression: 'Rolling Fibonacci Die',
        details: ['📋 Possible values: 0, 1, 1, 2, 3, 5, 8, 13']
      };
    }
    
    OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
  }

  private flipCoin(flags: ParsedFlags): void {
    const coinDie = DicePresets.createCoinDie();
    const result = coinDie.roll();
    
    const output: DiceRollOutput = { result };
    
    if (flags.isExplain) {
      output.explanation = {
        originalExpression: 'coin',
        tokenization: ['coin'],
        parsing: 'Binary coin flip with two outcomes',
        steps: [{
          step: 1,
          operation: `Coin Flip = ${result}`,
          description: 'flip 1 standard coin',
          details: 'Possible values: [Heads, Tails]'
        }],
        finalResult: result.toString()
      };
    } else if (flags.isVerbose) {
      output.verbose = {
        expression: 'Flipping coin',
        details: ['📋 Possible values: Heads, Tails']
      };
    }
    
    OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
  }

  private rollMagic8Ball(flags: ParsedFlags): void {
    const magic8Die = DicePresets.createMagic8BallDie();
    const result = magic8Die.roll();
    
    const output: DiceRollOutput = { result };
    
    if (flags.isVerbose) {
      output.verbose = {
        expression: 'Rolling Magic 8-Ball',
        details: ['🎱 The Magic 8-Ball says...']
      };
    }
    
    OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
  }

  private rollYesNo(flags: ParsedFlags): void {
    const yesNoDie = DicePresets.createTextDie(['Yes', 'No']);
    const result = yesNoDie.roll();
    
    const output: DiceRollOutput = { result };
    
    if (flags.isVerbose) {
      output.verbose = {
        expression: 'Rolling Yes/No decision die',
        details: ['📋 Possible values: Yes, No']
      };
    }
    
    OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
  }

  getHelp(): string {
    return `
custom <type>                    Roll custom dice presets

Types:
  scrum                          Roll Scrum planning die (1,2,3,5,8,13,20,?)
  fibonacci                      Roll Fibonacci die (0,1,1,2,3,5,8,13)
  coin                           Flip a coin (Heads/Tails)
  magic8                         Roll Magic 8-Ball
  yesno                          Roll Yes/No decision die

Examples:
  custom scrum                   Roll Scrum planning die
  custom fibonacci --verbose     Roll Fibonacci die with details
  custom coin                    Flip a coin
  custom magic8                  Ask the Magic 8-Ball
  custom yesno                   Make a Yes/No decision
`;
  }
}
