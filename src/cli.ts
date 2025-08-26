#!/usr/bin/env node

import { Roller } from './Roller';
import { DiceExpression } from './DiceExpression';

const version = '1.0.0';

function showHelp() {
  console.log(`
🎲 Dice Roller - Elegant TypeScript Dice Rolling Library

Usage:
  npx @risadams/dice-roller <expression>     Roll a dice expression
  npx @risadams/dice-roller roll <dice>      Roll specific dice (e.g., d20, 3d6)
  npx @risadams/dice-roller demo             Run interactive demo
  npx @risadams/dice-roller stats <expr>     Show statistics for expression
  npx @risadams/dice-roller help             Show this help
  npx @risadams/dice-roller version          Show version

Examples:
  npx @risadams/dice-roller "3d6+5"          Roll 3d6+5
  npx @risadams/dice-roller "2d20+1d4-2"     Roll complex expression
  npx @risadams/dice-roller roll d20         Roll a d20
  npx @risadams/dice-roller roll 4d6         Roll 4d6
  npx @risadams/dice-roller stats "3d6"      Show statistics for 3d6

Dice Notation:
  d4, d6, d8, d10, d12, d20, d100       Standard dice
  3d6                                   Roll 3 six-sided dice
  2d8+5                                 Roll 2d8 and add 5
  1d20+3-1d4                           Complex expressions with multiple dice

Advanced:
  advantage d20                         Roll d20 with advantage
  disadvantage d20                      Roll d20 with disadvantage
  exploding 3d6                        Roll exploding 3d6
`);
}

function showVersion() {
  console.log(`Dice Roller v${version}`);
}

function rollExpression(expression: string) {
  try {
    const roller = new Roller();
    const result = roller.rollExpressionDetailed(expression);
    
    console.log(`🎲 Rolling: ${expression}`);
    console.log(`📊 Result: ${result.result}`);
    console.log(`📈 Range: ${result.minValue}-${result.maxValue}`);
    
    // Show detailed breakdown for complex expressions
    if (result.parts.length > 1) {
      console.log(`🔍 Breakdown:`);
      result.parts.forEach((part, index) => {
        if (part.type === 'dice') {
          console.log(`   ${part.value}: ${part.result} ${part.rolls ? `(${part.rolls.join(', ')})` : ''}`);
        } else if (part.type === 'constant') {
          console.log(`   +${part.value}`);
        }
      });
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollDice(dice: string) {
  try {
    const roller = new Roller();
    
    // Parse dice notation (e.g., "d20", "3d6")
    if (dice.match(/^\d*d\d+$/)) {
      const result = roller.rollExpression(dice);
      console.log(`🎲 Rolling ${dice}: ${result}`);
    } else {
      console.error(`❌ Invalid dice notation: ${dice}`);
      console.log('Use format like: d20, 3d6, 2d8, etc.');
      process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollAdvantage(dice: string) {
  try {
    const roller = new Roller();
    const sides = parseInt(dice.replace('d', ''));
    if (isNaN(sides)) {
      throw new Error('Invalid dice format for advantage');
    }
    
    const result = roller.rollWithAdvantage(sides);
    console.log(`🎲 Rolling ${dice} with Advantage: ${result.result}`);
    console.log(`📊 Rolls: ${result.rolls.join(', ')} (taking higher)`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollDisadvantage(dice: string) {
  try {
    const roller = new Roller();
    const sides = parseInt(dice.replace('d', ''));
    if (isNaN(sides)) {
      throw new Error('Invalid dice format for disadvantage');
    }
    
    const result = roller.rollWithDisadvantage(sides);
    console.log(`🎲 Rolling ${dice} with Disadvantage: ${result.result}`);
    console.log(`📊 Rolls: ${result.rolls.join(', ')} (taking lower)`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollExploding(expression: string) {
  try {
    const roller = new Roller();
    // Parse something like "3d6" into count and sides
    const match = expression.match(/^(\d+)d(\d+)$/);
    if (!match) {
      throw new Error('Exploding dice must be in format like 3d6');
    }
    
    const count = parseInt(match[1]);
    const sides = parseInt(match[2]);
    
    const result = roller.rollExploding(count, sides);
    console.log(`🎲 Rolling exploding ${expression}: ${result.result}`);
    console.log(`📊 Rolls: ${result.rolls.join(', ')} (${result.explosions} explosions)`);
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function showStats(expression: string) {
  try {
    const roller = new Roller();
    console.log(`📊 Analyzing "${expression}" (10,000 samples)...`);
    
    const stats = roller.getStatistics(expression, 10000);
    
    console.log(`🎲 Expression: ${expression}`);
    console.log(`📈 Mean: ${stats.mean.toFixed(2)}`);
    console.log(`📊 Range: ${stats.min} - ${stats.max}`);
    console.log(`📏 Standard Deviation: ${stats.standardDeviation.toFixed(2)}`);
    
    // Show distribution for smaller ranges
    const range = stats.max - stats.min;
    if (range <= 20) {
      console.log(`📋 Distribution:`);
      for (let i = stats.min; i <= stats.max; i++) {
        const count = stats.distribution[i] || 0;
        const percentage = (count / 10000 * 100).toFixed(1);
        if (count > 0) {
          const bar = '█'.repeat(Math.round(count / 100));
          console.log(`   ${i.toString().padStart(2)}: ${percentage.padStart(5)}% ${bar}`);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function runDemo() {
  console.log('🎲 Dice Roller Interactive Demo');
  console.log('='.repeat(50));
  
  const roller = new Roller();
  
  console.log('\n1. Standard Dice:');
  const standard = roller.rollStandard();
  Object.entries(standard).forEach(([die, result]) => {
    console.log(`   ${die}: ${result}`);
  });
  
  console.log('\n2. Complex Expression (3d6+5):');
  const complex = roller.rollExpressionDetailed('3d6+5');
  console.log(`   Result: ${complex.result} (range: ${complex.minValue}-${complex.maxValue})`);
  
  console.log('\n3. Advantage vs Disadvantage (d20):');
  const adv = roller.rollWithAdvantage(20);
  const dis = roller.rollWithDisadvantage(20);
  console.log(`   Advantage: ${adv.result} (${adv.rolls.join(', ')})`);
  console.log(`   Disadvantage: ${dis.result} (${dis.rolls.join(', ')})`);
  
  console.log('\n4. Keep Highest (4d6 drop lowest):');
  const ability = roller.rollKeepHighest(4, 6, 3);
  console.log(`   Result: ${ability.result} (kept: ${ability.kept.join(', ')}, dropped: ${ability.dropped.join(', ')})`);
  
  console.log('\n🎲 Try more commands:');
  console.log('   npx @risadams/dice-roller "2d8+1d4"');
  console.log('   npx @risadams/dice-roller advantage d20');
  console.log('   npx @risadams/dice-roller stats "3d6"');
}

// Main CLI logic
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const command = args[0].toLowerCase();

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
    
  case 'version':
  case '--version':
  case '-v':
    showVersion();
    break;
    
  case 'demo':
    runDemo();
    break;
    
  case 'roll':
    if (args.length < 2) {
      console.error('❌ Please specify dice to roll (e.g., d20, 3d6)');
      process.exit(1);
    }
    rollDice(args[1]);
    break;
    
  case 'advantage':
    if (args.length < 2) {
      console.error('❌ Please specify dice for advantage (e.g., d20)');
      process.exit(1);
    }
    rollAdvantage(args[1]);
    break;
    
  case 'disadvantage':
    if (args.length < 2) {
      console.error('❌ Please specify dice for disadvantage (e.g., d20)');
      process.exit(1);
    }
    rollDisadvantage(args[1]);
    break;
    
  case 'exploding':
    if (args.length < 2) {
      console.error('❌ Please specify dice for exploding (e.g., 3d6)');
      process.exit(1);
    }
    rollExploding(args[1]);
    break;
    
  case 'stats':
    if (args.length < 2) {
      console.error('❌ Please specify expression for statistics (e.g., "3d6")');
      process.exit(1);
    }
    showStats(args[1]);
    break;
    
  default:
    // Treat the first argument as a dice expression
    rollExpression(args.join(' '));
    break;
}
