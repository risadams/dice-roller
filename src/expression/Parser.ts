import { DiceExpressionPart } from '../DiceExpressionPart';
import {
  Token,
  TokenType,
  ParsedToken,
  DiceToken,
  NumberToken,
  OperatorToken,
  ConditionalToken,
  ParenthesisToken,
  RerollToken,
  OperatorType,
  ConditionalOperator,
  RerollType,
  ExpressionNode,
  NumberNode,
  DiceNode,
  BinaryOperationNode,
  ParenthesesNode,
  ConditionalDiceNode,
  RerollDiceNode,
  ParseError,
  TokenizationError
} from './types';

/**
 * Parser configuration constants
 */
const PARSER_CONFIG = {
  /** Maximum expression length to prevent ReDoS attacks */
  MAX_EXPRESSION_LENGTH: 1000,
} as const;

/**
 * Expression parser responsible for tokenization and AST generation
 * 
 * Responsibilities:
 * - Tokenize dice expressions into structured tokens
 * - Parse tokens into Abstract Syntax Tree (AST)
 * - Validate expression structure and syntax
 * - Handle operator precedence and associativity
 * - Support complex dice notation with modifiers
 */
export class Parser {
  private static config = PARSER_CONFIG;
  
  /**
   * Configure parser limits
   */
  public static configure(options: Partial<typeof PARSER_CONFIG>): void {
    Parser.config = { ...Parser.config, ...options };
  }

  /**
   * Parse a dice expression string into an AST
   * @param expression The dice expression to parse (e.g., "3d6+5", "2d20-1d4")
   * @returns The root AST node representing the parsed expression
   */
  public parse(expression: string): ExpressionNode {
    // Validate input length to prevent ReDoS attacks
    if (expression.length > Parser.config.MAX_EXPRESSION_LENGTH) {
      throw new ParseError(`Expression too long (maximum ${Parser.config.MAX_EXPRESSION_LENGTH} characters)`, 0);
    }

    // Clean the expression (remove spaces but preserve case)
    const cleanExpression = expression.replace(/\s/g, '');
    const tokens = this.tokenize(cleanExpression);
    
    if (tokens.length === 0) {
      throw new ParseError('Empty expression', 0);
    }

    // Parse tokens into AST
    const tokenStream = new TokenStream(tokens);
    const ast = this.parseExpression(tokenStream);
    
    // Ensure all tokens are consumed
    if (!tokenStream.isAtEnd()) {
      throw new ParseError(`Unexpected token: ${tokenStream.peek().value}`, tokenStream.position(), tokenStream.peek().value);
    }

    return ast;
  }

  /**
   * Tokenize the expression into structured tokens
   * @param expression The clean expression string to tokenize
   * @returns Array of tokens representing the expression components
   */
  public tokenize(expression: string): ParsedToken[] {
    if (!expression) {
      return [];
    }

    // Define named regex patterns for each token type (case-insensitive for dice notation)
    const tokenPatterns: { type: string; regex: RegExp }[] = [
      // Conditional dice: e.g., 3d6>4, 2d8<=5, 4d10>=7 (must come before plain dice)
      { type: 'conditional', regex: /^\d*[dD]\d+(?:<=|>=|==|<>|[<>=])\d+/ },
      // Dice notation: e.g., 3d6, d20, 2d8r1, 4d6ro<2, 2d10rr>=3
      { type: 'dice', regex: /^\d*[dD]\d+(?:r(?:r|o)?(?:<=|>=|[<>=])?\d+)?/ },
      // Operators: +, -, *, /
      { type: 'operator', regex: /^[+\-*/]/ },
      // Parentheses: ( or )
      { type: 'parenthesis', regex: /^[()]/ },
      // Number: e.g., 42
      { type: 'number', regex: /^\d+/ },
    ];

    const tokens: ParsedToken[] = [];
    let position = 0;
    let expr = expression;

    while (expr.length > 0) {
      let matched = false;
      for (const { type, regex } of tokenPatterns) {
        const match = expr.match(regex);
        if (match) {
          const value = match[0];
          const token = this.createToken(value, position);
          tokens.push(token);
          position += value.length;
          expr = expr.slice(value.length);
          matched = true;
          break;
        }
      }
      if (!matched) {
        throw new TokenizationError(`Invalid dice expression syntax`, position, expr);
      }
    }

    return tokens;
  }

  /**
   * Create a structured token from a string match
   */
  private createToken(match: string, position: number): ParsedToken {
    // Check token type and create appropriate token
    if (match.match(/^\d*[dD]\d+(?:<=|>=|==|[<>=])\d+$/)) {
      // Conditional dice like "3d6>4" or "3D6>4"
      return this.createConditionalDiceToken(match, position);
    } else if (match.match(/^\d*[dD]\d+/)) {
      return this.createDiceToken(match, position);
    } else if (match.match(/^[+\-*/]$/)) {
      return {
        type: 'operator',
        value: match,
        position,
        length: match.length,
        operator: match as OperatorType
      } as OperatorToken;
    } else if (match === '(') {
      return {
        type: 'parenthesis',
        value: match,
        position,
        length: match.length,
        parenthesis: '('
      } as ParenthesisToken;
    } else if (match === ')') {
      return {
        type: 'parenthesis',
        value: match,
        position,
        length: match.length,
        parenthesis: ')'
      } as ParenthesisToken;
    } else if (match.match(/^\d+$/)) {
      const value = parseInt(match, 10);
      if (isNaN(value)) {
        throw new TokenizationError(`Invalid constant: ${match}`, position, match);
      }
      return {
        type: 'number',
        value: match,
        position,
        length: match.length,
        numericValue: value
      } as NumberToken;
    } else if (match.match(/^(<=|>=|==|[<>=])\d+$/)) {
      const opMatch = match.match(/^(<=|>=|==|[<>=])(\d+)$/);
      if (!opMatch) {
        throw new TokenizationError(`Invalid conditional syntax: ${match}`, position, match);
      }
      return {
        type: 'conditional',
        value: match,
        position,
        length: match.length,
        operator: opMatch[1] as ConditionalOperator,
        threshold: parseInt(opMatch[2], 10)
      } as ConditionalToken;
    } else if (match.match(/^(<=|>=|==|[<>=])$/)) {
      return {
        type: 'conditional',
        value: match,
        position,
        length: match.length,
        operator: match as ConditionalOperator,
        threshold: 0 // Will be set later when combined with dice
      } as ConditionalToken;
    } else {
      throw new TokenizationError(`Unrecognized token: ${match}`, position, match);
    }
  }

  /**
   * Create a dice token with proper parsing of modifiers
   */
  private createDiceToken(match: string, position: number): DiceToken | (ConditionalToken & { count: number; sides: number }) | (RerollToken & { count: number; sides: number }) {
    // Extract basic dice notation first (case-insensitive)
    const diceMatch = match.match(/^(\d*)[dD](\d+)/);
    if (!diceMatch) {
      throw new TokenizationError(`Invalid dice notation: ${match}`, position, match);
    }

    const count = diceMatch[1] === '' ? 1 : parseInt(diceMatch[1], 10);
    const sides = parseInt(diceMatch[2], 10);

    if (isNaN(count) || isNaN(sides) || count <= 0 || sides <= 0) {
      if (count <= 0) {
        throw new TokenizationError(`At least one die is required, got ${count} dice`, position, match);
      }
      throw new TokenizationError(`Invalid dice notation: ${match}`, position, match);
    }

    // Check for modifiers after basic dice notation
    const remaining = match.substring(diceMatch[0].length);
    
    if (remaining.length === 0) {
      // Simple dice token
      return {
        type: 'dice',
        value: match,
        position,
        length: match.length,
        count,
        sides
      } as DiceToken;
    }

    // Check for reroll mechanics first (r, ro, rr)
    const rerollMatch = remaining.match(/^r(?:r|o)?(?:<=|>=|[<>=])?\d+/);
    if (rerollMatch) {
      const rerollData = this.parseRerollMechanics(rerollMatch[0]);
      return {
        type: 'reroll',
        value: match,
        position,
        length: match.length,
        rerollType: rerollData.type,
        condition: rerollData.condition,
        threshold: rerollData.threshold,
        // Add dice info to the token
        count,
        sides
      } as RerollToken & { count: number; sides: number };
    }
    
    // Check for conditional operators (>, >=, etc.)
    const conditionalMatch = remaining.match(/^([<>=]+)(\d+)/);
    if (conditionalMatch) {
      const operator = conditionalMatch[1];
      const threshold = parseInt(conditionalMatch[2], 10);
      
      // Validate operator
      if (!['>', '>=', '<', '<=', '=', '=='].includes(operator)) {
        throw new TokenizationError(`Invalid conditional operator: ${operator}`, position, match);
      }
      
      return {
        type: 'conditional',
        value: match,
        position,
        length: match.length,
        operator: operator as ConditionalOperator,
        threshold,
        // Add dice info to the token
        count,
        sides
      } as ConditionalToken & { count: number; sides: number };
    }
    
    // If we get here, it's an unrecognized modifier
    throw new TokenizationError(`Unrecognized dice modifier: ${remaining}`, position, match);
  }

  /**
   * Create a conditional dice token (e.g., "3d6>4")
   */
  private createConditionalDiceToken(match: string, position: number): ConditionalToken {
    const conditionalMatch = match.match(/^(\d*)[dD](\d+)(<=|>=|==|<>|[<>=])(\d+)$/);
    if (!conditionalMatch) {
      throw new TokenizationError(`Invalid conditional dice notation: ${match}`, position, match);
    }

    const count = conditionalMatch[1] === '' ? 1 : parseInt(conditionalMatch[1], 10);
    const sides = parseInt(conditionalMatch[2], 10);
    const operator = conditionalMatch[3];
    const threshold = parseInt(conditionalMatch[4], 10);

    // Check for invalid operators
    if (operator === '<>') {
      throw new TokenizationError(`Invalid conditional operator: ${operator}`, position, match);
    }

    if (isNaN(count) || isNaN(sides) || isNaN(threshold) || count <= 0 || sides <= 0) {
      throw new TokenizationError(`Invalid conditional dice notation: ${match}`, position, match);
    }

    return {
      type: 'conditional',
      value: match,
      position,
      length: match.length,
      operator: operator as ConditionalOperator,
      threshold,
      count,
      sides
    } as ConditionalToken & { count: number; sides: number };
  }

  /**
   * Parse reroll mechanics (r1, ro<2, rr1, etc.)
   */
  private parseRerollMechanics(mechanics: string): { type: RerollType, condition: string, threshold: number } {
    const rerollMatch = mechanics.match(/^r(r|o)?(<=|>=|[<>=])?(\d+)$/);
    if (!rerollMatch) {
      throw new TokenizationError(`Invalid reroll mechanics: ${mechanics}`, 0, mechanics);
    }

    const rerollModifier = rerollMatch[1] || ''; // '', 'r', or 'o'
    const conditionOperator = rerollMatch[2] || '='; // Default to equality if no operator
    const threshold = parseInt(rerollMatch[3], 10);

    // Determine reroll type
    let rerollType: RerollType;
    switch (rerollModifier) {
      case '':
        rerollType = 'exploding'; // Standard reroll (r)
        break;
      case 'o':
        rerollType = 'once'; // Reroll once (ro)
        break;
      case 'r':
        rerollType = 'recursive'; // Reroll recursively (rr)
        break;
      default:
        throw new TokenizationError(`Unknown reroll type: r${rerollModifier}`, 0, mechanics);
    }

    // Validate condition operator
    if (!['', '=', '<', '>', '<=', '>='].includes(conditionOperator)) {
      throw new TokenizationError(`Invalid reroll condition operator: ${conditionOperator}`, 0, mechanics);
    }

    // Build condition string
    const rerollCondition = conditionOperator + threshold;

    return { type: rerollType, condition: rerollCondition, threshold };
  }

  /**
   * Parse expression with operator precedence (recursive descent parser)
   */
  private parseExpression(tokens: TokenStream): ExpressionNode {
    return this.parseAdditionSubtraction(tokens);
  }

  /**
   * Parse addition and subtraction (lowest precedence)
   */
  private parseAdditionSubtraction(tokens: TokenStream): ExpressionNode {
    let left = this.parseMultiplicationDivision(tokens);
    
    while (!tokens.isAtEnd() && tokens.peek().type === 'operator') {
      const operatorToken = tokens.peek() as OperatorToken;
      if (operatorToken.operator !== '+' && operatorToken.operator !== '-') {
        break;
      }
      
      tokens.advance(); // consume operator
      const right = this.parseMultiplicationDivision(tokens);
      
      left = {
        type: 'binary_operation',
        operator: operatorToken.operator,
        left,
        right
      } as BinaryOperationNode;
    }
    
    return left;
  }

  /**
   * Parse multiplication and division (higher precedence)
   */
  private parseMultiplicationDivision(tokens: TokenStream): ExpressionNode {
    let left = this.parsePrimary(tokens);
    
    while (!tokens.isAtEnd() && tokens.peek().type === 'operator') {
      const operatorToken = tokens.peek() as OperatorToken;
      if (operatorToken.operator !== '*' && operatorToken.operator !== '/') {
        break;
      }
      
      tokens.advance(); // consume operator
      const right = this.parsePrimary(tokens);
      
      left = {
        type: 'binary_operation',
        operator: operatorToken.operator,
        left,
        right
      } as BinaryOperationNode;
    }
    
    return left;
  }

  /**
   * Parse primary expressions (dice, constants, parentheses)
   */
  private parsePrimary(tokens: TokenStream): ExpressionNode {
    if (tokens.isAtEnd()) {
      throw new ParseError('Unexpected end of expression', tokens.position());
    }

    const token = tokens.advance();

    switch (token.type) {
      case 'parenthesis':
        const parenToken = token as ParenthesisToken;
        if (parenToken.parenthesis === '(') {
          // Parse parenthesized expression
          const subExpression = this.parseExpression(tokens);
          
          if (tokens.isAtEnd() || (tokens.peek() as ParenthesisToken).parenthesis !== ')') {
            throw new ParseError('Expected closing parenthesis', tokens.position());
          }
          tokens.advance(); // consume ')'
          
          return {
            type: 'parentheses',
            expression: subExpression
          } as ParenthesesNode;
        } else {
          throw new ParseError('Unexpected closing parenthesis', token.position);
        }

      case 'dice':
        const diceToken = token as DiceToken;
        return {
          type: 'dice',
          count: diceToken.count,
          sides: diceToken.sides
        } as DiceNode;

      case 'conditional':
        const conditionalToken = token as ConditionalToken;
        // Handle conditional tokens that include dice data
        if ('count' in conditionalToken && 'sides' in conditionalToken) {
          return {
            type: 'conditional_dice',
            count: (conditionalToken as any).count,
            sides: (conditionalToken as any).sides,
            operator: conditionalToken.operator,
            threshold: conditionalToken.threshold
          } as ConditionalDiceNode;
        }
        throw new ParseError('Standalone conditional operators are not supported', token.position);

      case 'reroll':
        const rerollToken = token as RerollToken;
        // Handle reroll tokens that include dice data
        if ('count' in rerollToken && 'sides' in rerollToken) {
          return {
            type: 'reroll_dice',
            count: (rerollToken as any).count,
            sides: (rerollToken as any).sides,
            rerollType: rerollToken.rerollType,
            condition: rerollToken.condition,
            threshold: rerollToken.threshold
          } as RerollDiceNode;
        }
        throw new ParseError('Standalone reroll operators are not supported', token.position);

      case 'number':
        const numberToken = token as NumberToken;
        return {
          type: 'number',
          value: numberToken.numericValue
        } as NumberNode;

      case 'operator':
        const operatorToken = token as OperatorToken;
        // Handle unary operators (though currently not supported)
        if (operatorToken.operator === '-' || operatorToken.operator === '+') {
          throw new ParseError('Unary operators are not currently supported', token.position);
        }
        throw new ParseError(`Unexpected operator: ${operatorToken.operator}`, token.position);

      default:
        throw new ParseError(`Unrecognized token type: ${token.type}`, token.position);
    }
  }

  /**
   * Convert AST back to DiceExpressionPart[] for backward compatibility
   * @deprecated This method exists for transition period only
   */
  public convertASTToParts(node: ExpressionNode): DiceExpressionPart[] {
    const parts: DiceExpressionPart[] = [];
    this.convertASTToPartsRecursive(node, parts);
    return parts;
  }

  /**
   * Recursive helper for AST to parts conversion
   */
  private convertASTToPartsRecursive(node: ExpressionNode, parts: DiceExpressionPart[]): void {
    switch (node.type) {
      case 'binary_operation':
        const binaryNode = node as BinaryOperationNode;
        this.convertASTToPartsRecursive(binaryNode.left, parts);
        parts.push(DiceExpressionPart.createOperator(binaryNode.operator));
        this.convertASTToPartsRecursive(binaryNode.right, parts);
        break;

      case 'parentheses':
        const parenNode = node as ParenthesesNode;
        const subParts: DiceExpressionPart[] = [];
        this.convertASTToPartsRecursive(parenNode.expression, subParts);
        parts.push(DiceExpressionPart.createParentheses(subParts));
        break;

      case 'dice':
        const diceNode = node as DiceNode;
        parts.push(DiceExpressionPart.createDice(diceNode.count, diceNode.sides));
        break;

      case 'conditional_dice':
        const condNode = node as ConditionalDiceNode;
        parts.push(DiceExpressionPart.createConditionalDice(
          condNode.count,
          condNode.sides,
          condNode.operator,
          condNode.threshold
        ));
        break;

      case 'reroll_dice':
        const rerollNode = node as RerollDiceNode;
        parts.push(DiceExpressionPart.createReroll(
          rerollNode.count,
          rerollNode.sides,
          rerollNode.rerollType,
          rerollNode.condition,
          rerollNode.threshold
        ));
        break;

      case 'number':
        const constantNode = node as NumberNode;
        parts.push(DiceExpressionPart.createConstant(constantNode.value));
        break;

      default:
        throw new ParseError(`Cannot convert AST node type: ${(node as any).type}`, 0);
    }
  }
}

/**
 * Helper class for managing token stream during parsing
 */
class TokenStream {
  private tokens: ParsedToken[];
  private current = 0;

  constructor(tokens: ParsedToken[]) {
    this.tokens = tokens;
  }

  /**
   * Check if we've reached the end of the token stream
   */
  public isAtEnd(): boolean {
    return this.current >= this.tokens.length;
  }

  /**
   * Peek at the current token without consuming it
   */
  public peek(): ParsedToken {
    if (this.isAtEnd()) {
      throw new ParseError('Unexpected end of token stream', this.current);
    }
    return this.tokens[this.current];
  }

  /**
   * Consume and return the current token
   */
  public advance(): ParsedToken {
    if (this.isAtEnd()) {
      throw new ParseError('Unexpected end of token stream', this.current);
    }
    return this.tokens[this.current++];
  }

  /**
   * Look ahead at the next token without consuming it
   */
  public peekNext(): ParsedToken | null {
    if (this.current + 1 >= this.tokens.length) {
      return null;
    }
    return this.tokens[this.current + 1];
  }

  /**
   * Check if the current token matches the expected type
   */
  public match(type: TokenType): boolean {
    if (this.isAtEnd()) {
      return false;
    }
    return this.peek().type === type;
  }

  /**
   * Get the current position in the token stream
   */
  public position(): number {
    return this.current;
  }

  /**
   * Reset the stream to a specific position
   */
  public reset(position: number = 0): void {
    this.current = Math.max(0, Math.min(position, this.tokens.length));
  }
}
