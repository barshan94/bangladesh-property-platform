import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("manual migration-history repair is fail-closed and scoped to the dedicated project", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/reconcile-supabase-migration-history.yml", import.meta.url),
    "utf8",
  );

  assert.match(workflow, /^on:\s*\n\s+workflow_dispatch:/m);
  assert.match(workflow, /if:\s*github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /SUPABASE_ACCESS_TOKEN:\s*\$\{\{\s*secrets\.SUPABASE_ACCESS_TOKEN\s*\}\}/);
  assert.match(workflow, /SUPABASE_DB_PASSWORD:\s*\$\{\{\s*secrets\.SUPABASE_DB_PASSWORD\s*\}\}/);
  assert.match(workflow, /if \[\[ -z "\$SUPABASE_ACCESS_TOKEN" \|\| -z "\$SUPABASE_DB_PASSWORD" \]\]/);
  assert.match(workflow, /SUPABASE_PROJECT_REF:\s*xpbjdeknjudurulogjkr/);
  assert.match(workflow, /supabase link --project-ref "\$SUPABASE_PROJECT_REF"/);
  assert.equal((workflow.match(/supabase migration list --remote/g) ?? []).length, 2,
    "both history checks must explicitly target the linked remote project");

  const repairStart = workflow.indexOf("supabase migration repair");
  const repairEnd = workflow.indexOf("--status applied", repairStart);
  assert.ok(repairStart >= 0 && repairEnd > repairStart, "workflow must contain one explicit migration repair command");
  const repair = workflow.slice(repairStart, workflow.indexOf("\n\n      - name:", repairEnd));
  assert.match(repair, /--remote/, "repair must explicitly target the linked remote project");
  for (const version of [
    "20261112131600",
    "20261113100000",
    "20261113120000",
    "20261113130000",
  ]) assert.ok(repair.includes(version), `repair must include verified migration ${version}`);

  assert.doesNotMatch(workflow, /supabase\s+(?:db\s+(?:push|reset)|migration\s+up)/);
  assert.doesNotMatch(workflow, /mmgaxpkkcmwytpbisobk/);
});
