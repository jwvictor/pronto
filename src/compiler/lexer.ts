import { createToken, Lexer } from "chevrotain";

// Keywords
export const Import = createToken({ name: "Import", pattern: /import/ });
export const Prompt = createToken({ name: "Prompt", pattern: /prompt/ });
export const As = createToken({ name: "As", pattern: /as/ });
export const With = createToken({ name: "With", pattern: /with/ });
export const Input = createToken({ name: "Input", pattern: /input/ });
export const Returns = createToken({ name: "Returns", pattern: /returns/ });
export const Flow = createToken({ name: "Flow", pattern: /flow/ });
export const Return = createToken({ name: "Return", pattern: /return/ });
export const If = createToken({ name: "If", pattern: /if/ });
export const For = createToken({ name: "For", pattern: /for/ });
export const In = createToken({ name: "In", pattern: /in/ });
export const Loop = createToken({ name: "Loop", pattern: /loop/ });

// Logical operators
export const And = createToken({ name: "And", pattern: /and/ });
export const Or = createToken({ name: "Or", pattern: /or/ });
export const Not = createToken({ name: "Not", pattern: /not/ });

// Symbols
export const LCurly = createToken({ name: "LCurly", pattern: /{/ });
export const RCurly = createToken({ name: "RCurly", pattern: /}/ });
export const LParen = createToken({ name: "LParen", pattern: /\(/ });
export const RParen = createToken({ name: "RParen", pattern: /\)/ });
export const LBracket = createToken({ name: "LBracket", pattern: /\[/ });
export const RBracket = createToken({ name: "RBracket", pattern: /\]/ });
export const Colon = createToken({ name: "Colon", pattern: /:/ });
export const Comma = createToken({ name: "Comma", pattern: /,/ });
export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const Dot = createToken({ name: "Dot", pattern: /\./ });
export const LessThan = createToken({ name: "LessThan", pattern: /</ });
export const GreaterThan = createToken({ name: "GreaterThan", pattern: />/ });

// Comparison operators
export const DoubleEquals = createToken({ name: "DoubleEquals", pattern: /==/ });
export const NotEquals = createToken({ name: "NotEquals", pattern: /!=/ });
export const LessThanEquals = createToken({ name: "LessThanEquals", pattern: /<=/ });
export const GreaterThanEquals = createToken({ name: "GreaterThanEquals", pattern: />=/ });

export const StringLiteral = createToken({
  name: "StringLiteral",
  pattern: /"(?:[^"\\]|\\.)*"/,
});
export const NumberLiteral = createToken({
  name: "NumberLiteral",
  pattern: /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/,
});
export const BooleanLiteral = createToken({
  name: "BooleanLiteral",
  pattern: /true|false/,
});
export const Identifier = createToken({
  name: "Identifier",
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});
export const WhiteSpace = createToken({
  name: "WhiteSpace",
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

// Token order matters
export const allTokens = [
  WhiteSpace,
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
  // Order matters for operators - longer ones must come first
  DoubleEquals,
  Equals,
  NotEquals,
  LessThanEquals,
  GreaterThanEquals,
  LessThan,
  GreaterThan,
  Dot,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  Identifier,
];

export const PromptLangLexer = new Lexer(allTokens);
