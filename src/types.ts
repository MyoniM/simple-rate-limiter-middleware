import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Express request handler that sends back a response when a client is
 * rate-limited.
 *
 * @param request {Request} - The Express request object.
 * @param response {Response} - The Express response object.
 * @param next {NextFunction} - The Express `next` function, can be called to skip responding.
 * @param optionsUsed {Options} - The options used to set up the middleware.
 */
export type RateLimitExceededEventHandler = (request: Request, response: Response, next: NextFunction, optionsUsed: Options) => void;

/**
 * A modified Express request handler with the rate limit functions.
 */
export type RateLimitRequestHandler = RequestHandler & {
  /**
   * Method to reset a client's hit counter.
   *
   * @param key {string} - The identifier for a client.
   */
  resetKey: (key: string) => void;
};

/**
 * An interface that all hit counter stores must implement.
 */
export interface Store {
  /**
   * The duration of time before which all hit counts are reset (in seconds).
   *
   * Defaults to `0`.
   */
  windowSeconds: number;
  /**
   * The maximum number of connections to allow during the `window` before
   * rate limiting the client.
   *
   * Defaults to `5`.
   */
  readonly maxConnections: number;
  /**
   * The map that stores the number of hits for each client in memory.
   */
  hits: { [key: string]: number | undefined };
  /**
   * Method to increment a client's hit counter.
   *
   * @param key {string} - The identifier for a client.
   *
   * @returns {IncrementResponse} - The number of hits and reset time for that client.
   */
  increment: (key: string) => Promise<IncrementResponse>;
}

/**
 * The configuration options for the rate limiter.
 */
export interface Options {
  /**
   * The response body to send back when a client is rate limited.
   *
   * Defaults to `'Too many requests, please try again later.'`
   */
  readonly message: any;

  /**
   * The HTTP status code to send back when a client is rate limited.
   *
   * Defaults to `HTTP 429 Too Many Requests` (RFC 6585).
   */
  readonly statusCode: number;

  /**
   * Whether to send `X-RateLimit-*` headers with the rate limit and the number
   * of requests.
   *
   * Defaults to `true` (for backward compatibility).
   */
  readonly legacyHeaders: boolean;

  /**
   * Whether to enable support for the standardized rate limit headers (`RateLimit-*`).
   *
   * Defaults to `false` (for backward compatibility, but its use is recommended).
   */
  readonly standardHeaders: boolean;

  /**
   * The `Store` to use to store the hit count for each client.
   *
   * By default, the built-in `MemoryStore` will be used.
   */
  secondStore?: Store;
  minuteStore?: Store;
  hourStore?: Store;
}

/**
 * Data returned from the `Store` when a client's hit counter is incremented.
 *
 * @property totalHits {number} - The number of hits for that client so far.
 * @property resetTime {Date | undefined} - The time when the counter resets.
 */
export type IncrementResponse = {
  hasPassedLimit: boolean;
  totalHits: number;
  resetTime: Date;
};

/**
 * Method (in the form of middleware) to generate/retrieve a value based on the
 * incoming request.
 *
 * @param request {Request} - The Express request object.
 * @param response {Response} - The Express response object.
 *
 * @returns {T} - The value needed.
 */
export type ValueDeterminingMiddleware<T> = (request: Request, response: Response) => T | Promise<T>;

/**
 * The extended request object that includes information about the client's
 * rate limit.
 */
export type AugmentedRequest = Request & {
  [key: string]: RateLimitInfo;
};

/**
 * The rate limit related information for each client included in the
 * Express request object.
 */
export interface RateLimitInfo {
  readonly limit: number;
  readonly current: number;
  readonly remaining: number;
  readonly resetTime: Date | undefined;
}
