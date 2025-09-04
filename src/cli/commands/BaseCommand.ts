import { ParsedFlags } from '../FlagParser';

/**
 * Interface for all CLI commands
 */
export interface ICommand {
  /**
   * The name of the command (used for routing)
   */
  name: string;
  
  /**
   * Alternative names/aliases for the command
   */
  aliases?: string[];
  
  /**
   * Execute the command with the provided arguments and flags
   */
  execute(args: string[], flags: ParsedFlags): void;
  
  /**
   * Validate command arguments before execution
   */
  validate(args: string[]): void;
  
  /**
   * Get help text for this command
   */
  getHelp(): string;
}

/**
 * Base class for all CLI commands providing common functionality
 */
export abstract class BaseCommand implements ICommand {
  abstract name: string;
  aliases?: string[] = [];
  
  abstract execute(args: string[], flags: ParsedFlags): void;
  abstract validate(args: string[]): void;
  abstract getHelp(): string;
  
  /**
   * Helper method to handle common error scenarios
   */
  protected handleError(error: Error, commandName: string): void {
    console.error(`❌ Error in ${commandName}: ${error.message}`);
    process.exit(1);
  }
  
  /**
   * Helper method to validate minimum argument count
   */
  protected validateMinArgs(args: string[], minCount: number, usage: string): void {
    if (args.length < minCount) {
      throw new Error(`Please specify ${usage}`);
    }
  }
  
  /**
   * Helper method to parse integer arguments
   */
  protected parseIntegers(values: string[], labels: string[]): number[] {
    const results: number[] = [];
    
    for (let i = 0; i < values.length && i < labels.length; i++) {
      const parsed = parseInt(values[i], 10);
      if (isNaN(parsed)) {
        throw new Error(`${labels[i]} must be a valid number, got: ${values[i]}`);
      }
      results.push(parsed);
    }
    
    return results;
  }
}
