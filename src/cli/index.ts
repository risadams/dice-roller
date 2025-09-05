#!/usr/bin/env node

import { CommandHandler } from './CommandHandler';

/**
 * Main CLI entry point
 * Handles command-line arguments and delegates to appropriate command handlers
 */
class DiceRollerCLI {
  private commandHandler: CommandHandler;

  constructor() {
    this.commandHandler = new CommandHandler();
  }

  /**
   * Main entry point for the CLI
   */
  public run(): void {
    const args = process.argv.slice(2);
    this.commandHandler.execute(args);
  }
}

// Create and run the CLI
const cli = new DiceRollerCLI();
cli.run();
