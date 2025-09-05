/**
 * @fileoverview Tests for session management CLI commands
 */

import { 
  SessionStartCommand, 
  SessionStatusCommand, 
  SessionSaveCommand, 
  SessionLoadCommand 
} from '../SessionCommands';
import { ParsedFlags } from '../../FlagParser';
import { DiceSession } from '../../../session';
import * as fs from 'fs';
import * as path from 'path';

// Mock console methods
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

let consoleOutput: string[] = [];
let consoleErrors: string[] = [];

beforeEach(() => {
  consoleOutput = [];
  consoleErrors = [];
  
  console.log = jest.fn((message: string) => {
    consoleOutput.push(message);
  });
  
  console.error = jest.fn((message: string) => {
    consoleErrors.push(message);
  });

  // Clear any global session
  delete (global as any).currentDiceSession;
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  
  // Clean up test files
  const testFiles = ['test-session.json', 'test-session-compressed.json'];
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
});

describe('SessionStartCommand', () => {
  let command: SessionStartCommand;
  let mockFlags: ParsedFlags;

  beforeEach(() => {
    command = new SessionStartCommand();
    mockFlags = { isVerbose: false } as ParsedFlags;
  });

  test('should have correct command metadata', () => {
    expect(command.name).toBe('session-start');
    expect(command.aliases).toContain('start-session');
  });

  test('should validate without errors', () => {
    expect(() => command.validate([])).not.toThrow();
    expect(() => command.validate(['--name', 'Test'])).not.toThrow();
  });

  test('should return help text', () => {
    const help = command.getHelp();
    expect(help).toContain('session start');
    expect(help).toContain('--name');
    expect(help).toContain('--description');
    expect(help).toContain('--tags');
  });

  test('should start a new session with default settings', () => {
    command.execute([], mockFlags);

    const session = (global as any).currentDiceSession as DiceSession;
    expect(session).toBeDefined();
    expect(session.id).toBeDefined();
    expect(consoleOutput).toHaveLength(1);
    expect(consoleOutput[0]).toContain('Session started:');
  });

  test('should start a session with custom name and description', () => {
    const args = ['--name', 'Test Session', '--description', 'A test session', '--tags', 'test,game'];
    
    command.execute(args, mockFlags);

    const session = (global as any).currentDiceSession as DiceSession;
    expect(session).toBeDefined();
    expect(session.metadata.name).toBe('Test Session');
    expect(session.metadata.description).toBe('A test session');
    expect(session.metadata.tags).toEqual(['test', 'game']);
  });

  test('should provide verbose output when requested', () => {
    const verboseFlags = { isVerbose: true } as ParsedFlags;
    const args = ['--name', 'Verbose Test'];
    
    command.execute(args, verboseFlags);

    expect(consoleOutput.length).toBeGreaterThan(1);
    expect(consoleOutput.join('\n')).toContain('🎲 Started new dice session');
    expect(consoleOutput.join('\n')).toContain('Name: Verbose Test');
  });
});

describe('SessionStatusCommand', () => {
  let command: SessionStatusCommand;
  let mockFlags: ParsedFlags;

  beforeEach(() => {
    command = new SessionStatusCommand();
    mockFlags = { isVerbose: false } as ParsedFlags;
  });

  test('should have correct command metadata', () => {
    expect(command.name).toBe('session-status');
    expect(command.aliases).toContain('status');
    expect(command.aliases).toContain('session-info');
  });

  test('should validate without errors', () => {
    expect(() => command.validate([])).not.toThrow();
    expect(() => command.validate(['--stats'])).not.toThrow();
  });

  test('should return help text', () => {
    const help = command.getHelp();
    expect(help).toContain('session status');
    expect(help).toContain('--stats');
  });

  test('should show error when no active session', () => {
    command.execute([], mockFlags);

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0]).toContain('No active session');
  });

  test('should show session status when session exists', () => {
    // Create a session first
    const session = new DiceSession({}, { name: 'Test Session' });
    (global as any).currentDiceSession = session;

    command.execute([], mockFlags);

    expect(consoleOutput).toHaveLength(1);
    expect(consoleOutput[0]).toContain('Test Session');
    expect(consoleOutput[0]).toContain('0 rolls');
  });

  test('should show verbose output when requested', () => {
    const session = new DiceSession({}, { 
      name: 'Verbose Test',
      description: 'Test description',
      tags: ['test'] 
    });
    (global as any).currentDiceSession = session;
    
    const verboseFlags = { isVerbose: true } as ParsedFlags;
    command.execute([], verboseFlags);

    const output = consoleOutput.join('\n');
    expect(output).toContain('📊 Session Status');
    expect(output).toContain('Name: Verbose Test');
    expect(output).toContain('Description: Test description');
    expect(output).toContain('Tags: test');
  });
});

describe('SessionSaveCommand', () => {
  let command: SessionSaveCommand;
  let mockFlags: ParsedFlags;

  beforeEach(() => {
    command = new SessionSaveCommand();
    mockFlags = { isVerbose: false } as ParsedFlags;
  });

  test('should have correct command metadata', () => {
    expect(command.name).toBe('session-save');
    expect(command.aliases).toContain('save-session');
  });

  test('should validate with filename', () => {
    expect(() => command.validate(['test.json'])).not.toThrow();
  });

  test('should fail validation without filename', () => {
    expect(() => command.validate([])).toThrow('Please provide a filename');
  });

  test('should return help text', () => {
    const help = command.getHelp();
    expect(help).toContain('session save');
    expect(help).toContain('--compress');
    expect(help).toContain('--no-seeds');
  });

  test('should show error when no active session', () => {
    command.execute(['test.json'], mockFlags);

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0]).toContain('No active session');
  });

  test('should save session to file', () => {
    const session = new DiceSession({}, { name: 'Save Test' });
    (global as any).currentDiceSession = session;

    command.execute(['test-session.json'], mockFlags);

    expect(fs.existsSync('test-session.json')).toBe(true);
    expect(consoleOutput).toHaveLength(1);
    expect(consoleOutput[0]).toContain('Session saved to test-session.json');

    // Verify file content
    const savedData = JSON.parse(fs.readFileSync('test-session.json', 'utf8'));
    expect(savedData.metadata.name).toBe('Save Test');
  });

  test('should save with compression when requested', () => {
    const session = new DiceSession({}, { name: 'Compress Test' });
    (global as any).currentDiceSession = session;

    command.execute(['test-session-compressed.json', '--compress'], mockFlags);

    expect(fs.existsSync('test-session-compressed.json')).toBe(true);
    
    // Compressed file should have no formatting
    const fileContent = fs.readFileSync('test-session-compressed.json', 'utf8');
    expect(fileContent).not.toContain('\n  '); // No indentation
  });

  test('should provide verbose output when requested', () => {
    const session = new DiceSession({}, { name: 'Verbose Save' });
    (global as any).currentDiceSession = session;
    
    const verboseFlags = { isVerbose: true } as ParsedFlags;
    command.execute(['test-session.json'], verboseFlags);

    const output = consoleOutput.join('\n');
    expect(output).toContain('💾 Session saved successfully');
    expect(output).toContain('File: test-session.json');
    expect(output).toContain('Size:');
  });
});

describe('SessionLoadCommand', () => {
  let command: SessionLoadCommand;
  let mockFlags: ParsedFlags;

  beforeEach(() => {
    command = new SessionLoadCommand();
    mockFlags = { isVerbose: false } as ParsedFlags;
  });

  test('should have correct command metadata', () => {
    expect(command.name).toBe('session-load');
    expect(command.aliases).toContain('load-session');
  });

  test('should validate with filename', () => {
    expect(() => command.validate(['test.json'])).not.toThrow();
  });

  test('should fail validation without filename', () => {
    expect(() => command.validate([])).toThrow('Please provide a filename');
  });

  test('should return help text', () => {
    const help = command.getHelp();
    expect(help).toContain('session load');
    expect(help).toContain('--merge');
    expect(help).toContain('--replace');
  });

  test('should show error when file does not exist', () => {
    command.execute(['nonexistent.json'], mockFlags);

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0]).toContain('File not found');
  });

  test('should load session from file', () => {
    // First create a session file
    const originalSession = new DiceSession({}, { name: 'Load Test' });
    const sessionData = originalSession.export();
    fs.writeFileSync('test-session.json', JSON.stringify(sessionData, null, 2));

    command.execute(['test-session.json'], mockFlags);

    const loadedSession = (global as any).currentDiceSession as DiceSession;
    expect(loadedSession).toBeDefined();
    expect(loadedSession.metadata.name).toBe('Load Test');
    expect(consoleOutput).toHaveLength(1);
    expect(consoleOutput[0]).toContain('Session loaded');
  });

  test('should provide verbose output when requested', () => {
    // Create a session file
    const originalSession = new DiceSession({}, { name: 'Verbose Load Test' });
    const sessionData = originalSession.export();
    fs.writeFileSync('test-session.json', JSON.stringify(sessionData, null, 2));

    const verboseFlags = { isVerbose: true } as ParsedFlags;
    command.execute(['test-session.json'], verboseFlags);

    const output = consoleOutput.join('\n');
    expect(output).toContain('📁 Session loaded successfully');
    expect(output).toContain('File: test-session.json');
    expect(output).toContain('Session: Verbose Load Test');
  });

  test('should handle invalid JSON gracefully', () => {
    fs.writeFileSync('test-session.json', 'invalid json content');

    command.execute(['test-session.json'], mockFlags);

    expect(consoleErrors).toHaveLength(1);
    expect(consoleErrors[0]).toContain('Failed to read session file');
  });
});

describe('Session Commands Integration', () => {
  test('should work together in a complete workflow', () => {
    const startCommand = new SessionStartCommand();
    const statusCommand = new SessionStatusCommand();
    const saveCommand = new SessionSaveCommand();
    const loadCommand = new SessionLoadCommand();
    const mockFlags = { isVerbose: false } as ParsedFlags;

    // Clear any existing session
    delete (global as any).currentDiceSession;

    // 1. Start a new session
    startCommand.execute(['--name', 'Workflow Test'], mockFlags);
    expect((global as any).currentDiceSession).toBeDefined();

    // 2. Check status
    consoleOutput = []; // Clear previous output
    statusCommand.execute([], mockFlags);
    expect(consoleOutput[0]).toContain('Workflow Test');

    // 3. Save session
    consoleOutput = []; // Clear previous output
    saveCommand.execute(['workflow-test.json'], mockFlags);
    expect(fs.existsSync('workflow-test.json')).toBe(true);

    // 4. Clear session
    delete (global as any).currentDiceSession;

    // 5. Load session back
    consoleOutput = []; // Clear previous output
    loadCommand.execute(['workflow-test.json'], mockFlags);
    expect((global as any).currentDiceSession).toBeDefined();
    expect((global as any).currentDiceSession.metadata.name).toBe('Workflow Test');

    // Clean up
    fs.unlinkSync('workflow-test.json');
  });
});
