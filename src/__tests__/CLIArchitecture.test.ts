import { CommandHandler } from '../cli/CommandHandler';
import { FlagParser } from '../cli/FlagParser';
import { OutputFormatter } from '../cli/OutputFormatter';

describe('CLI Architecture', () => {
  let commandHandler: CommandHandler;

  beforeEach(() => {
    commandHandler = new CommandHandler();
  });

  describe('CommandHandler', () => {
    test('should initialize with all expected commands', () => {
      const commandNames = commandHandler.getCommandNames();
      
      // Check for primary commands
      expect(commandNames).toContain('roll');
      expect(commandNames).toContain('success');
      expect(commandNames).toContain('penetrating');
      expect(commandNames).toContain('compounding');
      expect(commandNames).toContain('step');
      expect(commandNames).toContain('custom');
      expect(commandNames).toContain('stats');
      expect(commandNames).toContain('demo');
      expect(commandNames).toContain('help');
      expect(commandNames).toContain('version');
      
      // Check for custom dice shortcuts
      expect(commandNames).toContain('scrum');
      expect(commandNames).toContain('fibonacci');
      expect(commandNames).toContain('coin');
      expect(commandNames).toContain('magic8');
      expect(commandNames).toContain('yesno');
    });

    test('should recognize command aliases', () => {
      expect(commandHandler.hasCommand('r')).toBe(true); // roll alias
      expect(commandHandler.hasCommand('pool')).toBe(true); // success alias
      expect(commandHandler.hasCommand('pen')).toBe(true); // penetrating alias
      expect(commandHandler.hasCommand('comp')).toBe(true); // compounding alias
      expect(commandHandler.hasCommand('savage')).toBe(true); // step alias
      expect(commandHandler.hasCommand('fib')).toBe(true); // fibonacci alias
      expect(commandHandler.hasCommand('flip')).toBe(true); // coin alias
    });

    test('should get help for specific commands', () => {
      const rollHelp = commandHandler.getCommandHelp('roll');
      expect(rollHelp).toContain('roll <dice>');
      expect(rollHelp).toContain('Examples:');
      
      const successHelp = commandHandler.getCommandHelp('success');
      expect(successHelp).toContain('success <count> <sides> <threshold>');
    });
  });

  describe('FlagParser', () => {
    test('should parse verbose and explain flags', () => {
      const flags = FlagParser.parseFlags(['roll', 'd20', '--verbose', '--explain']);
      expect(flags.isVerbose).toBe(true);
      expect(flags.isExplain).toBe(true);
      expect(flags.remainingArgs).toEqual(['roll', 'd20']);
    });

    test('should parse success pool flags', () => {
      const flags = FlagParser.parseFlags([
        'success', '8', '10', '6', 
        '--botch', '1', '--double', '10', '--count-botches'
      ]);
      expect(flags.botchValue).toBe(1);
      expect(flags.doubleValue).toBe(10);
      expect(flags.countBotches).toBe(true);
      expect(flags.remainingArgs).toEqual(['success', '8', '10', '6']);
    });

    test('should parse max explosions flag', () => {
      const flags = FlagParser.parseFlags(['penetrating', '3', '6', '--max-explosions', '5']);
      expect(flags.maxExplosions).toBe(5);
      expect(flags.remainingArgs).toEqual(['penetrating', '3', '6']);
    });

    test('should handle short flag forms', () => {
      const flags = FlagParser.parseFlags(['roll', 'd20', '-v', '-e']);
      expect(flags.isVerbose).toBe(true);
      expect(flags.isExplain).toBe(true);
    });
  });

  describe('OutputFormatter', () => {
    test('should format basic dice roll output', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      OutputFormatter.formatDiceRoll({ result: 15 });
      expect(consoleSpy).toHaveBeenCalledWith(15);
      
      consoleSpy.mockRestore();
    });

    test('should format verbose dice roll output', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      OutputFormatter.formatDiceRoll({
        result: 15,
        verbose: {
          expression: 'Rolling d20',
          range: '1-20',
          details: ['📊 Single die roll']
        }
      }, true);
      
      expect(consoleSpy).toHaveBeenCalledWith('🎲 Rolling d20: 15');
      expect(consoleSpy).toHaveBeenCalledWith('📈 Range: 1-20');
      expect(consoleSpy).toHaveBeenCalledWith('📊 Single die roll');
      
      consoleSpy.mockRestore();
    });

    test('should format error messages', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      OutputFormatter.formatError('Test error message');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Test error message');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Command Integration', () => {
    test('should handle roll command with mocked console', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // This would normally output to console, but we're mocking it
      expect(() => {
        commandHandler.execute(['roll', 'd6']);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle help command', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      expect(() => {
        commandHandler.execute(['help']);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should handle version command', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      expect(() => {
        commandHandler.execute(['version']);
      }).not.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith('Dice Roller v1.1.2');
      consoleSpy.mockRestore();
    });
  });
});
