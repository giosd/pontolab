import assert from "node:assert/strict";
import { test } from "node:test";

import { evaluateMemory, getClientIp } from "../lib/rate-limit";

type Store = Parameters<typeof evaluateMemory>[0];

test("permite tentativas até o limite e bloqueia ao exceder", () => {
  const store: Store = new Map();
  const key = "login:ip:1.2.3.4";
  const now = 1_000;
  const max = 5;
  const windowMs = 600_000;

  for (let i = 0; i < max; i += 1) {
    const result = evaluateMemory(store, key, now, max, windowMs);
    assert.equal(result.allowed, true, `tentativa ${i + 1} deveria ser permitida`);
  }

  const blocked = evaluateMemory(store, key, now, max, windowMs);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("reinicia a contagem após a janela expirar", () => {
  const store: Store = new Map();
  const key = "login:email:user@test.com";
  const max = 2;
  const windowMs = 1_000;

  evaluateMemory(store, key, 0, max, windowMs);
  evaluateMemory(store, key, 0, max, windowMs);
  const blocked = evaluateMemory(store, key, 500, max, windowMs);
  assert.equal(blocked.allowed, false);

  const afterWindow = evaluateMemory(store, key, 2_000, max, windowMs);
  assert.equal(afterWindow.allowed, true);
  assert.equal(afterWindow.remaining, max - 1);
});

test("getClientIp prioriza o primeiro IP de x-forwarded-for", () => {
  const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" });
  assert.equal(getClientIp(headers), "9.9.9.9");
});

test("getClientIp usa fallbacks e retorna unknown sem headers", () => {
  assert.equal(getClientIp(new Headers({ "x-real-ip": "8.8.8.8" })), "8.8.8.8");
  assert.equal(getClientIp(new Headers()), "unknown");
});
