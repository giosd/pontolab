import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeBalanceHours,
  computeExpectedHours,
  roundHours,
} from "../lib/balance-math";

test("roundHours arredonda para 2 casas", () => {
  assert.equal(roundHours(8.005), 8.01);
  assert.equal(roundHours(7.999), 8);
  assert.equal(roundHours(10), 10);
});

test("computeExpectedHours = dias úteis * meta diária", () => {
  assert.equal(computeExpectedHours(22, 8), 176);
  assert.equal(computeExpectedHours(0, 8), 0);
  assert.equal(computeExpectedHours(5, 7.5), 37.5);
});

test("computeBalanceHours = trabalhado - esperado", () => {
  // 10h trabalhadas, meta 8h => +2h
  assert.equal(computeBalanceHours(10, 8), 2);
  // 6h trabalhadas, meta 8h => -2h
  assert.equal(computeBalanceHours(6, 8), -2);
  assert.equal(computeBalanceHours(176, 176), 0);
});

test("fluxo principal do HourBalance é consistente", () => {
  const businessDays = 20;
  const dailyGoal = 8;
  const worked = 170;

  const expected = computeExpectedHours(businessDays, dailyGoal);
  const balance = computeBalanceHours(worked, expected);

  assert.equal(expected, 160);
  assert.equal(balance, 10);
});
