# <div align="center"> Simple Rate Limiter Middleware </div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/simple-rate-limiter-middleware.svg)](https://npmjs.org/package/simple-rate-limiter-middleware "View this project on NPM")
[![npm downloads](https://img.shields.io/npm/dm/simple-rate-limiter-middleware)](https://www.npmjs.com/package/simple-rate-limiter-middleware)

A simple in memory ip based rate limiter middleware for express apps.

</div>

## Installation

```sh
# Using npm
> npm install simple-rate-limiter-middleware
# Using yarn or pnpm
> yarn/pnpm add simple-rate-limiter-middleware
```

## Usage

### Importing

This library is provided in ESM as well as CJS forms, and works with both
Javascript and Typescript projects.

Import it in a CommonJS project (`type: commonjs` or no `type` field in
`package.json`) as follows:

```ts
const { rateLimit, MemoryStore } = require("simple-rate-limiter-middleware");
```

Import it in a ESM project (`type: module` in `package.json`) as follows:

```ts
import { rateLimit, MemoryStore } from "simple-rate-limiter-middleware";
```
