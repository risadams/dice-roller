/**
 * Handles parsing of command-line flags and options
 * Centralizes flag parsing logic for consistent behavior across all commands
 */

export interface ParsedFlags {
  isVerbose: boolean;
  isExplain: boolean;
  botchValue?: number;
  doubleValue?: number;
  countBotches: boolean;
  maxExplosions?: number;
  remainingArgs: string[];
}

export class FlagParser {
  
  /**
   * Parses command-line arguments and extracts flags
   */
  static parseFlags(args: string[]): ParsedFlags {
    const flags: ParsedFlags = {
      isVerbose: false,
      isExplain: false,
      countBotches: false,
      remainingArgs: [...args]
    };

    // Parse verbose flag
    const verboseIndex = this.findAndRemoveFlag(flags.remainingArgs, ['--verbose', '-v']);
    if (verboseIndex !== -1) {
      flags.isVerbose = true;
    }

    // Parse explain flag
    const explainIndex = this.findAndRemoveFlag(flags.remainingArgs, ['--explain', '-e']);
    if (explainIndex !== -1) {
      flags.isExplain = true;
    }

    // Parse botch value flag
    const botchIndex = this.findFlag(flags.remainingArgs, ['--botch']);
    if (botchIndex !== -1 && botchIndex + 1 < flags.remainingArgs.length) {
      const botchValue = parseInt(flags.remainingArgs[botchIndex + 1], 10);
      if (!isNaN(botchValue)) {
        flags.botchValue = botchValue;
        flags.remainingArgs.splice(botchIndex, 2); // Remove flag and value
      }
    }

    // Parse double value flag
    const doubleIndex = this.findFlag(flags.remainingArgs, ['--double']);
    if (doubleIndex !== -1 && doubleIndex + 1 < flags.remainingArgs.length) {
      const doubleValue = parseInt(flags.remainingArgs[doubleIndex + 1], 10);
      if (!isNaN(doubleValue)) {
        flags.doubleValue = doubleValue;
        flags.remainingArgs.splice(doubleIndex, 2); // Remove flag and value
      }
    }

    // Parse count-botches flag
    const countBotchesIndex = this.findAndRemoveFlag(flags.remainingArgs, ['--count-botches']);
    if (countBotchesIndex !== -1) {
      flags.countBotches = true;
    }

    // Parse max explosions flag
    const maxExplosionsIndex = this.findFlag(flags.remainingArgs, ['--max-explosions']);
    if (maxExplosionsIndex !== -1 && maxExplosionsIndex + 1 < flags.remainingArgs.length) {
      const maxExplosions = parseInt(flags.remainingArgs[maxExplosionsIndex + 1], 10);
      if (!isNaN(maxExplosions)) {
        flags.maxExplosions = maxExplosions;
        flags.remainingArgs.splice(maxExplosionsIndex, 2); // Remove flag and value
      }
    }

    return flags;
  }

  /**
   * Finds a flag in arguments and removes it
   */
  private static findAndRemoveFlag(args: string[], flagNames: string[]): number {
    for (const flagName of flagNames) {
      const index = args.indexOf(flagName);
      if (index !== -1) {
        args.splice(index, 1);
        return index;
      }
    }
    return -1;
  }

  /**
   * Finds a flag in arguments without removing it
   */
  private static findFlag(args: string[], flagNames: string[]): number {
    for (const flagName of flagNames) {
      const index = args.indexOf(flagName);
      if (index !== -1) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Validates required argument count for a command
   */
  static validateArgCount(args: string[], minRequired: number, commandName: string): void {
    if (args.length < minRequired) {
      throw new Error(`${commandName} command requires at least ${minRequired} arguments`);
    }
  }

  /**
   * Parses integer arguments with validation
   */
  static parseIntegerArgs(args: string[], labels: string[]): number[] {
    const results: number[] = [];
    
    for (let i = 0; i < args.length && i < labels.length; i++) {
      const value = parseInt(args[i], 10);
      if (isNaN(value)) {
        throw new Error(`${labels[i]} must be a valid number, got: ${args[i]}`);
      }
      results.push(value);
    }
    
    return results;
  }

  /**
   * Creates success pool options from parsed flags
   */
  static createSuccessPoolOptions(flags: ParsedFlags) {
    return {
      botchValue: flags.botchValue,
      doubleValue: flags.doubleValue,
      countBotches: flags.countBotches
    };
  }

  /**
   * Creates exploding dice options from parsed flags
   */
  static createExplodingOptions(flags: ParsedFlags) {
    return {
      maxExplosions: flags.maxExplosions
    };
  }
}
