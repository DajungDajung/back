# DajungDajung Backend TypeScript Style Guide

## Introduction
This style guide defines the coding conventions for JavaScript and TypeScript in the DajungDajung backend.  
It builds upon community standards (Airbnb, StandardJS) with project-specific rules.

## Key Principles
* **Readability**: Code should be clear and self-explanatory.
* **Consistency**: Follow the same patterns across the codebase.
* **Safety**: Leverage TypeScript's type system to prevent errors.
* **Maintainability**: Organize code for ease of extension and refactoring.

## Language & Formatting
* **File extension**: `.ts` for TypeScript, `.js` only for scripts not requiring types.
* **Indentation**: 2 spaces.
* **Semicolons**: Always use semicolons.
* **Quotes**: Single quotes for strings; backticks for template literals only.
* **Line length**: Maximum 100 characters.
* **Trailing commas**: Include in multiline objects and arrays.
* **Whitespace**:  
  - One space after keywords (`if (condition)`).  
  - No space inside parentheses (`func(arg)`).

## Imports
* **Module syntax**: Use ES module imports: `import X from 'module';`.
* **Order**:
  1. Node built-ins
  2. External packages
  3. Absolute imports (using configured aliases)
  4. Relative imports
* **Extensions**: Omit `.ts` and `.js` extensions in import paths.
* **Grouping**: Keep each group separated by a single blank line.

## Naming Conventions
* **Variables & functions**: `camelCase`
* **Constants**: `UPPER_SNAKE_CASE`
* **Types & Interfaces**: `PascalCase` (prefix interfaces with `I` only if necessary)
* **Enums**: `PascalCase`
* **Classes**: `PascalCase`
* **Files**: `kebab-case`, matching default export name.

## TypeScript Practices
* Enable `"strict": true` in `tsconfig.json`.
* Prefer explicit return types on exported functions.
* Use `unknown` instead of `any`. Narrow `unknown` to proper types before use.
* Avoid `// @ts-ignore`; prefer fixing the type error.
* Use `readonly` for immutable properties.
* Use generics judiciously for reusable components and functions.
* Leverage discriminated unions for exhaustive checks.

## Error Handling
* Wrap async operations in `try/catch`.
* Always handle promise rejections.
* Centralize error formatting and logging in `src/utils/error.ts`.
* Throw custom error classes extending `Error` with meaningful names.

## Tooling
* **Formatter**: Prettier with default settings, configured via `.prettierrc`.
* **Linter**: ESLint with `@typescript-eslint` plugin.  
* **Lint rules**:
  - Enforce consistent import order.
  - Disallow unused variables (`no-unused-vars`).
  - Warn on `any` usage (`@typescript-eslint/no-explicit-any`).
* **Automate formatting**: Run Prettier on save and as a pre-commit hook.

## Example

```ts
import http from 'http';
import { App } from './app';
import { logger } from './utils/logger';

async function startServer(): Promise<void> {
  try {
    const server = http.createServer(App);
    server.listen(3000, () => {
      logger.info('Server started on port 3000');
    });
  } catch (err: unknown) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

startServer();
```