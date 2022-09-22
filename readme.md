# <div align="center"> Simple Rate Limiter Middleware </div>

<div align="center">

[![npm version](https://img.shields.io/npm/v/simple-rate-limiter-middleware.svg)](https://npmjs.org/package/simple-rate-limiter-middleware "View this project on NPM")
[![npm downloads](https://img.shields.io/npm/dm/simple-rate-limiter-middleware)](https://www.npmjs.com/package/simple-rate-limiter-middleware)

A simple in memory ip based rate limiter middleware for express apps.

</div>

<p>Note that this is a copy of express-middleware. It only has a slight modification to make it simpler.</p>
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

### Examples

To use it in an API-only server where the rate-limiter should be applied to all
requests:

```ts
const { rateLimit, MemoryStore } = require("simple-rate-limiter-middleware");

const rateLimiter = rateLimit({
  statusCode: 429,
  message: "Example response message.",
  legacyHeaders: false,
  standardHeaders: true,
  store: new MemoryStore(60, 10),
});

app.use(rateLimiter);
```

You can also create multiple instance and apply then to different places of your API.

### Troubleshooting Proxy Issues

If you are behind a proxy/load balancer (usually the case with most hosting
services, e.g. Heroku, Bluemix, AWS ELB, Nginx, Cloudflare, Akamai, Fastly,
Firebase Hosting, Rackspace LB, Riverbed Stingray, etc.), the IP address of the
request might be the IP of the load balancer/reverse proxy (making the rate
limiter effectively a global one and blocking all requests once the limit is
reached) or `undefined`. To solve this issue, add the following line to your
code (right after you create the express application):

```ts
app.set("trust proxy", numberOfProxies);
```

Where `numberOfProxies` is the number of proxies between the user and the server.

For more information about the `trust proxy` setting, take a look at the
[official Express documentation](https://expressjs.com/en/guide/behind-proxies.html).

## Issues and Contributing

If you encounter a bug or want to see something added/changed, please go ahead
and [open an issue](https://github.com/MyoniM/simple-rate-limiter-middleware/issues/new)!
If you need help with something, feel free to
[start a discussion](https://github.com/MyoniM/simple-rate-limiter-middleware/discussions/new)!

Fell free to contribute to the library.
