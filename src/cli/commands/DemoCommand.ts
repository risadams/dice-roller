import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter } from '../OutputFormatter';
import { Roller } from '../../Roller';

/**
 * Command to run an interactive demo
 */
export class DemoCommand extends BaseCommand {
  name = 'demo';
  aliases = ['example', 'showcase'];

  validate(args: string[]): void {
    // Demo command doesn't need any arguments
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      const roller = new Roller();
      OutputFormatter.formatDemo(roller);
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error('Unknown error'), 'demo');
    }
  }

  getHelp(): string {
    return `
demo                             Run interactive demo showing various dice rolling features

Examples:
  demo                           Show demonstration of dice rolling capabilities
`;
  }
}
