import assert from "node:assert/strict";
import { test } from "node:test";

import { redact } from "../lib/logger";

test("redige chaves sensíveis em qualquer nível", () => {
  const input = {
    email: "user@test.com",
    password: "secret123",
    nested: {
      token: "abc",
      cookie: "session=xyz",
      keep: "ok",
    },
    list: [{ authorization: "Bearer x", id: 1 }],
  };

  const output = redact(input) as Record<string, unknown>;

  assert.equal(output.email, "user@test.com");
  assert.equal(output.password, "[REDACTED]");

  const nested = output.nested as Record<string, unknown>;
  assert.equal(nested.token, "[REDACTED]");
  assert.equal(nested.cookie, "[REDACTED]");
  assert.equal(nested.keep, "ok");

  const list = output.list as Array<Record<string, unknown>>;
  assert.equal(list[0].authorization, "[REDACTED]");
  assert.equal(list[0].id, 1);
});

test("redige DATABASE_URL independentemente do case", () => {
  const output = redact({ DATABASE_URL: "postgresql://u:p@host/db" }) as Record<
    string,
    unknown
  >;
  assert.equal(output.DATABASE_URL, "[REDACTED]");
});

test("converte Error em objeto sem stacktrace", () => {
  const output = redact(new Error("boom")) as Record<string, unknown>;
  assert.equal(output.message, "boom");
  assert.equal("stack" in output, false);
});
