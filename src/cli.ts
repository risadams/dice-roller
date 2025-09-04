#!/usr/bin/env node

import { Roller } from './Roller';
import { DiceExpression } from './DiceExpression';
import { DicePresets } from './CustomDie';

const version = '1.1.2';

// Global flags for output modes
let isVerbose = false;
let isExplain = false;

/**
 * Formats step count display with proper sign
 */
function formatStepsDisplay(steps: number): string {
  return steps >= 0 ? `+${steps}` : `${steps}`;
}

/**
 * Formats die modifier display for step dice
 */
function formatDieModifier(finalDie: number, modifier: number): string {
  if (modifier === 0) {
    return `d${finalDie}`;
  }
  
  const sign = modifier > 0 ? '+' : '';
  return `d${finalDie}${sign}${modifier}`;
}

function showHelp() {
  console.log(`
🎲 Dice Roller - Elegant TypeScript Dice Rolling Library

Usage:
  npx @risadams/dice-roller <expression>     Roll a dice expression
  npx @risadams/dice-roller roll <dice>      Roll specific dice (e.g., d20, 3d6)
  npx @risadams/dice-roller success <count> <sides> <threshold>  Roll success pool
  npx @risadams/dice-roller penetrating <count> <sides>          Roll penetrating dice
  npx @risadams/dice-roller compounding <count> <sides>          Roll compounding dice
  npx @risadams/dice-roller step <die> <steps>                   Roll step dice (Savage Worlds)
  npx @risadams/dice-roller keep-highest <count> <sides> <keep>  Roll and keep highest
  npx @risadams/dice-roller keep-lowest <count> <sides> <keep>   Roll and keep lowest
  npx @risadams/dice-roller keep-middle <count> <sides> <keep>   Roll and keep middle
  npx @risadams/dice-roller drop-highest <count> <sides> <drop>  Roll and drop highest
  npx @risadams/dice-roller drop-lowest <count> <sides> <drop>   Roll and drop lowest
  npx @risadams/dice-roller scrum            Roll a Scrum planning die
  npx @risadams/dice-roller fibonacci        Roll a Fibonacci die
  npx @risadams/dice-roller coin             Flip a coin (Heads/Tails)
  npx @risadams/dice-roller magic8           Roll a Magic 8-Ball
  npx @risadams/dice-roller yesno            Roll a Yes/No decision die
  npx @risadams/dice-roller demo             Run interactive demo
  npx @risadams/dice-roller stats <expr>     Show statistics for expression
  npx @risadams/dice-roller help             Show this help
  npx @risadams/dice-roller version          Show version

Flags:
  --verbose, -v                         Show detailed output including intermediate rolls
  --explain, -e                         Show step-by-step explanation of parsing and evaluation
  --botch <value>                       Value that counts as botch for success pools
  --double <value>                      Value that counts as double success
  --count-botches                       Subtract botches from successes
  --max-explosions <num>                Maximum explosions for penetrating/compounding dice

Examples:
  npx @risadams/dice-roller "3d6+5"          Roll 3d6+5 (shows result only)
  npx @risadams/dice-roller "3d6+5" --verbose  Roll 3d6+5 with details
  npx @risadams/dice-roller "3d6+5" --explain  Roll 3d6+5 with step-by-step explanation
  npx @risadams/dice-roller "2d20+1d4-2"     Roll complex expression
  npx @risadams/dice-roller "(2d6+3)*2"      Roll with parentheses for precedence
  npx @risadams/dice-roller roll d20         Roll a d20
  npx @risadams/dice-roller roll 4d6 -v      Roll 4d6 with verbose output
  npx @risadams/dice-roller roll "(3d6+2)*2" Roll complex expression with roll command
  npx @risadams/dice-roller success 8 10 6   Roll 8d10, count successes >= 6
  npx @risadams/dice-roller success 6 6 5 --verbose  Shadowrun-style pool
  npx @risadams/dice-roller success 5 10 7 --botch 1 --double 10 --count-botches  World of Darkness
  npx @risadams/dice-roller penetrating 3 6 --verbose  Roll 3d6 with penetrating dice
  npx @risadams/dice-roller compounding 4 8   Roll 4d8 with compounding explosions
  npx @risadams/dice-roller step 6 2          Step up d6 by 2 steps (becomes d10)
  npx @risadams/dice-roller step 8 -1         Step down d8 by 1 step (becomes d6)
  npx @risadams/dice-roller keep-highest 4 6 3  Roll 4d6, keep highest 3
  npx @risadams/dice-roller drop-lowest 5 8 2   Roll 5d8, drop lowest 2
  npx @risadams/dice-roller scrum            Roll Scrum planning die (1,2,3,5,8,13,20,?)
  npx @risadams/dice-roller fibonacci        Roll Fibonacci die (0,1,1,2,3,5,8,13)
  npx @risadams/dice-roller coin             Flip a coin (Heads/Tails)
  npx @risadams/dice-roller magic8           Ask the Magic 8-Ball
  npx @risadams/dice-roller yesno            Roll a Yes/No decision die
  npx @risadams/dice-roller stats "3d6"      Show statistics for 3d6

Dice Notation:
  d4, d6, d8, d10, d12, d20, d100       Standard dice
  3d6                                   Roll 3 six-sided dice
  2d8+5                                 Roll 2d8 and add 5
  1d20+3-1d4                           Complex expressions with multiple dice

Success Pools:
  success <count> <sides> <threshold>   Roll dice pool and count successes
  --botch <value>                      Value that counts as botch (default: none)
  --double <value>                     Value that counts as double success (default: none)
  --count-botches                      Whether botches subtract from successes

Advanced Dice Mechanics:
  penetrating <count> <sides>           Exploding dice with -1 penalty on subsequent rolls
  compounding <count> <sides>           Exploding dice that add to the same die total
  step <die> <steps>                   Savage Worlds style step dice system
  keep-highest <count> <sides> <keep>   Keep highest N dice from pool
  keep-lowest <count> <sides> <keep>    Keep lowest N dice from pool  
  keep-middle <count> <sides> <keep>    Keep middle N dice from pool
  drop-highest <count> <sides> <drop>   Drop highest N dice from pool
  drop-lowest <count> <sides> <drop>    Drop lowest N dice from pool

Traditional:
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
    if (isExplain) {
      // Use DiceExpression for detailed explanation
      const diceExpression = new DiceExpression(expression);
      const explanation = diceExpression.evaluateWithExplanation(expression);
      
      console.log(`🎯 Expression: ${explanation.originalExpression}`);
      console.log(`🔍 Tokenization: [${explanation.tokenization.join(', ')}]`);
      console.log(`📝 Parsing: ${explanation.parsing}`);
      console.log('');
      console.log('📊 Step-by-step evaluation:');
      explanation.steps.forEach(step => {
        console.log(`  ${step.step}. ${step.operation}`);
        console.log(`     → ${step.description}`);
        if (step.details) {
          console.log(`     📋 ${step.details}`);
        }
        console.log('');
      });
      console.log(`🏆 Final Result: ${explanation.finalResult}`);
    } else {
      // Use original Roller for standard output
      const roller = new Roller();
      const result = roller.rollExpressionDetailed(expression);
      
      if (isVerbose) {
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
      } else {
        console.log(result.result);
      }
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollDice(dice: string) {
  try {
    const roller = new Roller();
    
    // Parse dice notation (e.g., "d20", "3d6") or complex expressions with parentheses
    if (dice.match(/^\d*d\d+$/) && !isExplain) {
      // Simple dice notation - use existing logic (but not for explain mode)
      if (isVerbose) {
        const detailedResult = roller.rollExpressionDetailed(dice);
        console.log(`🎲 Rolling ${dice}: ${detailedResult.result}`);
        console.log(`📈 Range: ${detailedResult.minValue}-${detailedResult.maxValue}`);
        
        // Show individual rolls if available
        const dicePart = detailedResult.parts.find(p => p.type === 'dice');
        if (dicePart && dicePart.rolls) {
          console.log(`📊 Individual rolls: ${dicePart.rolls.join(', ')}`);
        }
      } else {
        const result = roller.rollExpression(dice);
        console.log(result);
      }
    } else {
      // Try to parse as a complex expression (with parentheses, etc.)
      try {
        const expression = new DiceExpression(dice);
        
        if (isExplain) {
          // Show detailed step-by-step explanation
          const explanation = expression.evaluateWithExplanation(dice);
          console.log(`🎯 Expression: ${explanation.originalExpression}`);
          console.log(`🔍 Tokenization: [${explanation.tokenization.join(', ')}]`);
          console.log(`📝 Parsing: ${explanation.parsing}`);
          console.log('');
          console.log('📊 Step-by-step evaluation:');
          explanation.steps.forEach(step => {
            console.log(`  ${step.step}. ${step.operation}`);
            console.log(`     → ${step.description}`);
            if (step.details) {
              console.log(`     📋 ${step.details}`);
            }
            console.log('');
          });
          console.log(`🏆 Final Result: ${explanation.finalResult}`);
        } else {
          const result = expression.evaluate();
          
          if (isVerbose) {
            console.log(`🎲 Rolling ${dice}: ${result}`);
            console.log(`📈 Range: ${expression.minValue}-${expression.maxValue}`);
            console.log(`📊 Expression: ${expression.toString()}`);
          } else {
            console.log(result);
          }
        }
      } catch (expressionError) {
        console.error(`❌ Invalid dice notation: ${dice}`);
        console.log('Use format like: d20, 3d6, 2d8, (2d6+3)*2, etc.');
        process.exit(1);
      }
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
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${dice} with Advantage: ${result.result}`);
      console.log(`📊 Rolls: ${result.rolls.join(', ')} (taking higher)`);
    } else {
      console.log(result.result);
    }
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
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${dice} with Disadvantage: ${result.result}`);
      console.log(`📊 Rolls: ${result.rolls.join(', ')} (taking lower)`);
    } else {
      console.log(result.result);
    }
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
    
    if (isVerbose) {
      console.log(`🎲 Rolling exploding ${expression}: ${result.result}`);
      console.log(`📊 Rolls: ${result.rolls.join(', ')} (${result.explosions} explosions)`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollSuccessPool(countStr: string, sidesStr: string, thresholdStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    const threshold = parseInt(thresholdStr, 10);
    
    if (isNaN(count) || isNaN(sides) || isNaN(threshold)) {
      throw new Error('Count, sides, and threshold must be valid numbers');
    }
    
    // Parse flags
    let botchOn: number | undefined;
    let doubleOn: number | undefined;
    let countBotches = false;
    
    for (let i = 0; i < flags.length; i++) {
      const flag = flags[i];
      if (flag === '--botch' && i + 1 < flags.length) {
        botchOn = parseInt(flags[i + 1], 10);
        if (isNaN(botchOn)) {
          throw new Error('Botch value must be a valid number');
        }
        i++; // Skip the next argument as we consumed it
      } else if (flag === '--double' && i + 1 < flags.length) {
        doubleOn = parseInt(flags[i + 1], 10);
        if (isNaN(doubleOn)) {
          throw new Error('Double value must be a valid number');
        }
        i++;
      } else if (flag === '--count-botches') {
        countBotches = true;
      }
    }
    
    const roller = new Roller();
    const result = roller.rollSuccessPool(count, sides, threshold, {
      botchOn,
      doubleOn,
      countBotches
    });
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides}, threshold ${threshold}:`);
      console.log(`🎯 Successes: ${result.successes}`);
      if (result.botches > 0) {
        console.log(`💀 Botches: ${result.botches}`);
      }
      if (countBotches) {
        console.log(`📊 Net Successes: ${result.netSuccesses}`);
      }
      console.log(`🎲 Rolls: ${result.rolls.join(', ')}`);
      
      // Show breakdown by type
      const breakdown = result.details.reduce((acc, detail) => {
        acc[detail.type] = (acc[detail.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log(`📋 Breakdown: ${Object.entries(breakdown)
        .map(([type, count]) => {
          if (type === 'success' && count !== 1) {
            return `${count} ${type}es`;
          } else {
            const plural = count === 1 ? '' : 's';
            return `${count} ${type}${plural}`;
          }
        })
        .join(', ')}`);
    } else {
      console.log(countBotches ? result.netSuccesses : result.successes);
    }
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

function rollScrumDie() {
  try {
    const scrumDie = DicePresets.createScrumPlanningDie();
    const result = scrumDie.roll();
    
    if (isExplain) {
      console.log(`🎯 Expression: scrum`);
      console.log(`🔍 Tokenization: [scrum]`);
      console.log(`📝 Parsing: Scrum planning die with custom values`);
      console.log('');
      console.log('📊 Step-by-step evaluation:');
      console.log(`  1. Scrum Die = ${result}`);
      console.log(`     → roll 1 custom Scrum planning die`);
      console.log(`     📋 Possible values: [1, 2, 3, 5, 8, 13, 20, ?]`);
      console.log('');
      console.log(`🏆 Final Result: ${result}`);
    } else if (isVerbose) {
      console.log(`🎲 Rolling Scrum Planning Die: ${result}`);
      console.log(`📋 Possible values: 1, 2, 3, 5, 8, 13, 20, ?`);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollFibonacciDie() {
  try {
    const fibDie = DicePresets.createFibonacciDie();
    const result = fibDie.roll();
    
    if (isExplain) {
      console.log(`🎯 Expression: fibonacci`);
      console.log(`🔍 Tokenization: [fibonacci]`);
      console.log(`📝 Parsing: Fibonacci sequence die with custom values`);
      console.log('');
      console.log('📊 Step-by-step evaluation:');
      console.log(`  1. Fibonacci Die = ${result}`);
      console.log(`     → roll 1 custom Fibonacci sequence die`);
      console.log(`     📋 Possible values: [0, 1, 1, 2, 3, 5, 8, 13]`);
      console.log('');
      console.log(`🏆 Final Result: ${result}`);
    } else if (isVerbose) {
      console.log(`🎲 Rolling Fibonacci Die: ${result}`);
      console.log(`📋 Possible values: 0, 1, 1, 2, 3, 5, 8, 13`);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function flipCoin() {
  try {
    const coinDie = DicePresets.createCoinDie();
    const result = coinDie.roll();
    
    if (isExplain) {
      console.log(`🎯 Expression: coin`);
      console.log(`🔍 Tokenization: [coin]`);
      console.log(`📝 Parsing: Binary coin flip with two outcomes`);
      console.log('');
      console.log('📊 Step-by-step evaluation:');
      console.log(`  1. Coin Flip = ${result}`);
      console.log(`     → flip 1 standard coin`);
      console.log(`     📋 Possible values: [Heads, Tails]`);
      console.log('');
      console.log(`🏆 Final Result: ${result}`);
    } else if (isVerbose) {
      console.log(`🪙 Flipping coin: ${result}`);
      console.log(`📋 Possible values: Heads, Tails`);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollMagic8Ball() {
  try {
    const magic8Die = DicePresets.createMagic8BallDie();
    const result = magic8Die.roll();
    
    if (isExplain) {
      console.log(`🎯 Expression: magic8`);
      console.log(`🔍 Tokenization: [magic8]`);
      console.log(`📝 Parsing: Magic 8-Ball die with 8 mystical responses`);
      console.log('');
      console.log('📊 Step-by-step evaluation:');
      console.log(`  1. Magic 8-Ball = "${result}"`);
      console.log(`     → roll 1 mystical Magic 8-Ball`);
      console.log(`     📋 Possible responses: [Yes, No, Maybe, Ask again later, Definitely, Absolutely not, Signs point to yes, Cannot predict now]`);
      console.log('');
      console.log(`🏆 Final Result: ${result}`);
    } else if (isVerbose) {
      console.log(`🎱 Magic 8-Ball says: ${result}`);
      console.log(`📋 Possible responses: Yes, No, Maybe, Ask again later, Definitely, Absolutely not, Signs point to yes, Cannot predict now`);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollYesNo() {
  try {
    const yesNoDie = DicePresets.createTextDie(['Yes', 'No']);
    const result = yesNoDie.roll();
    
    if (isExplain) {
      console.log(`🎯 Expression: yesno`);
      console.log(`🔍 Tokenization: [yesno]`);
      console.log(`📝 Parsing: Binary decision die for yes/no questions`);
      console.log('');
      console.log('📊 Step-by-step evaluation:');
      console.log(`  1. Yes/No Die = ${result}`);
      console.log(`     → roll 1 binary decision die`);
      console.log(`     📋 Possible values: [Yes, No]`);
      console.log('');
      console.log(`🏆 Final Result: ${result}`);
    } else if (isVerbose) {
      console.log(`🎯 Decision: ${result}`);
      console.log(`📋 Possible values: Yes, No`);
    } else {
      console.log(result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollPenetratingDice(countStr: string, sidesStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    
    if (isNaN(count) || isNaN(sides)) {
      throw new Error('Count and sides must be valid numbers');
    }
    
    // Parse flags
    let maxExplosions = 10;
    for (let i = 0; i < flags.length; i++) {
      if (flags[i] === '--max-explosions' && i + 1 < flags.length) {
        maxExplosions = parseInt(flags[i + 1], 10);
        if (isNaN(maxExplosions)) {
          throw new Error('Max explosions must be a valid number');
        }
        i++;
      }
    }
    
    const roller = new Roller();
    const result = roller.rollPenetrating(count, sides, maxExplosions);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides} (penetrating):`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`💥 Penetrations: ${result.penetrations}`);
      console.log(`🎲 Rolls: ${result.rolls.join(', ')}`);
      console.log(`📋 Original rolls: ${result.originalRolls.join(', ')}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollCompoundingDice(countStr: string, sidesStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    
    if (isNaN(count) || isNaN(sides)) {
      throw new Error('Count and sides must be valid numbers');
    }
    
    // Parse flags
    let maxExplosions = 10;
    for (let i = 0; i < flags.length; i++) {
      if (flags[i] === '--max-explosions' && i + 1 < flags.length) {
        maxExplosions = parseInt(flags[i + 1], 10);
        if (isNaN(maxExplosions)) {
          throw new Error('Max explosions must be a valid number');
        }
        i++;
      }
    }
    
    const roller = new Roller();
    const result = roller.rollCompounding(count, sides, maxExplosions);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides} (compounding):`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`💥 Total explosions: ${result.totalExplosions}`);
      console.log(`🎲 Compounded dice: ${result.compoundedRolls.join(', ')}`);
      console.log(`📋 All rolls: ${result.allRolls.map(rolls => `[${rolls.join(', ')}]`).join(', ')}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollStepDice(dieStr: string, stepsStr: string, flags: string[]) {
  try {
    const baseDie = parseInt(dieStr, 10);
    const steps = parseInt(stepsStr, 10);
    
    if (isNaN(baseDie) || isNaN(steps)) {
      throw new Error('Base die and steps must be valid numbers');
    }
    
    const roller = new Roller();
    const result = roller.rollStepDice(baseDie, steps);
    
    if (isVerbose) {
      console.log(`🎲 Step dice: d${baseDie} ${formatStepsDisplay(steps)} steps:`);
      console.log(`🎯 Final die: ${formatDieModifier(result.finalDie, result.modifier)}`);
      console.log(`🎲 Rolled: ${result.rolled}`);
      if (result.aced) {
        console.log(`🔥 Aced! Rolls: ${result.aceRolls?.join(', ')}`);
      }
      console.log(`📊 Final result: ${result.result}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollKeepHighest(countStr: string, sidesStr: string, keepStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    const keep = parseInt(keepStr, 10);
    
    if (isNaN(count) || isNaN(sides) || isNaN(keep)) {
      throw new Error('Count, sides, and keep must be valid numbers');
    }
    
    const roller = new Roller();
    const result = roller.rollKeepHighest(count, sides, keep);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides}, keeping highest ${keep}:`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`✅ Kept: ${result.kept.join(', ')}`);
      console.log(`❌ Dropped: ${result.dropped.join(', ')}`);
      console.log(`📊 Total of all dice: ${result.total}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollKeepLowest(countStr: string, sidesStr: string, keepStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    const keep = parseInt(keepStr, 10);
    
    if (isNaN(count) || isNaN(sides) || isNaN(keep)) {
      throw new Error('Count, sides, and keep must be valid numbers');
    }
    
    const roller = new Roller();
    const result = roller.rollKeepLowest(count, sides, keep);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides}, keeping lowest ${keep}:`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`✅ Kept: ${result.kept.join(', ')}`);
      console.log(`❌ Dropped: ${result.dropped.join(', ')}`);
      console.log(`📊 Total of all dice: ${result.total}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollKeepMiddle(countStr: string, sidesStr: string, keepStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    const keep = parseInt(keepStr, 10);
    
    if (isNaN(count) || isNaN(sides) || isNaN(keep)) {
      throw new Error('Count, sides, and keep must be valid numbers');
    }
    
    const roller = new Roller();
    const result = roller.rollKeepMiddle(count, sides, keep);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides}, keeping middle ${keep}:`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`✅ Kept: ${result.kept.join(', ')}`);
      console.log(`❌ Dropped: ${result.dropped.join(', ')}`);
      console.log(`🎲 All rolls: ${result.allRolls.join(', ')}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollDropHighest(countStr: string, sidesStr: string, dropStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    const drop = parseInt(dropStr, 10);
    
    if (isNaN(count) || isNaN(sides) || isNaN(drop)) {
      throw new Error('Count, sides, and drop must be valid numbers');
    }
    
    const roller = new Roller();
    const result = roller.rollDropHighest(count, sides, drop);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides}, dropping highest ${drop}:`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`✅ Kept: ${result.kept.join(', ')}`);
      console.log(`❌ Dropped: ${result.dropped.join(', ')}`);
      console.log(`🎲 All rolls: ${result.allRolls.join(', ')}`);
    } else {
      console.log(result.result);
    }
  } catch (error) {
    console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

function rollDropLowest(countStr: string, sidesStr: string, dropStr: string, flags: string[]) {
  try {
    const count = parseInt(countStr, 10);
    const sides = parseInt(sidesStr, 10);
    const drop = parseInt(dropStr, 10);
    
    if (isNaN(count) || isNaN(sides) || isNaN(drop)) {
      throw new Error('Count, sides, and drop must be valid numbers');
    }
    
    const roller = new Roller();
    const result = roller.rollDropLowest(count, sides, drop);
    
    if (isVerbose) {
      console.log(`🎲 Rolling ${count}d${sides}, dropping lowest ${drop}:`);
      console.log(`🎯 Result: ${result.result}`);
      console.log(`✅ Kept: ${result.kept.join(', ')}`);
      console.log(`❌ Dropped: ${result.dropped.join(', ')}`);
      console.log(`🎲 All rolls: ${result.allRolls.join(', ')}`);
    } else {
      console.log(result.result);
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

// Parse verbose flag
const verboseIndex = args.findIndex(arg => arg === '--verbose' || arg === '-v');
if (verboseIndex !== -1) {
  isVerbose = true;
  args.splice(verboseIndex, 1);
}

// Parse explain flag
const explainIndex = args.findIndex(arg => arg === '--explain' || arg === '-e');
if (explainIndex !== -1) {
  isExplain = true;
  args.splice(explainIndex, 1);
}

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
    
  case 'scrum':
    rollScrumDie();
    break;
    
  case 'fibonacci':
  case 'fib':
    rollFibonacciDie();
    break;
    
  case 'coin':
  case 'flip':
    flipCoin();
    break;
    
  case 'magic8':
  case '8ball':
  case 'magic8ball':
    rollMagic8Ball();
    break;
    
  case 'yesno':
  case 'yn':
  case 'decision':
    rollYesNo();
    break;
    
  case 'success':
  case 'pool':
    if (args.length < 4) {
      console.error('❌ Please specify count, sides, and threshold (e.g., success 8 10 6)');
      process.exit(1);
    }
    rollSuccessPool(args[1], args[2], args[3], args.slice(4));
    break;
    
  case 'penetrating':
    if (args.length < 3) {
      console.error('❌ Please specify count and sides (e.g., penetrating 3 6)');
      process.exit(1);
    }
    rollPenetratingDice(args[1], args[2], args.slice(3));
    break;
    
  case 'compounding':
    if (args.length < 3) {
      console.error('❌ Please specify count and sides (e.g., compounding 4 8)');
      process.exit(1);
    }
    rollCompoundingDice(args[1], args[2], args.slice(3));
    break;
    
  case 'step':
    if (args.length < 3) {
      console.error('❌ Please specify base die and steps (e.g., step 6 2)');
      process.exit(1);
    }
    rollStepDice(args[1], args[2], args.slice(3));
    break;
    
  case 'keep-highest':
    if (args.length < 4) {
      console.error('❌ Please specify count, sides, and keep (e.g., keep-highest 4 6 3)');
      process.exit(1);
    }
    rollKeepHighest(args[1], args[2], args[3], args.slice(4));
    break;
    
  case 'keep-lowest':
    if (args.length < 4) {
      console.error('❌ Please specify count, sides, and keep (e.g., keep-lowest 4 6 3)');
      process.exit(1);
    }
    rollKeepLowest(args[1], args[2], args[3], args.slice(4));
    break;
    
  case 'keep-middle':
    if (args.length < 4) {
      console.error('❌ Please specify count, sides, and keep (e.g., keep-middle 5 6 3)');
      process.exit(1);
    }
    rollKeepMiddle(args[1], args[2], args[3], args.slice(4));
    break;
    
  case 'drop-highest':
    if (args.length < 4) {
      console.error('❌ Please specify count, sides, and drop (e.g., drop-highest 4 6 1)');
      process.exit(1);
    }
    rollDropHighest(args[1], args[2], args[3], args.slice(4));
    break;
    
  case 'drop-lowest':
    if (args.length < 4) {
      console.error('❌ Please specify count, sides, and drop (e.g., drop-lowest 4 6 1)');
      process.exit(1);
    }
    rollDropLowest(args[1], args[2], args[3], args.slice(4));
    break;
    
  default:
    // Treat the first argument as a dice expression
    rollExpression(args.join(' '));
    break;
}
