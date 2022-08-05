import { IncrementResponse, Store } from "./types";

/**
 * A `Store` that stores the hit count for each client in the given second window.
 *
 * @public
 */

export default class MemoryStore implements Store {
  /**
   *  The duration of time before which all hit counts are reset (in seconds). Defaults to `0`.
   */
  readonly windowSeconds: number;

  /**
   * The maximum number of connections to allow during the `window` before rate limiting the client. Defaults to `5`.
   */
  readonly maxConnections: number;

  /**
   * The map that stores the number of hits for each client in memory.
   */
  readonly hits = {};

  /**
   * MemoryStore constructor
   *
   * @param windowSeconds {number} - The duration of time before which all hit counts are reset (in seconds). Defaults to `0`.
   * @param maxConnections {number} - The maximum number of connections to allow during the `window` before rate limiting the client. Defaults to `5`.
   *
   */
  constructor(windowSeconds?: number, maxConnections?: number) {
    this.windowSeconds = windowSeconds ?? 0;
    this.maxConnections = maxConnections ?? 5;
  }

  /**
   * Method to increment a client's hit counter.
   *
   * @param key {string} - The identifier for a client.
   *
   * @returns {IncrementResponse} - The number of hits and reset time for that client.
   *
   * @public
   */
  async increment(key: string): Promise<IncrementResponse> {
    let accessTime = new Date();
    // check if key exists inside the store
    // if not, create a new record
    if (!this.hits.hasOwnProperty(key)) {
      // remove the key from store after windowSeconds seconds
      const timeOut = setTimeout(() => {
        delete this.hits[key];
      }, this.windowSeconds * 1000);
      if (timeOut.unref) timeOut.unref();
      return this.createNewRecord(accessTime /** accessTime as firstAccessTime*/, key);
    }

    let firstAccessTime = this.hits[key].firstAccessTime;
    // check if client did not pass the limit
    if (this.hits[key].totalHits > this.maxConnections) {
      return {
        hasPassedLimit: true,
        totalHits: this.hits[key].totalHits,
        resetTime: this.calculateNextResetTime(firstAccessTime),
      };
    }

    return {
      hasPassedLimit: false,
      totalHits: this.hits[key].totalHits++,
      resetTime: this.calculateNextResetTime(firstAccessTime),
    };
  }

  /**
   * Calculates the time when hit counters will be reset.
   *
   * @param accessTime {number} - The date that client first accessed the store.
   * @returns {Date}
   *
   * @private
   */
  private calculateNextResetTime = (accessTime: Date): Date => {
    accessTime.setMilliseconds(accessTime.getSeconds() + this.windowSeconds);
    return accessTime;
  };

  /**
   * Creates a new record for the client.
   *
   * @param accessTime {Date} - The date that client first accessed the store.
   * @param key {string} - The identifier for a given client.
   * @returns {IncrementResponse}
   *
   * @private
   */
  private createNewRecord(accessTime: Date, key: string): IncrementResponse {
    this.hits[key] = { firstAccessTime: accessTime, totalHits: 1 };
    return { hasPassedLimit: false, totalHits: this.hits[key].totalHits++, resetTime: this.calculateNextResetTime(accessTime) };
  }
}
