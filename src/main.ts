// /src/main.ts

import { Request, Response, NextFunction, RequestHandler } from "express";
import MemoryStore from "./store";
import { Options, RateLimitExceededEventHandler, Store, ValueDeterminingMiddleware } from "./types";

interface Configuration {
  message: any;
  statusCode: number;
  legacyHeaders: boolean;
  standardHeaders: boolean;
  keyGenerator: ValueDeterminingMiddleware<string>;
  handler: RateLimitExceededEventHandler;
  store: Store;
}

const parseOptions = (passedOptions: Partial<Options>) => {
  // Passing undefined should be equivalent to not passing an option at all, so we'll
  // omit all fields where their value is undefined.
  const notUndefinedOptions: Partial<Options> = _omitUndefinedOptions(passedOptions);
  if (!notUndefinedOptions.store) {
    console.error("WARN `store` is undefined. You must create a custom MemoryStore with preferred options.");
  }
  const configuration: Configuration = {
    statusCode: 429,
    message: "Too many requests, please try again later.",
    legacyHeaders: notUndefinedOptions.legacyHeaders ?? true,
    standardHeaders: notUndefinedOptions.standardHeaders ?? false,
    keyGenerator(request: Request, _response: Response): string {
      if (!request.ip) console.error("WARN `request.ip` is undefined. You may use a custom keyGenerator function.");
      return request.ip;
    },
    async handler(_request: Request, response: Response, _next: NextFunction, _options: Options): Promise<void> {
      // Set the response status code
      response.status(configuration.statusCode);
      // Send the response if writable.
      if (!response.writableEnded) {
        response.send(configuration.message ?? "Too many requests, please try again later.");
      }
    },
    ...notUndefinedOptions,
    // Allow the options object to be overridden by the options passed to the middleware.
    store: notUndefinedOptions.store ?? new MemoryStore(),
  };
  return configuration;
};

/**
 * Just pass on any errors for the developer to handle, usually as a HTTP 500
 * Internal Server Error.
 *
 * @param fn {RequestHandler} - The request handler for which to handle errors.
 *
 * @returns {RequestHandler} - The request handler wrapped with a `.catch` clause.
 *
 * @private
 */
const _handleAsyncErrors =
  (fn: RequestHandler): RequestHandler =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      await Promise.resolve(fn(request, response, next)).catch(next);
    } catch (error: unknown) {
      next(error);
    }
  };

/**
 *
 * Create an instance of IP rate-limiting middleware for Express.
 *
 * @param passedOptions {Options} - Options to configure the rate limiter.
 *
 * @returns {RequestHandler} - The middleware that rate-limits clients based on your configuration.
 *
 * @public
 */
const rateLimit = (passedOptions: Partial<Options>): RequestHandler => {
  // Parse the options and add the default values for unspecified options
  const options = parseOptions(passedOptions ?? {});

  const middleware = _handleAsyncErrors(async (request: Request, response: Response, next: NextFunction) => {
    // Get a unique key for the client
    const key = await options.keyGenerator(request, response);

    // Increment the client's hit count by one
    const { hasPassedLimit, totalHits, resetTime } = await options.store.increment(key);
    const maxConnection = options.store.maxConnections;

    // Set the legacy RateLimit headers on the response object if enabled
    if (options.legacyHeaders) {
      response.setHeader("X-RateLimit-Limit", maxConnection);
      response.setHeader("X-RateLimit-Used", totalHits);
      response.setHeader("X-RateLimit-Remaining", maxConnection - totalHits);
    }

    // Set the standardized RateLimit headers on the response object if enabled
    if (options.standardHeaders) {
      response.setHeader("RateLimit-Limit", maxConnection);
      response.setHeader("RateLimit-Used", totalHits);
      response.setHeader("RateLimit-Remaining", maxConnection - totalHits);
    }

    // If the client has exceeded their rate limit, set the Retry-After header
    // and call the `handler` function
    if (hasPassedLimit) {
      if (options.legacyHeaders) response.setHeader("X-Retry-After", resetTime.toISOString());
      if (options.standardHeaders) response.setHeader("Retry-After", resetTime.toISOString());
      options.handler(request, response, next, options);
      return;
    }

    next();
  });

  return middleware as RequestHandler;
};

/**
 *
 * Remove any options where their value is set to undefined. This avoids overwriting defaults
 * in the case a client passes undefined instead of simply omitting the key.
 *
 * @param passedOptions {Options} - The options to omit.
 *
 * @returns {Options} - The same options, but with all undefined fields omitted.
 *
 * @private
 */
const _omitUndefinedOptions = (passedOptions: Partial<Options>): Partial<Configuration> => {
  const omittedOptions: Partial<Configuration> = {};

  for (const k of Object.keys(passedOptions)) {
    const key = k as any;
    if (passedOptions[key] !== undefined) {
      omittedOptions[key] = passedOptions[key];
    }
  }
  return omittedOptions;
};

export default rateLimit;
