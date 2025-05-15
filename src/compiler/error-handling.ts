import { IRecognitionException, IToken } from 'chevrotain';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Number of context lines to show around errors
const ERROR_CONTEXT_LINES = 3;

export class CompilerError extends Error {
  constructor(
    message: string,
    public readonly fileName?: string,
    public readonly line?: number,
    public readonly column?: number,
    public readonly sourceCode?: string,
  ) {
    super(message);
    this.name = 'CompilerError';
  }
}

// Format parsing errors with source code context
export function formatParsingError(error: IRecognitionException, sourceFileName: string, sourceCode: string): string {
  const token = error.token;
  const line = token.startLine ?? 0;
  const column = token.startColumn ?? 0;
  
  let message = chalk.red(`Parsing error in ${sourceFileName}:${line}:${column}\n`);
  message += chalk.yellow(`${error.message}\n\n`);
  
  // Add source code context
  message += formatSourceCodeContext(sourceCode, line, column);
  
  // Add helpful hints based on error type
  if (error.name === 'NoViableAltException') {
    message += chalk.cyan('\nHint: Check for syntax errors like missing braces, parentheses, or keywords.\n');
  } else if (error.name === 'MismatchedTokenException') {
    message += chalk.cyan('\nHint: The parser found a token it didn\'t expect. Check your syntax.\n');
  } else if (error.name === 'NotAllInputParsedException') {
    message += chalk.cyan('\nHint: There are extra tokens after a valid structure. Check for misplaced code.\n');
  }
  
  return message;
}

// Format compilation errors with source code context
export function formatCompilationError(error: CompilerError): string {
  const { fileName, line, column, message, sourceCode } = error;
  
  let formattedMessage = chalk.red(`Compilation error${fileName ? ` in ${fileName}` : ''}${line ? `:${line}:${column}` : ''}\n`);
  formattedMessage += chalk.yellow(`${message}\n\n`);
  
  // Add source code context if available
  if (sourceCode && line) {
    formattedMessage += formatSourceCodeContext(sourceCode, line, column);
  }
  
  return formattedMessage;
}

// Generate source code context with line numbers and error pointer
function formatSourceCodeContext(sourceCode: string, errorLine: number, errorColumn: number = 0): string {
  const lines = sourceCode.split('\n');
  const startLine = Math.max(1, errorLine - ERROR_CONTEXT_LINES);
  const endLine = Math.min(lines.length, errorLine + ERROR_CONTEXT_LINES);
  
  let result = '';
  
  // Calculate line number padding for alignment
  const lineNumWidth = String(endLine).length;
  
  // Show context lines with line numbers
  for (let i = startLine; i <= endLine; i++) {
    const lineContent = lines[i - 1] || '';
    const lineNum = String(i).padStart(lineNumWidth, ' ');
    
    if (i === errorLine) {
      // Highlight the error line
      result += chalk.red(`${lineNum} | ${lineContent}\n`);
      
      // Add the error pointer
      if (errorColumn > 0) {
        const pointer = ' '.repeat(lineNumWidth + 3 + errorColumn - 1) + chalk.red('^');
        result += `${pointer}\n`;
      }
    } else {
      // Regular context line
      result += chalk.gray(`${lineNum} | ${lineContent}\n`);
    }
  }
  
  return result;
}

// Get source file content with error handling
export function getSourceFile(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new CompilerError(`Could not read source file: ${errorMessage}`, filePath);
  }
}

// Extract filename from path
export function getFileName(filePath: string): string {
  return path.basename(filePath);
} 