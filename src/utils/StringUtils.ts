/**
 * Utility functions for string formatting and text manipulation
 */

export class StringUtils {
  /**
   * Capitalizes the first letter of a string
   */
  static capitalize(str: string): string {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Converts a string to title case
   */
  static toTitleCase(str: string): string {
    return str.split(' ')
      .map(word => this.capitalize(word.toLowerCase()))
      .join(' ');
  }

  /**
   * Pads a string to a specific length with a character
   */
  static pad(str: string, length: number, char: string = ' ', left: boolean = true): string {
    if (str.length >= length) return str;
    
    const padding = char.repeat(length - str.length);
    return left ? padding + str : str + padding;
  }

  /**
   * Truncates a string to a maximum length with ellipsis
   */
  static truncate(str: string, maxLength: number, ellipsis: string = '...'): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - ellipsis.length) + ellipsis;
  }

  /**
   * Pluralizes a word based on count
   */
  static pluralize(word: string, count: number, pluralForm?: string): string {
    if (count === 1) return word;
    
    if (pluralForm) return pluralForm;
    
    // Simple pluralization rules
    if (word.endsWith('s') || word.endsWith('sh') || word.endsWith('ch') || word.endsWith('x') || word.endsWith('z')) {
      return word + 'es';
    } else if (word.endsWith('y') && !'aeiou'.includes(word[word.length - 2])) {
      return word.slice(0, -1) + 'ies';
    } else {
      return word + 's';
    }
  }

  /**
   * Formats a number with ordinal suffix (1st, 2nd, 3rd, etc.)
   */
  static ordinal(num: number): string {
    const suffix = ['th', 'st', 'nd', 'rd'];
    const remainder = num % 100;
    
    return num + (suffix[(remainder - 20) % 10] || suffix[remainder] || suffix[0]);
  }

  /**
   * Joins an array of strings with proper grammar (comma separation with 'and')
   */
  static grammarJoin(items: string[], conjunction: string = 'and'): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
    
    return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
  }

  /**
   * Formats a list of dice roll results for display
   */
  static formatDiceRolls(rolls: number[], separator: string = ', '): string {
    return rolls.join(separator);
  }

  /**
   * Formats a dice expression with proper spacing
   */
  static formatDiceExpression(expression: string): string {
    return expression
      .replace(/([+\-*/()])/g, ' $1 ')  // Add spaces around operators and parentheses
      .replace(/\s+/g, ' ')             // Collapse multiple spaces
      .trim();                          // Remove leading/trailing spaces
  }

  /**
   * Removes ANSI color codes from a string
   */
  static stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  /**
   * Wraps text to a specific line length
   */
  static wordWrap(text: string, maxLength: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Creates a progress bar string
   */
  static progressBar(current: number, total: number, width: number = 20, filled: string = '█', empty: string = '░'): string {
    const percentage = Math.min(current / total, 1);
    const filledWidth = Math.floor(percentage * width);
    const emptyWidth = width - filledWidth;
    
    return filled.repeat(filledWidth) + empty.repeat(emptyWidth);
  }

  /**
   * Formats a percentage with specified decimal places
   */
  static formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Escapes special regex characters in a string
   */
  static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Checks if a string represents a valid integer
   */
  static isInteger(str: string): boolean {
    return /^-?\d+$/.test(str.trim());
  }

  /**
   * Checks if a string represents a valid float
   */
  static isFloat(str: string): boolean {
    return /^-?\d*\.?\d+$/.test(str.trim());
  }

  /**
   * Formats a time duration in milliseconds to human readable format
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(1)}s`;
    } else if (milliseconds < 3600000) {
      return `${(milliseconds / 60000).toFixed(1)}m`;
    } else {
      return `${(milliseconds / 3600000).toFixed(1)}h`;
    }
  }

  /**
   * Converts bytes to human readable format
   */
  static formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }
}
