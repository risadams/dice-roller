import { BaseCommand } from './BaseCommand';
import { ParsedFlags } from '../FlagParser';
import { OutputFormatter } from '../OutputFormatter';

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

  private version = '1.1.2';

  validate(args: string[]): void {
    // Version command doesn't need validation
  }

  execute(args: string[], flags: ParsedFlags): void {
    OutputFormatter.formatVersion(this.version);
  }

  getHelp(): string {
    return `
version                          Show version information

Examples:
  version                        Display current version
`;
  }
}
