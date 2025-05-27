# DajungDajung Backend Style Guide

# Introduction
This style guide outlines the coding conventions for JavaScript and TypeScript code in the DajungDajung backend.
Built upon common community standards (Airbnb, StandardJS), with project-specific tweaks.

# Key Principles
* **Readability**: Code should be self-explanatory with meaningful names.
* **Consistency**: Follow common patterns across the codebase.
* **Robustness**: Handle errors and edge cases explicitly.

## Language & Formatting
* **Indentation**: 2 spaces.
* **Quotes**: Use single quotes for strings, backticks only for templates.
* **Semicolons**: Always terminate statements with a semicolon.
* **Line Length**: Max 100 characters.

## Imports
* **Module imports**: Use ES modules (`import … from …`).
* **Ordering**:
  1. Built-in Node.js modules
  2. Third-party packages
  3. Internal modules (absolute paths or aliases)
* **Extensions**: Omit `.js`/.ts` extensions in imports.

## Naming Conventions
* **Variables & functions**: camelCase
* **Constants**: UPPER_SNAKE_CASE
* **Classes & Interfaces**: PascalCase
* **Files**: kebab-case, matching default export name.

## TypeScript
* Always enable `"strict": true` in tsconfig.
* Prefer explicit return types for exported functions.
* Use `unknown` instead of `any` unless necessary.

## Error Handling
* Use `try/catch` around async operations.
* Centralize error formatting in `src/utils/error.ts`.

## Example
```ts
import http from 'http';
import { App } from './app';
import { logger } from './utils/logger';

const server = http.createServer(App);

server.listen(3000, () => {
  logger.info('Server started on port 3000');
});
```