// Smoke test HTTP contra uma instância em execução (local ou Vercel).
// Uso: BASE_URL="https://app.vercel.app" node tests/smoke.mjs
// Padrão: http://localhost:3000

const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

let failures = 0;

function check(name, condition, detail = "") {
  const status = condition ? "PASS" : "FAIL";
  if (!condition) failures += 1;
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

async function run() {
  console.log(`Smoke tests contra: ${BASE_URL}\n`);

  // 1. Healthcheck
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    check(
      "GET /api/health responde 200 e status ok",
      res.status === 200 && body.status === "ok" && body.database === "ok",
      `status=${res.status} body=${JSON.stringify(body)}`,
    );
    check(
      "Healthcheck não expõe dados sensíveis",
      !JSON.stringify(body).toLowerCase().includes("postgres"),
    );
  } catch (error) {
    check("GET /api/health acessível", false, String(error));
  }

  // 2. Página de login acessível
  try {
    const res = await fetch(`${BASE_URL}/login`);
    check("GET /login responde 200", res.status === 200, `status=${res.status}`);
  } catch (error) {
    check("GET /login acessível", false, String(error));
  }

  // 3. Rota protegida redireciona sem sessão
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: "manual" });
    check(
      "GET /dashboard redireciona sem sessão",
      res.status === 307 || res.status === 302 || res.status === 308,
      `status=${res.status}`,
    );
  } catch (error) {
    check("GET /dashboard acessível", false, String(error));
  }

  console.log("");
  if (failures > 0) {
    console.error(`${failures} verificação(ões) falharam.`);
    process.exit(1);
  }
  console.log("Todos os smoke tests passaram.");
}

run();
