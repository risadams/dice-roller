import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter } from '../OutputFormatter';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Command to show help information
 */
export class HelpCommand extends BaseCommand {
  name = 'help';
  aliases = ['--help', '-h'];

  validate(args: string[]): void {
    // Help command doesn't need validation
  }

  execute(args: string[], flags: ParsedFlags): void {
    OutputFormatter.formatHelp();
  }

  getHelp(): string {
    return `
help                             Show this help information

Examples:
  help                           Display complete usage information
`;
  }
}

/**
 * Command to show version information
 */
export class VersionCommand extends BaseCommand {
  name = 'version';
  aliases = ['--version', '-V'];

  private getVersion(): string {
    try {
      // Try to find package.json by traversing up the directory tree
      let currentDir = __dirname;
      
      while (currentDir !== path.dirname(currentDir)) {
        const packagePath = path.join(currentDir, 'package.json');
        if (fs.existsSync(packagePath)) {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
          return packageJson.version;
        }
        currentDir = path.dirname(currentDir);
      }
      
      // Fallback: try the hardcoded relative path
      const packageJson = require('../../../package.json');
      return packageJson.version;
    } catch (error) {
      return 'unknown';
    }
  }

  validate(args: string[]): void {
    // Version command doesn't need validation
  }

  execute(args: string[], flags: ParsedFlags): void {
    OutputFormatter.formatVersion(this.getVersion());
  }

  getHelp(): string {
    return `
version                          Show version information

Examples:
  version                        Display current version
`;
  }
}
