import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter, DiceRollOutput } from '../OutputFormatter';
import { DiceExpression } from '../../DiceExpression';

/**
 * Command to roll dice expressions
 */
export class RollCommand extends BaseCommand {
  name = 'roll';
  aliases = ['r'];

  validate(args: string[]): void {
    this.validateMinArgs(args, 1, 'dice to roll (e.g., d20, 3d6)');
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      const dice = args[0];
      
      // Try basic die parsing first (like d20, 3d6)
      if (this.isBasicDiceNotation(dice)) {
        this.rollBasicDice(dice, flags);
      } else {
        // Fall back to expression parsing for complex expressions
        this.rollExpression(dice, flags);
      }
    } catch (error) {
      this.handleAnyError(error, 'roll');
    }
  }

  /**
   * Check if the input is basic dice notation (like d20, 3d6)
   */
  private isBasicDiceNotation(input: string): boolean {
    return /^\d*d\d+$/.test(input);
  }

  /**
   * Roll basic dice notation
   */
  private rollBasicDice(dice: string, flags: ParsedFlags): void {
    // For basic dice, we can just treat it as an expression
    this.rollExpression(dice, flags);
  }

  /**
   * Roll a dice expression
   */
  private rollExpression(dice: string, flags: ParsedFlags): void {
    try {
      const expression = new DiceExpression(dice);
      
      const output: DiceRollOutput = {
        result: 0
      };

      if (flags.isExplain) {
        // Show detailed step-by-step explanation
        const explanation = expression.evaluateWithExplanation(dice);
        output.explanation = {
          originalExpression: explanation.originalExpression,
          tokenization: explanation.tokenization,
          parsing: explanation.parsing,
          steps: explanation.steps,
          finalResult: explanation.finalResult.toString()
        };
        output.result = explanation.finalResult;
      } else {
        const result = expression.evaluate();
        output.result = result;
        
        if (flags.isVerbose) {
          output.verbose = {
            expression: `Rolling ${dice}`,
            range: `${expression.minValue}-${expression.maxValue}`,
            details: [`📊 Expression: ${expression.toString()}`]
          };
        }
      }

      OutputFormatter.formatDiceRoll(output, flags.isVerbose, flags.isExplain);
    } catch (expressionError) {
      throw new Error(`Invalid dice notation: ${dice}. Use format like: d20, 3d6, 2d8, (2d6+3)*2, etc.`);
    }
  }

  getHelp(): string {
    return `
roll <dice>           Roll specific dice (e.g., d20, 3d6)
roll <expression>     Roll complex dice expression

Examples:
  roll d20              Roll a d20
  roll 4d6              Roll 4d6
  roll "3d6+5"          Roll 3d6+5
  roll "(2d6+3)*2"      Roll complex expression
  roll d20 --verbose    Roll with detailed output
`;
  }
}
