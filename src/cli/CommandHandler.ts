import { ICommand } from './commands/BaseCommand';
import { ParsedFlags, FlagParser } from './FlagParser';
import { OutputFormatter } from './OutputFormatter';

// Import all command classes
import { RollCommand } from './commands/RollCommand';
import { SuccessCommand } from './commands/SuccessCommand';
import { PenetratingCommand } from './commands/PenetratingCommand';
import { CompoundingCommand } from './commands/CompoundingCommand';
import { StepCommand } from './commands/StepCommand';
import { CustomDiceCommand } from './commands/CustomDiceCommand';
import { StatsCommand } from './commands/StatsCommand';
import { DemoCommand } from './commands/DemoCommand';
import { HelpCommand, VersionCommand } from './commands/UtilityCommands';
import { 
  SessionStartCommand, 
  SessionStatusCommand, 
  SessionSaveCommand, 
  SessionLoadCommand 
} from './commands/SessionCommands';

/**
 * Main command handler that routes CLI commands to appropriate handlers
 * Provides centralized command management and routing
 */
export class CommandHandler {
  private commands: Map<string, ICommand> = new Map();
  private defaultCommand: ICommand;

  constructor() {
    this.initializeCommands();
    this.defaultCommand = new RollCommand(); // Default to roll command for expressions
  }

  /**
   * Initialize and register all available commands
   */
  private initializeCommands(): void {
    const commandInstances = [
      new RollCommand(),
      new SuccessCommand(),
      new PenetratingCommand(),
      new CompoundingCommand(),
      new StepCommand(),
      new CustomDiceCommand(),
      new StatsCommand(),
      new DemoCommand(),
      new HelpCommand(),
      new VersionCommand(),
      new SessionStartCommand(),
      new SessionStatusCommand(),
      new SessionSaveCommand(),
      new SessionLoadCommand()
    ];

    for (const command of commandInstances) {
      // Register primary name
      this.commands.set(command.name, command);
      
      // Register aliases
      if (command.aliases) {
        for (const alias of command.aliases) {
          this.commands.set(alias, command);
        }
      }
    }

    // Register custom dice commands as direct commands for convenience
    const customDiceCommand = new CustomDiceCommand();
    this.commands.set('scrum', customDiceCommand);
    this.commands.set('fibonacci', customDiceCommand);
    this.commands.set('fib', customDiceCommand);
    this.commands.set('coin', customDiceCommand);
    this.commands.set('flip', customDiceCommand);
    this.commands.set('magic8', customDiceCommand);
    this.commands.set('8ball', customDiceCommand);
    this.commands.set('magic8ball', customDiceCommand);
    this.commands.set('yesno', customDiceCommand);
    this.commands.set('yn', customDiceCommand);
    this.commands.set('decision', customDiceCommand);
  }

  /**
   * Execute a command based on CLI arguments
   */
  public execute(args: string[]): void {
    try {
      // Parse flags first
      const flags = FlagParser.parseFlags(args);
      const remainingArgs = flags.remainingArgs;

      // Handle empty args
      if (remainingArgs.length === 0) {
        const helpCommand = this.commands.get('help');
        if (helpCommand) {
          helpCommand.execute([], flags);
        }
        return;
      }

      const commandName = remainingArgs[0].toLowerCase();
      const commandArgs = remainingArgs.slice(1);

      // Find command
      const command = this.commands.get(commandName);
      
      if (command) {
        // Handle custom dice commands specially
        if (this.isCustomDiceCommand(commandName)) {
          const customDiceCommand = new CustomDiceCommand();
          customDiceCommand.execute([commandName, ...commandArgs], flags);
        } else {
          // Execute specific command
          command.execute(commandArgs, flags);
        }
      } else {
        // Treat the first argument as a dice expression
        this.defaultCommand.execute(remainingArgs, flags);
      }
    } catch (error) {
      OutputFormatter.formatError(error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Get all available commands
   */
  public getCommands(): Map<string, ICommand> {
    return this.commands;
  }

  /**
   * Get help for a specific command
   */
  public getCommandHelp(commandName: string): string | null {
    const command = this.commands.get(commandName.toLowerCase());
    return command ? command.getHelp() : null;
  }

  /**
   * Check if a command exists
   */
  public hasCommand(commandName: string): boolean {
    return this.commands.has(commandName.toLowerCase());
  }

  /**
   * Get list of all command names (including aliases)
   */
  public getCommandNames(): string[] {
    return Array.from(this.commands.keys());
  }

  /**
   * Get list of primary command names (excluding aliases)
   */
  public getPrimaryCommandNames(): string[] {
    const primaryNames: string[] = [];
    const seen = new Set<ICommand>();
    
    for (const command of this.commands.values()) {
      if (!seen.has(command)) {
        primaryNames.push(command.name);
        seen.add(command);
      }
    }
    
    return primaryNames;
  }

  /**
   * Check if a command name is a custom dice command
   */
  private isCustomDiceCommand(commandName: string): boolean {
    const customDiceCommands = [
      'scrum', 'fibonacci', 'fib', 'coin', 'flip', 
      'magic8', '8ball', 'magic8ball', 'yesno', 'yn', 'decision'
    ];
    return customDiceCommands.includes(commandName.toLowerCase());
  }
}
