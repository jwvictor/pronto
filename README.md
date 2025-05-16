# Pronto

A specialized language and runtime for building AI agent workflows with a clean syntax. Pronto makes prompt-based development feel natural by treating prompts as first-class, strongly typed functions and providing seamless JavaScript interop. And, it transpiles down to Javascript so it can be swiftly integrated into any Javascript-based projects. 

Overall, Pronto offers several benefits:

1. Clean separation of concerns between the logic of your prompts and flows and the underlying mechanics of the AI interactions.
2. Reduced boilerplate for prompt generation, parsing, and API calls.
3. The runtime can be instrumented to provide valuable debugging, metrics, observability, etc. to the user.

With Pronto, a relatively complicated workflow can be put together in 20 lines. And you get to focus on the logic, not the implementation details.

## Key Features

### 1. Prompts as Functions
Import and use prompts as regular functions with type safety:

```
// After (with Pronto)
import prompt "rank_ideas.njk" as RankIdeas
  with input { ideas: list<string> }
  returns { scores: list<number> }

flow RankIdeas(ideaList: list<string>) {
  { scores } = RankIdeas({ ideas: ideaList })
}
```

### 2. Automatic AI Interactions and Parsing

All the logic for interacting with your AI of choice is encapsulated in the runtime. The API calls, the JSON extraction and parsing, and logging are all handled in the runtime layer. This means you can easily swap out models, change parameters, wire in observability, and so on, without trouble.

### 3. A type system designed for AI interactions

Pronto features a powerful type system, with types checked at runtime (since we cannot know at compile time what will be returned by the LLMs).

### 4. Clean syntax

The syntax was designed to make agentic flows simple to write. Familiar Javascript object shorthand is supported, and return types can be deconstructed to further minimize boilerplate, e.g. to invoke a prompt called `AnalyzeEvent`:

```
{ name, date, time } = AnalyzeEvent({ description });
```

## Motivation

Building AI agent workflows often involves complex prompt chaining, state management, and control flow. While this can be done in general-purpose programming languages, there tends to be a lot of boilerplate and data wrangling, even with packages like LangChain, muddying the clean separation of concerns for which I so deeply yearn.

Pronto seeks to decouple the agentic flow logic from the implementation details so agent development can be simple, fast, and well-encapsulated. To that end, Pronto provides first-class support for prompts and the flows that connect them, making it easier to:

- Write clear and maintainable agent logic cleanly decoupled from the underlying details of AI interactions
- Handle prompt inputs and outputs with type safety
- Compose complex workflows from simpler building blocks
- Focus on the business logic rather than boilerplate code

## Usage

### Installation

```bash
# Clone the repository
git clone https://github.com/jwvictor/pronto.git
cd pronto

# Install dependencies
npm install

# Build the compiler
npm run build
```

### Quick Start

Create a new file `example.pronto` along with any prompts it uses. Then compile and run:

```bash
node dist/index.js compile -i example.pronto -o example.js
OPENAI_API_KEY=xyz node example.js
```

See the examples directory to learn more.

## Basic Programming Model

Pronto is built around two core concepts:

### 1. Prompts

Prompts are the basic building blocks. They represent template-based interactions with AI models. Each prompt:
- Is defined in a Nunjucks template file
- Has defined input/output types
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
// Named parameter call (required for prompts and flows)
result = MyPrompt({ input: value })

// Or, in shorthand
result = MyPrompt({ value })

// Regular Javascript function call with positional args
result = myFlow(arg1, arg2)

// Method calls on Javascript objects
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
  └── runtime/       # Runtime support
```

### Guidelines

- Write clear commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style
- Keep changes focused and atomic

### Areas for Improvement

- Improve error messages and debugging
- Add static analysis and optimizations
- Expand standard library
- Add IDE/editor support (especially syntax highlighting) 
