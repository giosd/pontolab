import assert from "node:assert/strict";
import { test } from "node:test";

import {
  actionForMode,
  resolveUpdateTeamId,
  shouldUpdatePassword,
} from "../lib/user-update-helpers";

test("shouldUpdatePassword só é true quando há senha não-vazia", () => {
  // edição com senha vazia: mantém hash anterior
  assert.equal(shouldUpdatePassword(""), false);
  assert.equal(shouldUpdatePassword("   "), false);
  assert.equal(shouldUpdatePassword(undefined), false);
  assert.equal(shouldUpdatePassword(null), false);
  // edição com nova senha: troca hash
  assert.equal(shouldUpdatePassword("novaSenha123"), true);
});

test("resolveUpdateTeamId preserva equipe atual quando admin não envia campo", () => {
  assert.equal(
    resolveUpdateTeamId({
      editorRole: "ADMIN",
      editorTeamId: null,
      requestedTeamId: undefined,
      targetTeamId: "team-1",
    }),
    "team-1",
  );
});

test("resolveUpdateTeamId aplica valor enviado pelo admin (inclusive null)", () => {
  assert.equal(
    resolveUpdateTeamId({
      editorRole: "ADMIN",
      editorTeamId: null,
      requestedTeamId: "team-2",
      targetTeamId: "team-1",
    }),
    "team-2",
  );
  assert.equal(
    resolveUpdateTeamId({
      editorRole: "ADMIN",
      editorTeamId: null,
      requestedTeamId: null,
      targetTeamId: "team-1",
    }),
    null,
  );
});

test("resolveUpdateTeamId prende gestor à própria equipe", () => {
  assert.equal(
    resolveUpdateTeamId({
      editorRole: "GESTOR",
      editorTeamId: "team-gestor",
      requestedTeamId: "team-outra",
      targetTeamId: "team-1",
    }),
    "team-gestor",
  );
});

test("actionForMode nunca chama create em edição", () => {
  assert.equal(actionForMode("edit"), "update");
  assert.equal(actionForMode("create"), "create");
});
