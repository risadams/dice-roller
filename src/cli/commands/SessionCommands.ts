/**
 * @fileoverview CLI commands for session management
 * @module SessionCommands
 */

import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { DiceSession, RollReplay } from '../../session';
import { Roller } from '../../Roller';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Base class for session-related commands providing common session utilities
 */
abstract class SessionBaseCommand extends BaseCommand {
  /**
   * Get the current active session
   */
  protected getCurrentSession(): DiceSession | null {
    return (global as any).currentDiceSession as DiceSession || null;
  }

  /**
   * Set the current active session
   */
  protected setCurrentSession(session: DiceSession): void {
    (global as any).currentDiceSession = session;
  }

  /**
   * Clear the current session
   */
  protected clearCurrentSession(): void {
    delete (global as any).currentDiceSession;
  }

  /**
   * Validate that a session exists and return it
   */
  protected requireSession(): DiceSession {
    const session = this.getCurrentSession();
    if (!session) {
      throw new Error('No active session. Use "session-start" to begin a new session.');
    }
    return session;
  }

  /**
   * Extract a flag value from arguments
   */
  protected extractFlag(args: string[], flag: string): string | undefined {
    const index = args.indexOf(flag);
    return index >= 0 && index + 1 < args.length ? args[index + 1] : undefined;
  }

  /**
   * Validate that a filename argument is provided
   */
  protected validateFilename(args: string[], commandName: string): string {
    if (args.length === 0) {
      throw new Error(`Please provide a filename. Usage: ${commandName} <filename>`);
    }
    return args[0];
  }

  /**
   * Output session error message
   */
  protected outputSessionError(message: string): void {
    console.error(`❌ ${message}`);
  }

  /**
   * Output session success message
   */
  protected outputSessionSuccess(message: string): void {
    console.log(`${message}`);
  }
}

/**
 * Session start command - creates a new dice session
 */
export class SessionStartCommand extends SessionBaseCommand {
  name = 'session-start';
  aliases = ['start-session'];

  validate(args: string[]): void {
    // No specific validation needed
  }

  getHelp(): string {
    return `
session start - Start a new dice rolling session

Usage:
  session start [--name "Session Name"] [--description "Description"] [--tags "tag1,tag2"]

Examples:
  session start
  session start --name "D&D Campaign" 
  session start --name "Playtesting" --tags "game,balance"

Flags:
  --name        Set session name
  --description Set session description  
  --tags        Comma-separated tags
`;
  }

  execute(args: string[], flags: ParsedFlags): void {
    const name = this.extractFlag(args, '--name');
    const description = this.extractFlag(args, '--description');
    const tagsStr = this.extractFlag(args, '--tags');
    const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()) : undefined;

    const session = new DiceSession({
      autoStatistics: true,
      enableUndoRedo: true,
      trackSeeds: true
    }, {
      name,
      description,
      tags
    });

    this.setCurrentSession(session);

    if (flags.isVerbose) {
      console.log(`🎲 Started new dice session`);
      console.log(`Session ID: ${session.id}`);
      if (name) console.log(`Name: ${name}`);
      if (description) console.log(`Description: ${description}`);
      if (tags) console.log(`Tags: ${tags.join(', ')}`);
      console.log(`Configuration: Statistics enabled, Undo/redo enabled, Seed tracking enabled`);
    } else {
      this.outputSessionSuccess(`Session started: ${session.id}`);
    }
  }
}

/**
 * Session status command - shows current session information
 */
export class SessionStatusCommand extends SessionBaseCommand {
  name = 'session-status';
  aliases = ['status', 'session-info'];

  validate(args: string[]): void {
    // No specific validation needed
  }

  getHelp(): string {
    return `
session status - Show current session status and statistics

Usage:
  session status [--stats]

Examples:
  session status
  session status --verbose
  session status --stats

Flags:
  --stats    Show detailed statistics
`;
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      const session = this.requireSession();
      const metadata = session.metadata;
      const stats = session.statistics;
      const showStats = args.includes('--stats') || flags.isVerbose;

      if (flags.isVerbose) {
        console.log(`📊 Session Status`);
        console.log(`ID: ${metadata.id}`);
        console.log(`Name: ${metadata.name || 'Unnamed'}`);
        if (metadata.description) console.log(`Description: ${metadata.description}`);
        console.log(`Created: ${metadata.created.toLocaleString()}`);
        console.log(`Last Modified: ${metadata.lastModified.toLocaleString()}`);
        if (metadata.tags?.length) console.log(`Tags: ${metadata.tags.join(', ')}`);
        
        console.log('');
        console.log(`📈 Quick Stats:`);
        console.log(`• Total Rolls: ${stats.totalRolls}`);
        console.log(`• Duration: ${this.formatDuration(stats.duration)}`);
        console.log(`• Average Result: ${stats.averageResult.toFixed(2)}`);
        console.log(`• Range: ${stats.lowestResult} - ${stats.highestResult}`);
        
        if (showStats && stats.totalRolls > 0) {
          console.log('');
          console.log(`🎲 Detailed Statistics:`);
          console.log(`• Total Dice Rolled: ${stats.totalDiceRolled}`);
          console.log(`• Rolls per Minute: ${stats.rollsPerMinute.toFixed(1)}`);
          
          if (Object.keys(stats.methodDistribution).length > 0) {
            console.log(`• Method Distribution:`);
            Object.entries(stats.methodDistribution).forEach(([method, count]) => {
              console.log(`  - ${method}: ${count}`);
            });
          }
        }
      } else {
        this.outputSessionSuccess(`Session: ${metadata.name || 'Unnamed'} (${stats.totalRolls} rolls)`);
      }
    } catch (error) {
      this.outputSessionError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h`;
  }
}

/**
 * Session save command - saves session to file
 */
export class SessionSaveCommand extends SessionBaseCommand {
  name = 'session-save';
  aliases = ['save-session'];

  validate(args: string[]): void {
    this.validateFilename(args, 'session save');
  }

  getHelp(): string {
    return `
session save - Save current session to a file

Usage:
  session save <filename> [options]

Examples:
  session save my-session.json
  session save campaign.json --compress
  session save backup.json --no-seeds

Flags:
  --compress    Compress JSON output
  --no-seeds    Don't include random seeds
`;
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      const session = this.requireSession();
      const filename = args[0];
      const compress = args.includes('--compress');
      const includeSeeds = !args.includes('--no-seeds');
      
      const exportOptions = {
        includeSeeds,
        compress
      };

      const sessionData = session.export(exportOptions);
      const jsonData = JSON.stringify(sessionData, null, compress ? 0 : 2);
      
      // Ensure directory exists
      const dir = path.dirname(filename);
      if (dir !== '.' && !fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filename, jsonData, 'utf8');

      if (flags.isVerbose) {
        console.log(`💾 Session saved successfully`);
        console.log(`File: ${filename}`);
        console.log(`Size: ${(jsonData.length / 1024).toFixed(1)} KB`);
        console.log(`Rolls: ${sessionData.history.length}`);
        console.log(`Format: ${sessionData.formatVersion}`);
        if (includeSeeds) console.log(`Seeds included for replay`);
        if (compress) console.log(`Compressed format`);
      } else {
        this.outputSessionSuccess(`Session saved to ${filename}`);
      }

    } catch (error) {
      this.outputSessionError(`Failed to save session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Session load command - loads session from file
 */
export class SessionLoadCommand extends SessionBaseCommand {
  name = 'session-load';
  aliases = ['load-session'];

  validate(args: string[]): void {
    this.validateFilename(args, 'session load');
  }

  getHelp(): string {
    return `
session load - Load a session from a file

Usage:
  session load <filename> [options]

Examples:
  session load my-session.json
  session load campaign.json --merge
  session load backup.json --replace

Flags:
  --merge      Merge with existing session
  --replace    Replace current session (default)
`;
  }

  execute(args: string[], flags: ParsedFlags): void {
    try {
      this.validate(args);
      const filename = args[0];
      
      if (!fs.existsSync(filename)) {
        this.outputSessionError(`File not found: ${filename}`);
        return;
      }

      const merge = args.includes('--merge');
      const jsonData = fs.readFileSync(filename, 'utf8');
      const sessionData = JSON.parse(jsonData);

      let session = this.getCurrentSession();
      
      if (!session || !merge) {
        // Create new session
        session = new DiceSession();
        this.setCurrentSession(session);
      }

      const result = session.import(sessionData, merge);

      if (result.success) {
        if (flags.isVerbose) {
          console.log(`📁 Session loaded successfully`);
          console.log(`File: ${filename}`);
          console.log(`Rolls imported: ${result.rollsImported}`);
          console.log(`Session: ${result.sessionMetadata?.name || 'Unnamed'}`);
          console.log(`Format version: ${result.formatVersion}`);
          if (result.warnings?.length) {
            console.log('⚠️ Warnings:');
            result.warnings.forEach(warning => console.log(`• ${warning}`));
          }
          if (merge) console.log(`Merged with existing session`);
        } else {
          this.outputSessionSuccess(`Session loaded: ${result.rollsImported} rolls`);
        }
      } else {
        this.outputSessionError(`Failed to load session: ${result.error}`);
      }

    } catch (error) {
      this.outputSessionError(`Failed to read session file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
