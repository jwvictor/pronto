# Pronto

A specialized language for building AI agent workflows with a clean, Python-inspired syntax. Pronto makes prompt-based development feel natural by treating prompts as first-class functions and providing seamless JavaScript interop.

## Key Features

### 1. First-Class Prompt Support
Import and use prompts as regular functions with type safety:

```
// Before (traditional JavaScript)
const result = await callPrompt("rank_ideas.njk", {
  ideas: ideaList,
  temperature: 0.7,
  max_tokens: 1000
});
const bestIdea = JSON.parse(result).best;

// After (with Pronto)
import prompt "rank_ideas.njk" as RankIdeas
  with input { ideas: list<Idea> }
  returns { best: Idea }

flow Main() {
  result = RankIdeas({ ideas: ideaList })
  return result.best  // Type-safe access
}
```

### 2. Clean Control Flow
Write complex agent logic without callback hell or promise chains:

```
// Before (traditional JavaScript)
async function processDocument() {
  const summary = await summarizePrompt(doc);
  const analysis = await analyzePrompt(summary);
  for (const point of analysis.points) {
    const detail = await detailPrompt(point);
    if (detail.score > 0.8) {
      await savePrompt(detail);
    }
  }
}

// After (with Pronto)
flow ProcessDocument(doc: Document) {
  summary = Summarize({ text: doc })
  analysis = Analyze({ summary })
  for point in analysis.points {
    detail = GetDetail({ point })
    if detail.score > 0.8 {
      Save({ detail })
    }
  }
}
```

### 3. Type-Safe Prompt Interactions
Catch prompt input/output mismatches at compile time:

```
import prompt "classify.njk" as Classify
  with input { text: string, categories: list<string> }
  returns { category: string, confidence: number }

flow ProcessText(text: string) {
  // This will fail at compile time if the input/output types don't match
  result = Classify({
    text: text,
    categories: ["A", "B", "C"]
  })
  
  if result.confidence > 0.9 {  // Type-safe access to result fields
    return result.category
  }
}
```

### 4. Python-Like Syntax with JavaScript Ecosystem
Write in a clean, familiar syntax while keeping access to the JavaScript ecosystem:

```
// Import from npm packages or local modules
import { processImage, uploadToS3 } from "./utils.js"

flow AnalyzeImage(url: string) {
  // Use JavaScript functions seamlessly
  image = processImage(url)
  
  // Mix with prompt calls naturally
  analysis = ImageAnalysis({ image })
  
  if analysis.isValid and not analysis.hasErrors {
    uploadToS3(analysis.result)
    return true
  }
  return false
}
```

## Motivation

Building AI agent workflows often involves complex prompt chaining, state management, and control flow. While this can be done in general-purpose programming languages, Pronto provides first-class support for prompts and flows, making it easier to:

- Write clear and maintainable agent logic
- Handle prompt inputs and outputs with type safety
- Compose complex workflows from simpler building blocks
- Focus on the business logic rather than boilerplate code

## Usage

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/pronto.git
cd pronto

# Install dependencies
npm install

# Build the compiler
npm run build
```

### Quick Start

Create a new file `example.pronto`:

```
import prompt "rank_ideas.njk" as RankIdeas
  with input { ideas: list<Idea> }
  returns { best: Idea }

flow Main() {
  ideas = GetIdeas()
  result = RankIdeas({ ideas })
  return result.best
}
```

Compile and run:

```bash
npm run compile example.pronto
node example.js
```

## Basic Programming Model

Pronto is built around two core concepts:

### 1. Prompts

Prompts are the basic building blocks. They represent template-based interactions with AI models. Each prompt:
- Has a defined input type
- Has a defined output type
- Is imported from a template file
- Can be called like a regular function

### 2. Flows

Flows are functions that orchestrate prompts and other logic. They:
- Can take typed parameters
- Can call prompts and other flows
- Support standard control flow (if, for, loop)
- Can return values
- Are async by default

## Language and Syntax

### Imports

```
// Import a prompt
import prompt "template.njk" as TemplateName
  with input { field: type }
  returns { field: type }

// Import symbols from JS modules
import { symbol1, symbol2 } from "./module.js"
```

### Types

Basic types:
- `string`
- `number`
- `boolean`
- `list<T>` - Generic list type

Object types:
```
{ 
  field1: string,
  field2: number,
  nested: { x: boolean }
}
```

### Control Flow

```
// If statement
if condition {
  // code
}

// For loop
for item in items {
  // code
}

// Infinite loop
loop {
  if shouldBreak {
    return
  }
}
```

### Operators

Comparison:
- `==`, `!=` - Equality
- `<`, `<=`, `>`, `>=` - Numeric comparison

Logical:
- `and` - Logical AND
- `or` - Logical OR
- `not` - Logical NOT

### Variables and Assignment

```
// Regular assignment
x = getValue()

// Destructuring assignment
{ field1, field2 } = getObject()
```

### Function Calls

```
// Regular call with positional args
result = myFlow(arg1, arg2)

// Named parameter call (required for prompts)
result = MyPrompt({ input: value })

// Method calls
result = object.method()
```

### Literals

```
// Strings
text = "Hello, world"

// Numbers
n = 42
pi = 3.14

// Booleans
flag = true

// Arrays
list = ["a", "b", "c"]

// Objects
obj = { x: 10, y: 20 }
```

## Contributing

Contributions are welcome! Here's how you can help:

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Make your changes
5. Run tests: `npm test`
6. Submit a pull request

### Project Structure

```
src/
  ├── compiler/      # Core compiler code
  │   ├── lexer.ts   # Tokenization
  │   ├── parser.ts  # Parsing
  │   ├── ast.ts     # AST definitions
  │   └── codegen.ts # Code generation
  ├── runtime/       # Runtime support
  └── cli/           # Command-line interface
```

### Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Keep changes focused and atomic

### Areas for Improvement

- Add more type system features
- Improve error messages and debugging
- Add static analysis and optimizations
- Expand standard library
- Add IDE/editor support 