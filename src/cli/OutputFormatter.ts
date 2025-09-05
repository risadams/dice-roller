/**
 * Handles all output formatting for CLI commands
 * Centralizes display logic and provides consistent formatting across all commands
 */

export interface DiceRollOutput {
  result: number | string;
  verbose?: {
    expression?: string;
    range?: string;
    details?: string[];
    rolls?: number[];
    kept?: number[];
    dropped?: number[];
    total?: number;
    allRolls?: number[];
  };
  explanation?: {
    originalExpression: string;
    tokenization: string[];
    parsing: string;
    steps: Array<{
      step: number;
      operation: string;
      description: string;
      details?: string;
    }>;
    finalResult: string;
  };
}

export class OutputFormatter {
  
  /**
   * Formats standard dice roll output
   */
  static formatDiceRoll(
    output: DiceRollOutput,
    isVerbose: boolean = false,
    isExplain: boolean = false
  ): void {
    if (isExplain && output.explanation) {
      this.formatExplanation(output.explanation);
    } else if (isVerbose && output.verbose) {
      this.formatVerboseOutput(output);
    } else {
      console.log(output.result);
    }
  }

  /**
   * Formats detailed explanation output
   */
  private static formatExplanation(explanation: DiceRollOutput['explanation']): void {
    if (!explanation) return;

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
  }

  /**
   * Formats verbose output with additional details
   */
  private static formatVerboseOutput(output: DiceRollOutput): void {
    if (!output.verbose) return;

    const v = output.verbose;
    
    if (v.expression) {
      console.log(`🎲 ${v.expression}: ${output.result}`);
    }
    
    if (v.range) {
      console.log(`📈 Range: ${v.range}`);
    }
    
    if (v.rolls && v.rolls.length > 0) {
      console.log(`📊 Rolls: ${v.rolls.join(', ')}`);
    }
    
    if (v.kept && v.kept.length > 0) {
      console.log(`✅ Kept: ${v.kept.join(', ')}`);
    }
    
    if (v.dropped && v.dropped.length > 0) {
      console.log(`❌ Dropped: ${v.dropped.join(', ')}`);
    }
    
    if (v.allRolls && v.allRolls.length > 0) {
      console.log(`🎲 All rolls: ${v.allRolls.join(', ')}`);
    }
    
    if (v.total !== undefined) {
      console.log(`📊 Total of all dice: ${v.total}`);
    }
    
    if (v.details && v.details.length > 0) {
      v.details.forEach(detail => console.log(detail));
    }
  }

  /**
   * Formats error messages consistently
   */
  static formatError(message: string): void {
    console.error(`❌ ${message}`);
  }

  /**
   * Formats success pool output
   */
  static formatSuccessPool(
    count: number,
    sides: number,
    threshold: number,
    result: any,
    isVerbose: boolean = false
  ): void {
    if (isVerbose) {
      console.log(`🎯 Rolling ${count}d${sides}, counting successes >= ${threshold}:`);
      console.log(`🏆 Successes: ${result.successes}`);
      console.log(`📊 Rolls: ${result.rolls.join(', ')}`);
      
      if (result.botches !== undefined) {
        console.log(`💀 Botches: ${result.botches}`);
      }
      
      if (result.doubles !== undefined) {
        console.log(`⚡ Double successes: ${result.doubles}`);
      }
      
      if (result.netSuccesses !== undefined) {
        console.log(`🎯 Net successes: ${result.netSuccesses}`);
      }
    } else {
      console.log(result.successes);
    }
  }

  /**
   * Formats statistics output
   */
  static formatStatistics(stats: any, expression: string): void {
    console.log(`📊 Statistics for "${expression}":`);
    console.log(`📈 Range: ${stats.min} - ${stats.max}`);
    console.log(`📊 Average: ${stats.average.toFixed(2)}`);
    console.log(`📊 Standard Deviation: ${stats.standardDeviation.toFixed(2)}`);
    console.log(`📊 Median: ${stats.median}`);
    console.log(`📊 Mode: ${stats.mode.join(', ')}`);
    
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
  }

  /**
   * Formats help output
   */
  static formatHelp(): void {
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
  --count-botches                      Subtract botches from successes (default: false)

Advanced Mechanics:
  penetrating <count> <sides>          Savage Worlds style penetrating dice
  compounding <count> <sides>          Compounding explosion dice
  step <die> <steps>                   Savage Worlds step system (±steps)

Keep/Drop Mechanics:
  keep-highest <count> <sides> <keep>  Roll dice and keep highest results
  keep-lowest <count> <sides> <keep>   Roll dice and keep lowest results
  keep-middle <count> <sides> <keep>   Roll dice and keep middle results
  drop-highest <count> <sides> <drop>  Roll dice and drop highest results
  drop-lowest <count> <sides> <drop>   Roll dice and drop lowest results

Custom Dice:
  scrum                                Scrum planning die (1,2,3,5,8,13,20,?)
  fibonacci                            Fibonacci sequence die (0,1,1,2,3,5,8,13)
  coin                                 Standard coin flip (Heads/Tails)
  magic8                               Magic 8-Ball responses
  yesno                                Yes/No decision die
`);
  }

  /**
   * Formats version output
   */
  static formatVersion(version: string): void {
    console.log(`Dice Roller v${version}`);
  }

  /**
   * Formats demo output
   */
  static formatDemo(roller: any): void {
    console.log('🎲 Dice Roller Interactive Demo');
    console.log('='.repeat(50));
    
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

  /**
   * Formats step count display with proper sign
   */
  static formatStepsDisplay(steps: number): string {
    return steps >= 0 ? `+${steps}` : `${steps}`;
  }

  /**
   * Formats die modifier display for step dice
   */
  static formatDieModifier(finalDie: number, modifier: number): string {
    if (modifier === 0) {
      return `d${finalDie}`;
    }
    
    const sign = modifier > 0 ? '+' : '';
    return `d${finalDie}${sign}${modifier}`;
  }
}
