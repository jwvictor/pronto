import { Node, Program, ImportStatement, PromptImport, SymbolImport, FlowDefinition, Parameter, Statement, ReturnStatement, IfStatement, ForStatement, LoopStatement, Assignment, DestructuringAssignment, Expression, ExpressionStatement, FunctionCall, ObjectLiteral, ArrayLiteral, MemberExpression, Identifier, StringLiteral, Type, TypeObject, MethodCall, NumberLiteral, BooleanLiteral, ComparisonExpression, LogicalExpression, UnaryExpression } from './ast';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Code generator class
export class CodeGenerator {
  private indentLevel = 0;
  private indentString = '  '; // 2 spaces for indentation
  
  // Maps to track imported prompts and flows
  private importedPrompts: Map<string, PromptImport> = new Map();
  private importedSymbols: Map<string, string> = new Map();
  
  // Track defined flows to make sure we await them when called
  private definedFlows: Set<string> = new Set();
  
  // Track if a Main flow was defined
  private hasMainFlow = false;
  
  // Set of built-in function names
  private builtinFunctions: Set<string> = new Set(['print', 'stringify', 'parse']);
  
  // Track declared variables in the current scope to avoid redeclaration
  private declaredVariables: Set<string> = new Set();
  
  // Path to the runtime.js file
  private runtimePath: string;
  
  // In the class declaration, add a map to store flow parameter information
  private flowParameters: Map<string, string[]> = new Map();
  
  constructor() {
    // Get the current file's path using import.meta.url (ES modules approach)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    // Set the path to runtime.js relative to this file
    this.runtimePath = path.join(__dirname, '..', 'runtime', 'runtime.js');
  }
  
  // Generate code from AST
  generate(ast: Program): string {
    // Reset state
    this.hasMainFlow = false;
    this.importedPrompts.clear();
    this.importedSymbols.clear();
    this.declaredVariables.clear();
    this.definedFlows.clear();
    
    // First pass: collect all defined flows for proper awaiting
    this.collectDefinedFlows(ast);
    
    // Read the runtime code
    let code;
    try {
      code = fs.readFileSync(this.runtimePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read runtime.js file: ${error}`);
    }
    
    // Process all nodes in the program
    code += this.generateNode(ast);
    
    // If we found a Main flow, add code to call it
    if (this.hasMainFlow) {
      code += `
// Auto-execute Main flow
(async () => {
  try {
    console.log("Starting Main flow execution...");
    await Main();
    console.log("Main flow execution completed successfully.");
  } catch (error) {
    console.error("Main flow execution failed:", error);
    process.exit(1);
  }
})();
`;
    }
    
    return code;
  }
  
  // Collect all defined flows in the program
  private collectDefinedFlows(ast: Program): void {
    for (const node of ast.body) {
      if (node.type === 'FlowDefinition') {
        const flow = node as FlowDefinition;
        this.definedFlows.add(flow.name.name);
        
        // Store parameter names in order
        const paramNames = flow.parameters.map(p => p.name.name);
        this.flowParameters.set(flow.name.name, paramNames);
      }
    }
  }
  
  // Generate code for any AST node
  private generateNode(node: Node): string {
    switch (node.type) {
      case 'Program':
        return this.generateProgram(node as Program);
      case 'ImportStatement':
        return this.generateImportStatement(node as ImportStatement);
      case 'FlowDefinition':
        return this.generateFlowDefinition(node as FlowDefinition);
      case 'ReturnStatement':
        return this.generateReturnStatement(node as ReturnStatement);
      case 'IfStatement':
        return this.generateIfStatement(node as IfStatement);
      case 'ForStatement':
        return this.generateForStatement(node as ForStatement);
      case 'LoopStatement':
        return this.generateLoopStatement(node as LoopStatement);
      case 'Assignment':
        return this.generateAssignment(node as Assignment);
      case 'DestructuringAssignment':
        return this.generateDestructuringAssignment(node as DestructuringAssignment);
      case 'ExpressionStatement':
        return this.generateExpressionStatement(node as ExpressionStatement);
      case 'FunctionCall':
        return this.generateFunctionCall(node as FunctionCall);
      case 'MethodCall':
        return this.generateMethodCall(node as MethodCall);
      case 'ObjectLiteral':
        return this.generateObjectLiteral(node as ObjectLiteral);
      case 'ArrayLiteral':
        return this.generateArrayLiteral(node as ArrayLiteral);
      case 'MemberExpression':
        return this.generateMemberExpression(node as MemberExpression);
      case 'Identifier':
        return this.generateIdentifier(node as Identifier);
      case 'StringLiteral':
        return this.generateStringLiteral(node as StringLiteral);
      case 'NumberLiteral':
        return this.generateNumberLiteral(node as NumberLiteral);
      case 'BooleanLiteral':
        return this.generateBooleanLiteral(node as BooleanLiteral);
      case 'ComparisonExpression':
        return this.generateComparisonExpression(node as ComparisonExpression);
      case 'LogicalExpression':
        return this.generateLogicalExpression(node as LogicalExpression);
      case 'UnaryExpression':
        return this.generateUnaryExpression(node as UnaryExpression);
      default:
        throw new Error(`Unsupported node type: ${(node as any).type}`);
    }
  }
  
  // Generate code for Program node
  private generateProgram(program: Program): string {
    let code = '';
    
    // Process all nodes in the program
    for (const node of program.body) {
      code += this.generateNode(node) + '\n\n';
    }
    
    return code;
  }
  
  // Generate code for Import statement
  private generateImportStatement(importStmt: ImportStatement): string {
    if (importStmt.importType === 'prompt' && importStmt.promptImport) {
      return this.generatePromptImport(importStmt.promptImport);
    } else if (importStmt.importType === 'symbol' && importStmt.symbolImport) {
      return this.generateSymbolImport(importStmt.symbolImport);
    }
    
    return ''; // Shouldn't reach here
  }
  
  // Generate code for Prompt import
  private generatePromptImport(promptImport: PromptImport): string {
    // Store the prompt import for later use
    this.importedPrompts.set(promptImport.name.name, promptImport);
    
    // Define the prompt function that will call the runtime
    const promptName = promptImport.name.name;
    const promptPath = promptImport.promptPath;
    const inputType = JSON.stringify(promptImport.input);
    const returnType = JSON.stringify(promptImport.returns);
    
    return `// Prompt import: ${promptName} from ${promptPath}
const ${promptName} = async function(input) {
  // Validate input against expected type
  const validatedInput = _promptRuntime.validateType(input, ${inputType});
  
  // Call the prompt with validated input
  return await _promptRuntime.callPrompt("${promptName}", "${promptPath}", validatedInput, ${returnType});
};
_promptRegistry["${promptName}"] = {
  path: "${promptPath}",
  inputType: ${inputType},
  returnType: ${returnType}
};`;
  }
  
  // Generate code for Symbol import
  private generateSymbolImport(symbolImport: SymbolImport): string {
    // Store symbol imports for later use
    for (const symbol of symbolImport.symbols) {
      this.importedSymbols.set(symbol.name, symbolImport.from);
    }
    
    // Generate regular JS import
    const symbols = symbolImport.symbols.map(s => s.name).join(', ');
    return `import { ${symbols} } from "${symbolImport.from}";`;
  }
  
  // Generate code for Flow definition (becomes an async function)
  private generateFlowDefinition(flow: FlowDefinition): string {
    // Reset declared variables for this flow
    this.declaredVariables.clear();
    
    // Add function parameters to declared variables
    for (const param of flow.parameters) {
      this.declaredVariables.add(param.name.name);
    }
    
    const name = flow.name.name;
    // Remove type annotations, just use parameter names
    const params = flow.parameters.map(p => p.name.name).join(', ');
    
    // Add to defined flows set to ensure we await calls to this flow
    this.definedFlows.add(name);
    
    // Check if this is a Main flow
    if (name === 'Main') {
      this.hasMainFlow = true;
    }
    
    let code = `// Flow: ${name}
async function ${name}(${params}) {
${this.indent(1)}try {`;
    
    // Generate code for flow body
    for (const stmt of flow.body) {
      // Generate the statement code
      let stmtCode = this.generateNode(stmt);
      
      // If the statement is an expression that might include a prompt call
      // wrap it in an await to ensure all promises are resolved
      if (stmt.type === 'ExpressionStatement' || 
          stmt.type === 'Assignment' ||
          stmt.type === 'DestructuringAssignment') {
        code += '\n' + this.indent(2) + stmtCode + ';';
      } else if (stmt.type === 'ReturnStatement') {
        // Return statements are already handled with their own logic
        code += '\n' + this.indent(2) + stmtCode + ';';
      } else {
        // Other statements (if, for, loop) need their own logic
        code += '\n' + this.indent(2) + stmtCode + ';';
      }
    }
    
    // Add error handling
    code += `
${this.indent(1)}} catch (error) {
${this.indent(2)}console.error(\`Error in flow ${name}: \${error.message}\`);
${this.indent(2)}throw error;
${this.indent(1)}}
}`;
    
    return code;
  }
  
  // This method now only returns types for documentation purposes in comments
  private generateTypeAnnotation(type: Type): string {
    if (!type) return '';
    
    let annotation = type.name.name;
    
    // Handle generic types like list<Idea>
    if (type.genericType) {
      annotation += `<${this.generateTypeAnnotation(type.genericType)}>`;
    }
    
    return annotation;
  }
  
  // Generate code for Return statement
  private generateReturnStatement(returnStmt: ReturnStatement): string {
    // Check if the expression is an async call that needs awaiting
    const expr = returnStmt.expression;
    
    if (this.isAsyncCall(expr)) {
      return `return ${this.generateAsyncCall(expr as FunctionCall)}`;
    }
    
    return `return ${this.generateNode(expr)}`;
  }
  
  // Generate code for If statement
  private generateIfStatement(ifStmt: IfStatement): string {
    let code = `if (${this.generateNode(ifStmt.condition)}) {`;
    
    // Generate code for if body
    for (const stmt of ifStmt.body) {
      code += '\n' + this.indent(1) + this.generateNode(stmt) + ';';
    }
    
    code += '\n}';
    return code;
  }
  
  // Generate code for For statement
  private generateForStatement(forStmt: ForStatement): string {
    const variable = this.generateNode(forStmt.variable);
    const iterable = this.generateNode(forStmt.iterable);
    
    let code = `for (const ${variable} of ${iterable}) {`;
    
    // Generate code for for loop body
    for (const stmt of forStmt.body) {
      code += '\n' + this.indent(1) + this.generateNode(stmt) + ';';
    }
    
    code += '\n}';
    return code;
  }
  
  // Generate code for Loop statement
  private generateLoopStatement(loopStmt: LoopStatement): string {
    let code = 'while (true) {';
    
    // Generate code for loop body
    for (const stmt of loopStmt.body) {
      code += '\n' + this.indent(1) + this.generateNode(stmt) + ';';
    }
    
    code += '\n}';
    return code;
  }
  
  // Generate code for Assignment
  private generateAssignment(assignment: Assignment): string {
    const leftIdent = assignment.left as Identifier;
    const left = this.generateNode(leftIdent);
    
    // Check if the right side is an async call that needs awaiting
    const right = assignment.right;
    let rightCode: string;
    
    if (this.isAsyncCall(right)) {
      rightCode = this.generateAsyncCall(right as FunctionCall);
    } else {
      rightCode = this.generateNode(right);
    }
    
    // Check if this variable has been declared before
    if (!this.declaredVariables.has(leftIdent.name)) {
      // Add it to the set of declared variables
      this.declaredVariables.add(leftIdent.name);
      
      // Generate a declaration with 'let'
      return `let ${left} = ${rightCode}`;
    }
    
    // Regular assignment for already declared variables
    return `${left} = ${rightCode}`;
  }
  
  // Generate code for Destructuring Assignment
  private generateDestructuringAssignment(destructuring: DestructuringAssignment): string {
    const identifiers = destructuring.left;
    
    // Check if the right side is an async call that needs awaiting
    const right = destructuring.right;
    let rightCode: string;
    
    if (this.isAsyncCall(right)) {
      rightCode = this.generateAsyncCall(right as FunctionCall);
    } else {
      rightCode = this.generateNode(right);
    }
    
    // Track each destructured variable
    for (const id of identifiers) {
      this.declaredVariables.add(id.name);
    }
    
    // Always use 'const' for destructuring as it's a new declaration
    const left = identifiers.map(id => this.generateNode(id)).join(', ');
    return `const { ${left} } = ${rightCode}`;
  }
  
  // Generate code for Expression Statement
  private generateExpressionStatement(exprStmt: ExpressionStatement): string {
    // For expression statements that are function calls to prompts or flows, 
    // we need to make sure they're awaited
    const expression = exprStmt.expression;
    
    if (this.isAsyncCall(expression)) {
      return this.generateAsyncCall(expression as FunctionCall);
    }
    
    // For other expression statements, just generate the contained expression
    return this.generateNode(exprStmt.expression);
  }
  
  // Generate code for Function Call, with special handling for prompts and flows
  private generateFunctionCall(funcCall: FunctionCall): string {
    const callee = this.generateNode(funcCall.callee);
    
    // Check if this is a call to an imported prompt
    if (this.importedPrompts.has(callee)) {
      // For prompt calls, always pass an object of named parameters for template rendering
      if (funcCall.arguments.length === 0) {
        return `await ${callee}({})`;
      }
      
      // If all arguments are already provided in an object, just pass it through
      const args = this.generateNode(funcCall.arguments[0]);
      return `await ${callee}(${args})`;
    }
    
    // Check if this is a call to a defined flow
    if (this.definedFlows.has(callee)) {
      // For flow calls, extract values from object literals to match positional parameters
      if (funcCall.arguments.length === 0) {
        return `await ${callee}()`;
      }
      
      // If the argument is an object literal, extract its values IN PARAMETER ORDER
      if (funcCall.arguments.length === 1 && funcCall.arguments[0].type === 'ObjectLiteral') {
        const objLiteral = funcCall.arguments[0] as ObjectLiteral;
        
        // Get the parameter names for this flow in their defined order
        const paramNames = this.flowParameters.get(callee) || [];
        
        // Create a map of object properties for lookup
        const propsMap = new Map();
        objLiteral.properties.forEach(prop => {
          const key = (prop.key as Identifier).name;
          propsMap.set(key, prop);
        });
        
        // Extract values in the order of the flow parameters
        const extractedArgs = paramNames.map(paramName => {
          const prop = propsMap.get(paramName);
          if (!prop) {
            throw new Error(`Missing required parameter '${paramName}' in call to flow '${callee}'`);
          }
          return this.generateNode(prop.value || prop.key);
        }).join(', ');
        
        return `await ${callee}(${extractedArgs})`;
      }
      
      // If not an object literal, pass the arguments as-is
      const args = funcCall.arguments.map(arg => this.generateNode(arg)).join(', ');
      return `await ${callee}(${args})`;
    }
    
    // Check if this is a built-in function
    if (this.builtinFunctions.has(callee)) {
      // Reference the function from the _builtins object
      const args = funcCall.arguments.map(arg => this.generateNode(arg)).join(', ');
      return `_builtins.${callee}(${args})`;
    }
    
    // Regular function call - leave as is
    const args = funcCall.arguments.map(arg => this.generateNode(arg)).join(', ');
    return `${callee}(${args})`;
  }
  
  // Helper to check if an expression is an async call (prompt or flow)
  private isAsyncCall(expr: Expression): boolean {
    if (expr.type === 'FunctionCall') {
      const funcCall = expr as FunctionCall;
      const callee = this.generateNode(funcCall.callee);
      
      // Check if it's a prompt or flow call
      return this.importedPrompts.has(callee) || this.definedFlows.has(callee);
    }
    return false;
  }
  
  // Helper to generate code for an async call (prompt or flow)
  private generateAsyncCall(expr: FunctionCall): string {
    const callee = this.generateNode(expr.callee);
    
    // Check if this is a prompt call
    if (this.importedPrompts.has(callee)) {
      // For prompt calls, always pass an object of named parameters
      if (expr.arguments.length === 0) {
        return `await ${callee}({})`;
      }
      
      // If all arguments are already provided in an object, just pass it through
      const args = this.generateNode(expr.arguments[0]);
      return `await ${callee}(${args})`;
    }
    
    // For flow calls, extract values from object literals to match positional parameters
    if (this.definedFlows.has(callee)) {
      if (expr.arguments.length === 0) {
        return `await ${callee}()`;
      }
      
      // If the argument is an object literal, extract its values IN PARAMETER ORDER
      if (expr.arguments.length === 1 && expr.arguments[0].type === 'ObjectLiteral') {
        const objLiteral = expr.arguments[0] as ObjectLiteral;
        
        // Get the parameter names for this flow in their defined order
        const paramNames = this.flowParameters.get(callee) || [];
        
        // Create a map of object properties for lookup
        const propsMap = new Map();
        objLiteral.properties.forEach(prop => {
          const key = (prop.key as Identifier).name;
          propsMap.set(key, prop);
        });
        
        // Extract values in the order of the flow parameters
        const extractedArgs = paramNames.map(paramName => {
          const prop = propsMap.get(paramName);
          if (!prop) {
            throw new Error(`Missing required parameter '${paramName}' in call to flow '${callee}'`);
          }
          return this.generateNode(prop.value || prop.key);
        }).join(', ');
        
        return `await ${callee}(${extractedArgs})`;
      }
      
      // If not an object literal, pass the arguments as-is
      const args = expr.arguments.map(arg => this.generateNode(arg)).join(', ');
      return `await ${callee}(${args})`;
    }
    
    // For other function calls
    const args = expr.arguments.map(arg => this.generateNode(arg)).join(', ');
    return `await ${callee}(${args})`;
  }
  
  // Generate code for Object Literal
  private generateObjectLiteral(obj: ObjectLiteral): string {
    if (obj.properties.length === 0) {
      return '{}';
    }
    
    const props = obj.properties.map(prop => {
      if (prop.shorthand) {
        // Shorthand property like { file, feedback }
        return this.generateNode(prop.key);
      } else {
        // Regular property like { file: fileValue }
        return `${this.generateNode(prop.key)}: ${this.generateNode(prop.value!)}`;
      }
    }).join(', ');
    
    return `{ ${props} }`;
  }
  
  // Generate code for Member Expression
  private generateMemberExpression(memberExpr: MemberExpression): string {
    const object = this.generateNode(memberExpr.object);
    const property = this.generateNode(memberExpr.property);
    
    return `${object}.${property}`;
  }
  
  // Generate code for Identifier
  private generateIdentifier(id: Identifier): string {
    return id.name;
  }
  
  // Generate code for String Literal
  private generateStringLiteral(str: StringLiteral): string {
    return `"${str.value}"`;
  }
  
  // Generate code for Number Literal
  private generateNumberLiteral(num: NumberLiteral): string {
    return num.value.toString();
  }
  
  // Generate code for Boolean Literal
  private generateBooleanLiteral(bool: BooleanLiteral): string {
    return bool.value.toString();
  }
  
  // Add a new method to generate code for Array Literal
  private generateArrayLiteral(array: ArrayLiteral): string {
    if (array.elements.length === 0) {
      return '[]';
    }
    
    const elements = array.elements.map(elem => this.generateNode(elem)).join(', ');
    
    return `[${elements}]`;
  }
  
  // Add a new method to generate code for Method Call
  private generateMethodCall(methodCall: MethodCall): string {
    const object = this.generateNode(methodCall.object);
    const method = this.generateNode(methodCall.method);
    const args = methodCall.arguments.map(arg => this.generateNode(arg)).join(', ');
    
    return `${object}.${method}(${args})`;
  }
  
  // Helper for indentation
  private indent(level: number): string {
    return this.indentString.repeat(level);
  }

  private generateComparisonExpression(comp: ComparisonExpression): string {
    const left = this.generateNode(comp.left);
    const right = this.generateNode(comp.right);
    return `${left} ${comp.operator} ${right}`;
  }

  private generateLogicalExpression(logical: LogicalExpression): string {
    const left = this.generateNode(logical.left);
    const right = this.generateNode(logical.right);
    // Convert 'and' to '&&' and 'or' to '||'
    const operator = logical.operator === 'and' ? '&&' : '||';
    return `${left} ${operator} ${right}`;
  }

  private generateUnaryExpression(unary: UnaryExpression): string {
    const argument = this.generateNode(unary.argument);
    // Convert 'not' to '!'
    return `!${argument}`;
  }
}
