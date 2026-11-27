import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter } from "./rate-limit.ts";

test("rate limiter allows the configured number of requests per key", () => {
  const consume = createRateLimiter(2, 60_000);

  assert.equal(consume("client-a", 1).allowed, true);
  assert.equal(consume("client-a", 2).allowed, true);
  assert.deepEqual(consume("client-a", 3), {
    allowed: false,
    retryAfterSeconds: 60,
  });
  assert.equal(consume("client-b", 3).allowed, true);
});

test("rate limiter resets an expired window and prunes expired keys at capacity", () => {
  const consume = createRateLimiter(1, 10_000, 1);

  assert.equal(consume("client-a", 1).allowed, true);
  assert.equal(consume("client-b", 2).allowed, false);
  assert.equal(consume("client-b", 10_001).allowed, true);
});
