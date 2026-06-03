/**
 * Automatable portion of the staging DR drill.
 * Neon PITR branch creation still requires Neon Console or NEON_API_KEY.
 */
import { checkDatabaseHealth, checkRedisHealth } from "../src/lib/health/checks";

async function main() {
  const started = Date.now();
  const [database, redis] = await Promise.all([
    checkDatabaseHealth(true),
    checkRedisHealth(true),
  ]);

  console.log(
    JSON.stringify(
      {
        drill: "smoke-baseline",
        executedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        database,
        redis,
      },
      null,
      2
    )
  );

  if (database.status === "fail") {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
