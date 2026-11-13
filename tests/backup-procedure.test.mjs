import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("free-tier backup script is scoped, encrypted, and cleans plaintext exports", async () => {
  const script = await readFile(new URL("../scripts/backup-supabase-free.sh", import.meta.url), "utf8");
  assert.match(script, /xpbjdeknjudurulogjkr/);
  assert.match(script, /\$SUPABASE_DB_URL.*\*\$project_ref/);
  assert.match(script, /--role-only/);
  assert.match(script, /--data-only --use-copy/);
  assert.match(script, /age --encrypt/);
  assert.match(script, /rm -f "\$archive"/);
  assert.match(script, /sha256sum/);
  assert.match(script, /managed auth\/storage schemas/);
});

test("backup artifacts are excluded from git and scope limitations are documented", async () => {
  const [ignore, docs] = await Promise.all([
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
    readFile(new URL("../docs/BACKUP_AND_RECOVERY.md", import.meta.url), "utf8"),
  ]);
  assert.match(ignore, /^\/backups\/$/m);
  assert.match(docs, /does \*\*not\*\* include automatic daily database backups/);
  assert.match(docs, /Auth users\/settings/);
  assert.match(docs, /Storage object bytes/);
  assert.match(docs, /restore drill/);
});
