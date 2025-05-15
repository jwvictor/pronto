import {
  CstParser,
  CstNode,
  ParserMethod,
  IParserErrorMessageProvider,
  IToken
} from "chevrotain";
import {
  allTokens,
  Import,
  Prompt,
  As,
  With,
  Input,
  Returns,
  Flow,
  Return,
  If,
  For,
  In,
  Loop,
  And,
  Or,
  Not,
  LCurly,
  RCurly,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Colon,
  Comma,
  Equals,
  Dot,
  LessThan,
  GreaterThan,
  StringLiteral,
  Identifier,
  NumberLiteral,
  BooleanLiteral,
  DoubleEquals,
  NotEquals,
  LessThanEquals,
  GreaterThanEquals,
} from "./lexer.js"; // do not Remove .js extension

// Custom error message provider for better error messages
class PromptLangErrorProvider implements IParserErrorMessageProvider {
  buildMismatchTokenMessage({ expected, actual, previous, ruleName }: any) {
    const expectedMsg = this.formatExpected(expected);
    const actualMsg = this.formatToken(actual);
    const previousMsg = previous ? `after ${this.formatToken(previous)}` : 'at the beginning';
    
    return `Parse error in rule '${ruleName}': Expected ${expectedMsg} but found ${actualMsg} ${previousMsg}`;
  }

  buildNotAllInputParsedMessage({ firstRedundant, ruleName }: any) {
    return `Parse error: Unexpected ${this.formatToken(firstRedundant)} found after parsing rule '${ruleName}'`;
  }

  buildNoViableAltMessage({ expectedPathsPerAlt, actual, previous, customUserDescription, ruleName }: any) {
    const actualMsg = this.formatToken(actual);
    const previousMsg = previous ? `after ${this.formatToken(previous)}` : 'at the beginning';
    const customMsg = customUserDescription ? `\n${customUserDescription}` : '';
    
    return `Parse error in rule '${ruleName}': No viable alternative matches ${actualMsg} ${previousMsg}${customMsg}`;
  }

  buildEarlyExitMessage({ expectedIterationPaths, actual, previous, customUserDescription, ruleName }: any) {
    const actualMsg = this.formatToken(actual);
    const previousMsg = previous ? `after ${this.formatToken(previous)}` : 'at the beginning';
    const customMsg = customUserDescription ? `\n${customUserDescription}` : '';
    
    return `Parse error in rule '${ruleName}': Missing mandatory iteration, found ${actualMsg} ${previousMsg}${customMsg}`;
  }

  private formatExpected(expected: string | string[]) {
    if (Array.isArray(expected)) {
      if (expected.length === 1) {
        return `'${expected[0]}'`;
      } else {
        const lastItem = expected.pop();
        return `one of: ${expected.map(item => `'${item}'`).join(', ')} or '${lastItem}'`;
      }
    } else {
      return `'${expected}'`;
    }
  }

  private formatToken(token: IToken) {
    if (!token) {
      return 'end of input';
    }
    
    // Get meaningful token info
    const tokenType = token.tokenType?.name || 'unknown';
    const value = token.image;
    const line = token.startLine || 0;
    const column = token.startColumn || 0;

    return `'${value}' (type: ${tokenType}) at line ${line}, column ${column}`;
  }
}

class PromptLangParser extends CstParser {
  // Declare all rule methods
  public script!: ParserMethod<[], CstNode>;
  private importStatement!: ParserMethod<[], CstNode>;
  private promptImport!: ParserMethod<[], CstNode>;
  private symbolImport!: ParserMethod<[], CstNode>;
  private flowDefinition!: ParserMethod<[], CstNode>;
  private parameterList!: ParserMethod<[], CstNode>;
  private statement!: ParserMethod<[], CstNode>;
  private expressionStatement!: ParserMethod<[], CstNode>;
  private returnStatement!: ParserMethod<[], CstNode>;
  private ifStatement!: ParserMethod<[], CstNode>;
  private forStatement!: ParserMethod<[], CstNode>;
  private loopStatement!: ParserMethod<[], CstNode>;
  private assignment!: ParserMethod<[], CstNode>;
  private destructuringAssignment!: ParserMethod<[], CstNode>;
  private expression!: ParserMethod<[], CstNode>;
  private typeObject!: ParserMethod<[], CstNode>;
  private type!: ParserMethod<[], CstNode>;
  private functionCall!: ParserMethod<[], CstNode>;
  private argumentList!: ParserMethod<[], CstNode>;
  private objectLiteral!: ParserMethod<[], CstNode>;
  private memberExpression!: ParserMethod<[], CstNode>;
  private primaryExpression!: ParserMethod<[], CstNode>;
  private dotAccess!: ParserMethod<[], CstNode>;
  private arrayLiteral!: ParserMethod<[], CstNode>;
  private logicalExpression!: ParserMethod<[], CstNode>;
  private notExpression!: ParserMethod<[], CstNode>;
  private comparisonExpression!: ParserMethod<[], CstNode>;

  constructor() {
    // Pass the custom error message provider to the parser
    super(allTokens, { 
      errorMessageProvider: new PromptLangErrorProvider(),
      recoveryEnabled: true // Enable error recovery for better diagnostic experience
    });
    const $ = this;

    // Declare all rules first
    $.RULE("script", () => {
      $.MANY(() => {
        $.OR([
          { ALT: () => {
            $.SUBRULE($.importStatement);
          }},
          { ALT: () => {
            $.SUBRULE($.flowDefinition);
          }},
        ]);
      });
    });

    $.RULE("importStatement", () => {
      $.CONSUME(Import);
      $.OR([
        { ALT: () => $.SUBRULE($.promptImport) },
        { ALT: () => $.SUBRULE($.symbolImport) },
      ]);
    });

    $.RULE("promptImport", () => {
      $.CONSUME(Prompt);
      $.CONSUME(StringLiteral);
      $.CONSUME(As);
      $.CONSUME(Identifier);
      $.CONSUME(With);
      $.CONSUME(Input);
      $.SUBRULE($.typeObject);
      $.CONSUME(Returns);
      $.SUBRULE2($.typeObject);
    });

    $.RULE("symbolImport", () => {
      $.CONSUME(LCurly);
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.CONSUME(Identifier);
        },
      });
      $.CONSUME(RCurly);
      $.CONSUME2(Identifier);
      $.CONSUME(StringLiteral);
    });

    $.RULE("flowDefinition", () => {
      $.CONSUME(Flow);
      $.CONSUME(Identifier);
      $.CONSUME(LParen);
      $.OPTION(() => {
        $.SUBRULE($.parameterList);
      });
      $.CONSUME(RParen);
      $.CONSUME(LCurly);
      $.MANY(() => {
        $.SUBRULE($.statement);
      });
      $.CONSUME(RCurly);
    });

    $.RULE("parameterList", () => {
      $.MANY_SEP({
        SEP: Comma,
        DEF: () => {
          $.CONSUME(Identifier);
          $.CONSUME(Colon);
          $.SUBRULE($.type);
        },
      });
    });

    $.RULE("statement", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.returnStatement) },
        { ALT: () => $.SUBRULE($.ifStatement) },
        { ALT: () => $.SUBRULE($.forStatement) },
        { ALT: () => $.SUBRULE($.loopStatement) },
        { ALT: () => $.SUBRULE($.assignment) },
        { 
          GATE: () => this.isDestructuringAssignment(),
          ALT: () => $.SUBRULE($.destructuringAssignment) 
        },
        { ALT: () => $.SUBRULE($.expressionStatement) },
      ]);
    });

    $.RULE("returnStatement", () => {
      $.CONSUME(Return);
      $.SUBRULE($.expression);
    });

    $.RULE("ifStatement", () => {
      $.CONSUME(If);
      $.SUBRULE($.expression);
      $.CONSUME(LCurly);
      $.MANY(() => {
        $.SUBRULE($.statement);
      });
      $.CONSUME(RCurly);
    });

    $.RULE("forStatement", () => {
      $.CONSUME(For);
      $.CONSUME(Identifier);
      $.CONSUME(In);
      $.SUBRULE($.expression);
      $.CONSUME(LCurly);
      $.MANY(() => {
        $.SUBRULE($.statement);
      });
      $.CONSUME(RCurly);
    });

    $.RULE("loopStatement", () => {
      $.CONSUME(Loop);
      $.CONSUME(LCurly);
      $.MANY(() => {
        $.SUBRULE($.statement);
      });
      $.CONSUME(RCurly);
    });

    $.RULE("assignment", () => {
      $.CONSUME(Identifier);
      $.CONSUME(Equals);
      $.SUBRULE($.expression);
    });

    $.RULE("destructuringAssignment", () => {
      $.CONSUME(LCurly);
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.CONSUME(Identifier);
        },
      });
      $.CONSUME(RCurly);
      $.CONSUME(Equals);
      $.SUBRULE($.expression);
    });

    $.RULE("expressionStatement", () => {
      $.SUBRULE($.expression);
    });

    $.RULE("expression", () => {
      $.SUBRULE($.logicalExpression);
    });

    $.RULE("logicalExpression", () => {
      $.SUBRULE($.notExpression);
      $.MANY(() => {
        $.OR([
          {
            ALT: () => {
              $.CONSUME(And);
              $.SUBRULE2($.notExpression);
            }
          },
          {
            ALT: () => {
              $.CONSUME(Or);
              $.SUBRULE3($.notExpression);
            }
          }
        ]);
      });
    });

    $.RULE("notExpression", () => {
      $.OR([
        {
          ALT: () => {
            $.CONSUME(Not);
            $.SUBRULE($.comparisonExpression);
          }
        },
        {
          ALT: () => $.SUBRULE2($.comparisonExpression)
        }
      ]);
    });

    $.RULE("comparisonExpression", () => {
      $.SUBRULE($.primaryExpression);
      $.OPTION(() => {
        $.OR([
          {
            ALT: () => {
              $.CONSUME(DoubleEquals);
              $.SUBRULE2($.primaryExpression);
            }
          },
          {
            ALT: () => {
              $.CONSUME(NotEquals);
              $.SUBRULE3($.primaryExpression);
            }
          },
          {
            ALT: () => {
              $.CONSUME(LessThanEquals);
              $.SUBRULE4($.primaryExpression);
            }
          },
          {
            ALT: () => {
              $.CONSUME(GreaterThanEquals);
              $.SUBRULE5($.primaryExpression);
            }
          },
          {
            ALT: () => {
              $.CONSUME(LessThan);
              $.SUBRULE6($.primaryExpression);
            }
          },
          {
            ALT: () => {
              $.CONSUME(GreaterThan);
              $.SUBRULE7($.primaryExpression);
            }
          },
          {
            ALT: () => $.SUBRULE($.dotAccess)
          }
        ]);
      });
    });

    $.RULE("primaryExpression", () => {
      $.OR([
        { ALT: () => $.SUBRULE($.functionCall) },
        { ALT: () => $.SUBRULE($.objectLiteral) },
        { ALT: () => $.SUBRULE($.arrayLiteral) },
        { ALT: () => $.CONSUME(StringLiteral) },
        { ALT: () => $.CONSUME(NumberLiteral) },
        { ALT: () => $.CONSUME(BooleanLiteral) },
        { ALT: () => $.CONSUME(Identifier) },
      ]);
    });

    $.RULE("dotAccess", () => {
      $.CONSUME(Dot);
      $.CONSUME(Identifier);
      $.OPTION(() => {
        $.CONSUME(LParen);
        $.OPTION2(() => {
          $.SUBRULE($.argumentList);
        });
        $.CONSUME(RParen);
      });
      $.OPTION3(() => {
        $.SUBRULE($.dotAccess);
      });
    });

    $.RULE("objectLiteral", () => {
      $.CONSUME(LCurly);
      $.OPTION(() => {
        $.AT_LEAST_ONE_SEP({
          SEP: Comma,
          DEF: () => {
            $.OR([
              {
                ALT: () => {
                  $.CONSUME(Identifier, { LABEL: "propertyName" });
                  $.CONSUME(Colon);
                  $.SUBRULE($.expression);
                },
              },
              {
                ALT: () => {
                  $.CONSUME2(Identifier, { LABEL: "shorthandProperty" });
                },
              },
            ]);
          },
        });
      });
      $.CONSUME(RCurly);
    });

    $.RULE("typeObject", () => {
      $.CONSUME(LCurly);
      $.OPTION(() => {
        $.AT_LEAST_ONE_SEP({
          SEP: Comma,
          DEF: () => {
            $.CONSUME(Identifier);
            $.CONSUME(Colon);
            $.SUBRULE($.type);
          },
        });
      });
      $.CONSUME(RCurly);
    });

    $.RULE("type", () => {
      $.CONSUME(Identifier);
      $.OPTION(() => {
        $.CONSUME(LessThan);
        $.SUBRULE($.type);
        $.CONSUME(GreaterThan);
      });
    });

    $.RULE("arrayLiteral", () => {
      $.CONSUME(LBracket);
      $.OPTION(() => {
        $.AT_LEAST_ONE_SEP({
          SEP: Comma,
          DEF: () => {
            $.SUBRULE($.expression);
          },
        });
      });
      $.CONSUME(RBracket);
    });

    $.RULE("functionCall", () => {
      $.CONSUME(Identifier);
      $.CONSUME(LParen);
      $.OPTION(() => {
        $.SUBRULE($.argumentList);
      });
      $.CONSUME(RParen);
    });

    $.RULE("argumentList", () => {
      $.AT_LEAST_ONE_SEP({
        SEP: Comma,
        DEF: () => {
          $.SUBRULE($.expression);
        },
      });
    });

    this.performSelfAnalysis();
  }

  // Add a custom lookahead function to detect destructuring assignment patterns
  isDestructuringAssignment() {
    // Check if we have a pattern like { x, y } =
    // We need to look ahead to find the } followed by =
    if (this.LA(1).tokenType !== LCurly) {
      return false;
    }
    
    // Look ahead until we find a closing brace
    let i = 2;
    let braceCount = 1; // Start with one opening brace
    
    while (braceCount > 0 && i < 20) { // Limit lookahead to prevent infinite loop
      const tokenType = this.LA(i).tokenType;
      
      if (tokenType === LCurly) {
        braceCount++;
      } else if (tokenType === RCurly) {
        braceCount--;
      }
      
      i++;
    }
    
    // If we found the closing brace, check if it's followed by =
    if (braceCount === 0) {
      return this.LA(i).tokenType === Equals;
    }
    
    return false;
  }
}

export const parserInstance = new PromptLangParser();
