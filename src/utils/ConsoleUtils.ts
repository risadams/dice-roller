/**
 * Utility functions for console output and formatting
 */

export class ConsoleUtils {
  /**
   * ANSI color codes for console output
   */
  static readonly Colors = {
    Reset: '\x1b[0m',
    Bright: '\x1b[1m',
    Dim: '\x1b[2m',
    
    // Foreground colors
    Black: '\x1b[30m',
    Red: '\x1b[31m',
    Green: '\x1b[32m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    White: '\x1b[37m',
    
    // Background colors
    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m'
  } as const;

  /**
   * Unicode symbols for enhanced output
   */
  static readonly Symbols = {
    // Dice and gaming
    dice: '🎲',
    trophy: '🏆',
    target: '🎯',
    success: '✅',
    failure: '❌',
    explosion: '💥',
    lightning: '⚡',
    fire: '🔥',
    
    // Math and statistics
    chart: '📊',
    graph: '📈',
    clipboard: '📋',
    magnifier: '🔍',
    memo: '📝',
    
    // Status indicators
    check: '✓',
    cross: '✗',
    warning: '⚠️',
    info: 'ℹ️',
    question: '❓',
    exclamation: '❗',
    
    // Arrows and navigation
    rightArrow: '→',
    leftArrow: '←',
    upArrow: '↑',
    downArrow: '↓',
    
    // Bullets and separators
    bullet: '•',
    diamond: '◆',
    star: '★',
    heart: '♥',
    
    // Box drawing
    boxVertical: '│',
    boxHorizontal: '─',
    boxTopLeft: '┌',
    boxTopRight: '┐',
    boxBottomLeft: '└',
    boxBottomRight: '┘'
  } as const;

  /**
   * Applies color to text
   */
  static colorize(text: string, color: keyof typeof ConsoleUtils.Colors): string {
    return `${this.Colors[color]}${text}${this.Colors.Reset}`;
  }

  /**
   * Logs text with color
   */
  static log(text: string, color?: keyof typeof ConsoleUtils.Colors): void {
    if (color) {
      console.log(this.colorize(text, color));
    } else {
      console.log(text);
    }
  }

  /**
   * Logs an error message with red color
   */
  static error(message: string): void {
    console.error(this.colorize(`${this.Symbols.cross} ${message}`, 'Red'));
  }

  /**
   * Logs a success message with green color
   */
  static success(message: string): void {
    console.log(this.colorize(`${this.Symbols.check} ${message}`, 'Green'));
  }

  /**
   * Logs a warning message with yellow color
   */
  static warning(message: string): void {
    console.warn(this.colorize(`${this.Symbols.warning} ${message}`, 'Yellow'));
  }

  /**
   * Logs an info message with blue color
   */
  static info(message: string): void {
    console.log(this.colorize(`${this.Symbols.info} ${message}`, 'Blue'));
  }

  /**
   * Creates a formatted header with symbols
   */
  static header(title: string, symbol: string = this.Symbols.dice): void {
    console.log('');
    console.log(this.colorize(`${symbol} ${title}`, 'Bright'));
    console.log(this.Colors.Dim + '─'.repeat(title.length + 3) + this.Colors.Reset);
  }

  /**
   * Creates a box around text
   */
  static box(text: string): void {
    const lines = text.split('\n');
    const maxLength = Math.max(...lines.map(line => line.length));
    
    console.log(this.Symbols.boxTopLeft + this.Symbols.boxHorizontal.repeat(maxLength + 2) + this.Symbols.boxTopRight);
    
    for (const line of lines) {
      const padding = ' '.repeat(maxLength - line.length);
      console.log(`${this.Symbols.boxVertical} ${line}${padding} ${this.Symbols.boxVertical}`);
    }
    
    console.log(this.Symbols.boxBottomLeft + this.Symbols.boxHorizontal.repeat(maxLength + 2) + this.Symbols.boxBottomRight);
  }

  /**
   * Creates a table from data
   */
  static table<T extends Record<string, any>>(data: T[], columns?: (keyof T)[]): void {
    if (data.length === 0) return;
    
    const keys = columns || Object.keys(data[0]) as (keyof T)[];
    const headers = keys.map(key => String(key));
    
    // Calculate column widths
    const widths = headers.map((header, i) => {
      const key = keys[i];
      const values = data.map(row => String(row[key] || ''));
      return Math.max(header.length, ...values.map(v => v.length));
    });
    
    // Print header
    const headerRow = headers.map((header, i) => header.padEnd(widths[i])).join(' │ ');
    console.log(`│ ${headerRow} │`);
    console.log(`├${'─'.repeat(headerRow.length)}┤`);
    
    // Print rows
    for (const row of data) {
      const cells = keys.map((key, i) => String(row[key] || '').padEnd(widths[i]));
      console.log(`│ ${cells.join(' │ ')} │`);
    }
  }

  /**
   * Creates a progress indicator
   */
  static progress(current: number, total: number, label?: string): void {
    // Only show progress bar if stdout is a TTY (interactive terminal)
    if (!process.stdout.isTTY) {
      return;
    }

    const percentage = Math.min(current / total, 1);
    const barLength = 30;
    const filledLength = Math.floor(percentage * barLength);
    
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    const percent = (percentage * 100).toFixed(1);
    
    const output = label 
      ? `${label}: [${bar}] ${percent}%`
      : `[${bar}] ${percent}%`;
    
    // Use \r to overwrite the same line
    process.stdout.write(`\r${output}`);
    
    if (current >= total) {
      console.log(''); // New line when complete
    }
  }

  /**
   * Clears the console
   */
  static clear(): void {
    console.clear();
  }

  /**
   * Prints a separator line
   */
  static separator(char: string = '─', length: number = 50): void {
    console.log(char.repeat(length));
  }

  /**
   * Formats dice roll output with symbols
   */
  static formatDiceResult(expression: string, result: number, details?: string[]): void {
    console.log(`${this.Symbols.dice} ${expression}: ${this.colorize(String(result), 'Bright')}`);
    
    if (details && details.length > 0) {
      details.forEach(detail => {
        console.log(`  ${this.Symbols.bullet} ${detail}`);
      });
    }
  }

  /**
   * Formats success pool results
   */
  static formatSuccessPool(successes: number, rolls: number[], threshold: number): void {
    const successSymbol = this.colorize(this.Symbols.success, 'Green');
    const failureSymbol = this.colorize(this.Symbols.failure, 'Red');
    
    console.log(`${this.Symbols.target} Success Pool Results:`);
    console.log(`  ${this.Symbols.trophy} Successes: ${this.colorize(String(successes), 'Green')}`);
    
    const rollsDisplay = rolls.map(roll => {
      const symbol = roll >= threshold ? successSymbol : failureSymbol;
      return `${symbol}${roll}`;
    }).join(' ');
    
    console.log(`  ${this.Symbols.chart} Rolls: ${rollsDisplay}`);
  }

  /**
   * Formats statistics output
   */
  static formatStatistics(stats: {
    min: number;
    max: number;
    average: number;
    standardDeviation: number;
  }): void {
    console.log(`${this.Symbols.chart} Statistics:`);
    console.log(`  ${this.Symbols.graph} Range: ${stats.min} - ${stats.max}`);
    console.log(`  ${this.Symbols.target} Average: ${stats.average.toFixed(2)}`);
    console.log(`  ${this.Symbols.clipboard} Std Dev: ${stats.standardDeviation.toFixed(2)}`);
  }

  /**
   * Formats help text with proper indentation
   */
  static formatHelp(sections: { title: string; content: string[] }[]): void {
    for (const section of sections) {
      this.header(section.title);
      
      for (const line of section.content) {
        console.log(`  ${line}`);
      }
      
      console.log('');
    }
  }
}
