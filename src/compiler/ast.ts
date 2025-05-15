// AST Node Types
export type Node = 
  | Program
  | ImportStatement
  | PromptImport
  | SymbolImport
  | FlowDefinition
  | Parameter
  | Statement
  | ReturnStatement
  | IfStatement
  | ForStatement
  | LoopStatement
  | Assignment
  | DestructuringAssignment
  | ExpressionStatement
  | Expression
  | FunctionCall
  | MethodCall
  | ObjectLiteral
  | ArrayLiteral
  | MemberExpression
  | Identifier
  | StringLiteral
  | NumberLiteral
  | Type
  | TypeObject
  | BooleanLiteral
  | ComparisonExpression
  | LogicalExpression
  | UnaryExpression;

export interface Program {
  type: 'Program';
  body: (ImportStatement | FlowDefinition)[];
}

export interface ImportStatement {
  type: 'ImportStatement';
  importType: 'prompt' | 'symbol';
  promptImport?: PromptImport;
  symbolImport?: SymbolImport;
}

export interface PromptImport {
  type: 'PromptImport';
  promptPath: string;
  name: Identifier;
  input: TypeObject;
  returns: TypeObject;
}

export interface SymbolImport {
  type: 'SymbolImport';
  symbols: Identifier[];
  from: string;
}

export interface FlowDefinition {
  type: 'FlowDefinition';
  name: Identifier;
  parameters: Parameter[];
  body: Statement[];
}

export interface Parameter {
  type: 'Parameter';
  name: Identifier;
  paramType: Type;
}

export type Statement = 
  | ReturnStatement
  | IfStatement
  | ForStatement
  | LoopStatement
  | Assignment
  | DestructuringAssignment
  | ExpressionStatement;

export interface ReturnStatement {
  type: 'ReturnStatement';
  expression: Expression;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  body: Statement[];
}

export interface ForStatement {
  type: 'ForStatement';
  variable: Identifier;
  iterable: Expression;
  body: Statement[];
}

export interface LoopStatement {
  type: 'LoopStatement';
  body: Statement[];
}

export interface Assignment {
  type: 'Assignment';
  left: Identifier;
  right: Expression;
}

export interface DestructuringAssignment {
  type: 'DestructuringAssignment';
  left: Identifier[];
  right: Expression;
}

export interface ExpressionStatement {
  type: 'ExpressionStatement';
  expression: Expression;
}

export type Expression = 
  | FunctionCall
  | MethodCall
  | ObjectLiteral
  | ArrayLiteral
  | MemberExpression
  | Identifier
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | ComparisonExpression
  | LogicalExpression
  | UnaryExpression;

export interface FunctionCall {
  type: 'FunctionCall';
  callee: Identifier;
  arguments: Expression[];
}

export interface MethodCall {
  type: 'MethodCall';
  object: Expression;
  method: Identifier;
  arguments: Expression[];
}

export interface ObjectLiteral {
  type: 'ObjectLiteral';
  properties: {
    key: Identifier;
    value?: Expression;
    shorthand: boolean;
  }[];
}

export interface ArrayLiteral {
  type: 'ArrayLiteral';
  elements: Expression[];
}

export interface MemberExpression {
  type: 'MemberExpression';
  object: Expression;
  property: Identifier;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export type ComparisonOperator = '==' | '!=' | '<' | '<=' | '>' | '>=';

export interface ComparisonExpression {
  type: 'ComparisonExpression';
  operator: ComparisonOperator;
  left: Expression;
  right: Expression;
}

export type LogicalOperator = 'and' | 'or';

export interface LogicalExpression {
  type: 'LogicalExpression';
  operator: LogicalOperator;
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: 'not';
  argument: Expression;
}

export interface Type {
  type: 'Type';
  name: Identifier;
  genericType?: Type;
}

export interface TypeObject {
  type: 'TypeObject';
  properties: {
    key: Identifier;
    value: Type;
  }[];
}

// Transformer to convert CST to AST
export class ASTTransformer {
  transform(cst: any): Program {
    // Chevrotain CST structure has "children" property
    const body: (ImportStatement | FlowDefinition)[] = [];
    
    // The CST has a children property that contains the parsed nodes
    if (cst.children) {
      // Handle import statements
      if (cst.children.importStatement) {
        for (const stmt of cst.children.importStatement) {
          body.push(this.transformImportStatement(stmt));
        }
      }
      
      // Handle flow definitions
      if (cst.children.flowDefinition) {
        for (const flow of cst.children.flowDefinition) {
          body.push(this.transformFlowDefinition(flow));
        }
      }
    }
    
    return {
      type: 'Program',
      body
    };
  }

  private transformImportStatement(cst: any): ImportStatement {
    // Access the children property for nested rules
    const children = cst.children;
    
    if (children.promptImport) {
      return {
        type: 'ImportStatement',
        importType: 'prompt',
        promptImport: this.transformPromptImport(children.promptImport[0])
      };
    } else if (children.symbolImport) {
      return {
        type: 'ImportStatement',
        importType: 'symbol',
        symbolImport: this.transformSymbolImport(children.symbolImport[0])
      };
    }
    throw new Error('Invalid import statement structure');
  }

  private transformPromptImport(cst: any): PromptImport {
    const children = cst.children;
    return {
      type: 'PromptImport',
      promptPath: this.getImageWithoutQuotes(children.StringLiteral[0]),
      name: this.transformIdentifier(children.Identifier[0]),
      input: this.transformTypeObject(children.typeObject[0]),
      returns: this.transformTypeObject(children.typeObject[1])
    };
  }

  private transformSymbolImport(cst: any): SymbolImport {
    const children = cst.children;
    return {
      type: 'SymbolImport',
      symbols: children.Identifier.slice(0, -1).map((id: any) => this.transformIdentifier(id)),
      from: this.getImageWithoutQuotes(children.StringLiteral[0])
    };
  }

  private transformFlowDefinition(cst: any): FlowDefinition {
    const children = cst.children;
    return {
      type: 'FlowDefinition',
      name: this.transformIdentifier(children.Identifier[0]),
      parameters: children.parameterList ? this.transformParameterList(children.parameterList[0]) : [],
      body: children.statement ? children.statement.map((stmt: any) => this.transformStatement(stmt)) : []
    };
  }

  private transformParameterList(cst: any): Parameter[] {
    const children = cst.children;
    const params: Parameter[] = [];
    
    if (!children || !children.Identifier) return params;
    
    for (let i = 0; i < children.Identifier.length; i++) {
      params.push({
        type: 'Parameter',
        name: this.transformIdentifier(children.Identifier[i]),
        paramType: this.transformType(children.type[i])
      });
    }
    return params;
  }

  private transformStatement(cst: any): Statement {
    const children = cst.children;
    
    if (children.returnStatement) {
      return this.transformReturnStatement(children.returnStatement[0]);
    } else if (children.ifStatement) {
      return this.transformIfStatement(children.ifStatement[0]);
    } else if (children.forStatement) {
      return this.transformForStatement(children.forStatement[0]);
    } else if (children.loopStatement) {
      return this.transformLoopStatement(children.loopStatement[0]);
    } else if (children.assignment) {
      return this.transformAssignment(children.assignment[0]);
    } else if (children.destructuringAssignment) {
      return this.transformDestructuringAssignment(children.destructuringAssignment[0]);
    } else if (children.expressionStatement) {
      return this.transformExpressionStatement(children.expressionStatement[0]);
    }
    throw new Error('Unknown statement type');
  }

  private transformReturnStatement(cst: any): ReturnStatement {
    const children = cst.children;
    return {
      type: 'ReturnStatement',
      expression: this.transformExpression(children.expression[0])
    };
  }

  private transformIfStatement(cst: any): IfStatement {
    const children = cst.children;
    return {
      type: 'IfStatement',
      condition: this.transformExpression(children.expression[0]),
      body: children.statement ? children.statement.map((stmt: any) => this.transformStatement(stmt)) : []
    };
  }

  private transformForStatement(cst: any): ForStatement {
    const children = cst.children;
    return {
      type: 'ForStatement',
      variable: this.transformIdentifier(children.Identifier[0]),
      iterable: this.transformExpression(children.expression[0]),
      body: children.statement ? children.statement.map((stmt: any) => this.transformStatement(stmt)) : []
    };
  }

  private transformLoopStatement(cst: any): LoopStatement {
    const children = cst.children;
    return {
      type: 'LoopStatement',
      body: children.statement ? children.statement.map((stmt: any) => this.transformStatement(stmt)) : []
    };
  }

  private transformAssignment(cst: any): Assignment {
    const children = cst.children;
    return {
      type: 'Assignment',
      left: this.transformIdentifier(children.Identifier[0]),
      right: this.transformExpression(children.expression[0])
    };
  }

  private transformDestructuringAssignment(cst: any): DestructuringAssignment {
    const children = cst.children;
    return {
      type: 'DestructuringAssignment',
      left: children.Identifier.map((id: any) => this.transformIdentifier(id)),
      right: this.transformExpression(children.expression[0])
    };
  }

  private transformExpressionStatement(cst: any): ExpressionStatement {
    const children = cst.children;
    return {
      type: 'ExpressionStatement',
      expression: this.transformExpression(children.expression[0])
    };
  }

  private transformExpression(cst: any): Expression {
    const children = cst.children;
    
    if (children.logicalExpression) {
      return this.transformLogicalExpression(children.logicalExpression[0]);
    }
    
    throw new Error('Unknown expression type');
  }

  private transformLogicalExpression(cst: any): Expression {
    const children = cst.children;
    
    // First transform the initial notExpression
    let expr = this.transformNotExpression(children.notExpression[0]);
    
    // Handle any chained and/or operators
    if (children.And || children.Or) {
      // Process all the operators and right-hand expressions in order
      for (let i = 0; i < (children.And?.length || 0) + (children.Or?.length || 0); i++) {
        const isAnd = i < (children.And?.length || 0);
        const operator = isAnd ? 'and' : 'or';
        const rightExpr = this.transformNotExpression(children.notExpression[i + 1]);
        
        expr = {
          type: 'LogicalExpression',
          operator,
          left: expr,
          right: rightExpr
        };
      }
    }
    
    return expr;
  }

  private transformNotExpression(cst: any): Expression {
    const children = cst.children;
    
    if (children.Not) {
      return {
        type: 'UnaryExpression',
        operator: 'not',
        argument: this.transformComparisonExpression(children.comparisonExpression[0])
      };
    }
    
    return this.transformComparisonExpression(children.comparisonExpression[0]);
  }

  private transformComparisonExpression(cst: any): Expression {
    const children = cst.children;
    
    // Handle primary expressions
    let expr = this.transformPrimaryExpression(children.primaryExpression[0]);
    
    // Handle comparison operators or dot access
    if (children.DoubleEquals) {
      expr = {
        type: 'ComparisonExpression',
        operator: '==',
        left: expr,
        right: this.transformPrimaryExpression(children.primaryExpression[1])
      };
    } else if (children.NotEquals) {
      expr = {
        type: 'ComparisonExpression',
        operator: '!=',
        left: expr,
        right: this.transformPrimaryExpression(children.primaryExpression[1])
      };
    } else if (children.LessThanEquals) {
      expr = {
        type: 'ComparisonExpression',
        operator: '<=',
        left: expr,
        right: this.transformPrimaryExpression(children.primaryExpression[1])
      };
    } else if (children.GreaterThanEquals) {
      expr = {
        type: 'ComparisonExpression',
        operator: '>=',
        left: expr,
        right: this.transformPrimaryExpression(children.primaryExpression[1])
      };
    } else if (children.LessThan) {
      expr = {
        type: 'ComparisonExpression',
        operator: '<',
        left: expr,
        right: this.transformPrimaryExpression(children.primaryExpression[1])
      };
    } else if (children.GreaterThan) {
      expr = {
        type: 'ComparisonExpression',
        operator: '>',
        left: expr,
        right: this.transformPrimaryExpression(children.primaryExpression[1])
      };
    } else if (children.dotAccess) {
      expr = this.transformDotAccess(expr, children.dotAccess[0]);
    }
    
    return expr;
  }

  private transformPrimaryExpression(cst: any): Expression {
    const children = cst.children;
    
    if (children.functionCall) {
      return this.transformFunctionCall(children.functionCall[0]);
    } else if (children.objectLiteral) {
      return this.transformObjectLiteral(children.objectLiteral[0]);
    } else if (children.arrayLiteral) {
      return this.transformArrayLiteral(children.arrayLiteral[0]);
    } else if (children.StringLiteral) {
      return this.transformStringLiteral(children.StringLiteral[0]);
    } else if (children.NumberLiteral) {
      return this.transformNumberLiteral(children.NumberLiteral[0]);
    } else if (children.BooleanLiteral) {
      return this.transformBooleanLiteral(children.BooleanLiteral[0]);
    } else if (children.Identifier) {
      return this.transformIdentifier(children.Identifier[0]);
    }
    
    throw new Error('Unknown primary expression type');
  }

  private transformMemberExpressionTail(object: Expression, cst: any): MemberExpression {
    const children = cst.children;
    
    const property = this.transformIdentifier(children.Identifier[0]);
    let expr: Expression = {
      type: 'MemberExpression',
      object,
      property
    };
    
    // If there are nested member expressions (a.b.c), recursively build them
    if (children.memberExpressionTail) {
      return this.transformMemberExpressionTail(expr, children.memberExpressionTail[0]);
    }
    
    return expr as MemberExpression;
  }

  private transformFunctionCall(cst: any): FunctionCall {
    const children = cst.children;
    return {
      type: 'FunctionCall',
      callee: this.transformIdentifier(children.Identifier[0]),
      arguments: children.argumentList ? 
        this.transformArgumentList(children.argumentList[0]) : []
    };
  }

  private transformArgumentList(cst: any): Expression[] {
    const children = cst.children;
    return children.expression ? 
      children.expression.map((expr: any) => this.transformExpression(expr)) : [];
  }

  private transformObjectLiteral(cst: any): ObjectLiteral {
    const children = cst.children;
    const properties: Array<{key: Identifier, value?: Expression, shorthand: boolean}> = [];
    
    // Process regular properties (key: value)
    if (children.propertyName) {
      for (let i = 0; i < children.propertyName.length; i++) {
        properties.push({
          key: this.transformIdentifier(children.propertyName[i]),
          value: children.expression[i] ? 
            this.transformExpression(children.expression[i]) : undefined,
          shorthand: false
        });
      }
    }
    
    // Process shorthand properties
    if (children.shorthandProperty) {
      for (const prop of children.shorthandProperty) {
        properties.push({
          key: this.transformIdentifier(prop),
          shorthand: true
        });
      }
    }
    
    return {
      type: 'ObjectLiteral',
      properties
    };
  }

  private transformIdentifier(token: any): Identifier {
    return {
      type: 'Identifier',
      name: token.image
    };
  }

  private transformStringLiteral(cst: any): StringLiteral {
    return {
      type: 'StringLiteral',
      value: cst.image.slice(1, -1) // Remove quotes
    };
  }

  private transformNumberLiteral(cst: any): NumberLiteral {
    return {
      type: 'NumberLiteral',
      value: Number(cst.image)
    };
  }

  private transformBooleanLiteral(cst: any): BooleanLiteral {
    return {
      type: 'BooleanLiteral',
      value: cst.image === 'true'
    };
  }

  private transformType(cst: any): Type {
    const children = cst.children;
    return {
      type: 'Type',
      name: this.transformIdentifier(children.Identifier[0]),
      genericType: children.type ? 
        this.transformType(children.type[0]) : undefined
    };
  }

  private transformTypeObject(cst: any): TypeObject {
    const children = cst.children;
    const properties = [];
    
    if (children.Identifier) {
      for (let i = 0; i < children.Identifier.length; i++) {
        properties.push({
          key: this.transformIdentifier(children.Identifier[i]),
          value: this.transformType(children.type[i])
        });
      }
    }
    
    return {
      type: 'TypeObject',
      properties
    };
  }

  private transformArrayLiteral(cst: any): ArrayLiteral {
    const children = cst.children;
    return {
      type: 'ArrayLiteral',
      elements: children.expression ? 
        children.expression.map((expr: any) => this.transformExpression(expr)) : []
    };
  }
  
  // Helper to remove quotes from string literals
  private getImageWithoutQuotes(token: any): string {
    const image = token.image;
    // Remove surrounding quotes
    return image.substring(1, image.length - 1);
  }

  // New method to transform dot access expressions (both property access and method calls)
  private transformDotAccess(object: Expression, cst: any): Expression {
    const children = cst.children;
    
    // Get the property/method name
    const propName = this.transformIdentifier(children.Identifier[0]);
    
    // Check if this is a method call or property access
    if (children.LParen) {
      // This is a method call
      const args = children.argumentList ? 
        this.transformArgumentList(children.argumentList[0]) : [];
      
      const methodCall: MethodCall = {
        type: 'MethodCall',
        object,
        method: propName,
        arguments: args
      };
      
      // Handle chained access if present
      if (children.dotAccess) {
        return this.transformDotAccess(methodCall, children.dotAccess[0]);
      }
      
      return methodCall;
    } else {
      // This is a regular property access
      const memberExpr: MemberExpression = {
        type: 'MemberExpression',
        object,
        property: propName
      };
      
      // Handle chained access if present
      if (children.dotAccess) {
        return this.transformDotAccess(memberExpr, children.dotAccess[0]);
      }
      
      return memberExpr;
    }
  }
} 