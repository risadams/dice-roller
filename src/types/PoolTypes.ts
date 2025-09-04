/**
 * Type definitions for success pool systems
 */

export interface SuccessPoolOptions {
  botchOn?: number;
  doubleOn?: number;
  countBotches?: boolean;
}

export interface SuccessPoolResult {
  successes: number;
  botches: number;
  rolls: number[];
  netSuccesses?: number;
}

export interface TargetNumberDie {
  sides: number;
  target: number;
  botchOn?: number;
  doubleOn?: number;
}

export interface TargetNumberResult {
  hits: number;
  criticals: number;
  total: number;
  results: Array<{
    roll: number;
    hit: boolean;
    critical: boolean;
    margin: number;
  }>;
}

export interface VariablePoolDie {
  sides: number;
  threshold: number;
  botchOn?: number;
  doubleOn?: number;
}

export interface VariablePoolResult {
  successes: number;
  botches: number;
  results: Array<{
    roll: number;
    success: boolean;
    botch: boolean;
    double: boolean;
  }>;
}
