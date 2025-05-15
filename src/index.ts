import { parserInstance } from "./compiler/parser.js";
import { PromptLangLexer } from "./compiler/lexer.js";
import { ASTTransformer } from "./compiler/ast.js";
import { CodeGenerator } from "./compiler/codegen.js";
import { 
  CompilerError, 
  formatParsingError, 
  formatCompilationError,
  getSourceFile,
  getFileName
} from "./compiler/error-handling.js";
import { IRecognitionException } from "chevrotain";
import fs from 'fs';
import path from 'path';

// Sample input for testing when no file is provided
const sampleInput = `
import prompt "rank_ideas.njk" as RankIdeas 
  with input { ideas: list<Idea> }
  returns { best: Idea }

import { x } from "./y.njk"

flow example(x: number) {
  return "hello"
}
flow example2(x: number, y: string) {
  result = FixFile({ file, feedback })
  file = result.file
  return x + 1
}
`;

// Main compile function
function compile(source: string, sourceFilePath: string, outputPath: string | null = null) {
  try {
    // Tokenize the input
    const lexResult = PromptLangLexer.tokenize(source);
    
    // Check for lexer errors
    if (lexResult.errors.length > 0) {
      const firstError = lexResult.errors[0];
      const line = firstError.line || 0;
      const column = firstError.column || 0;
      throw new CompilerError(
        `Lexical error: ${firstError.message}`,
        getFileName(sourceFilePath),
        line,
        column,
        source
      );
    }
    
    console.log("Tokenization complete");

    // Parse the tokens
    parserInstance.input = lexResult.tokens;
    const cst = parserInstance.script();
    
    // Check for parser errors
    if (parserInstance.errors.length > 0) {
      // Parser error - use our custom formatting
      throw parserInstance.errors[0];
    }
    
    console.log("Parsing complete");

    // Transform CST to AST
    const transformer = new ASTTransformer();
    const ast = transformer.transform(cst);
    console.log("AST transformation complete");

    // Generate JavaScript code
    const generator = new CodeGenerator();
    const jsCode = generator.generate(ast);
    console.log("Code generation complete");

    // Output the generated code
    if (outputPath) {
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(outputPath, jsCode);
      console.log(`Generated JavaScript written to ${outputPath}`);
    }

    return {
      tokens: lexResult.tokens,
      cst,
      ast,
      jsCode
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'CompilerError') {
      // Our custom compiler error
      console.error(formatCompilationError(error as CompilerError));
    } else if (
      error instanceof Error && 
      'token' in error && 
      typeof error.token === 'object'
    ) {
      // Parser recognition exception
      console.error(formatParsingError(
        error as IRecognitionException, 
        getFileName(sourceFilePath), 
        source
      ));
    } else {
      // Unexpected error
      console.error('Unexpected error during compilation:');
      console.error(error);
    }
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    command?: string;
    inputFile?: string;
    outputFile?: string;
    help?: boolean;
  } = {};

  // Check for command (compile, run, etc.)
  if (args.length > 0 && !args[0].startsWith('-')) {
    options.command = args[0];
    args.shift();
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-i' || arg === '--input') {
      options.inputFile = args[++i];
    } else if (arg === '-o' || arg === '--output') {
      options.outputFile = args[++i];
    } else if (arg === '-h' || arg === '--help') {
      options.help = true;
    } else if (!options.inputFile) {
      // Treat first unmarked argument as input file
      options.inputFile = arg;
    } else if (!options.outputFile) {
      // Treat second unmarked argument as output file
      options.outputFile = arg;
    }
  }
  
  return options;
}

// Display help text
function showHelp() {
  console.log(`
Usage: node dist/index.js [command] [options] <input_file> [output_file]

Commands:
  compile              Compile a prompt language file to JavaScript (default)
  run                  Compile and run a prompt language file

Options:
  -i, --input FILE    Input source file (required)
  -o, --output FILE   Output JavaScript file
  -h, --help          Display this help message

An input file is required.
If no output file is specified, code will be written to dist/<input_name>.js
`);
}

// Main execution
function main() {
  const options = parseArgs();
  
  // Default command is compile
  const command = options.command || 'compile';
  
  // Show help if requested
  if (options.help) {
    showHelp();
    return;
  }
  
  // Require an input file
  if (!options.inputFile) {
    console.error('Error: Input file is required');
    console.log('Use --help for usage information');
    process.exit(1);
  }
  
  let source: string;
  let outputPath: string | null = null;
  
  // Get source code
  try {
    source = getSourceFile(options.inputFile);
    console.log(`Reading from file: ${options.inputFile}`);
  } catch (error: unknown) {
    if (error instanceof CompilerError) {
      console.error(formatCompilationError(error));
    } else {
      // For other types of errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error reading input file: ${errorMessage}`);
    }
    process.exit(1);
  }
  
  // Set output path
  if (options.outputFile) {
    outputPath = options.outputFile;
  } else {
    // Generate output filename based on input filename
    const inputBase = path.basename(options.inputFile, path.extname(options.inputFile));
    outputPath = path.join('dist', `${inputBase}.js`);
  }
  
  if (command === 'compile') {
    // Compile the source
    const result = compile(source, options.inputFile, outputPath);
    
    // If no output file was specified, print to console
    if (!outputPath && result) {
      console.log("\nGenerated JavaScript:");
      console.log("====================");
      console.log(result.jsCode);
    }
  } else if (command === 'run') {
    // Compile and run (to be implemented)
    console.error('Run command not yet implemented');
    process.exit(1);
  } else {
    console.error(`Unknown command: ${command}`);
    console.log('Use --help for usage information');
    process.exit(1);
  }
}

// Run the program
main();

