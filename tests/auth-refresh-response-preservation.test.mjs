import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const middlewareSource = await readFile(
  new URL("../src/lib/supabase/middleware.ts", import.meta.url),
  "utf8",
);

test("Supabase auth refresh preserves response headers and prior cookies", () => {
  assert.match(middlewareSource, /const previousHeaders=new Headers\(response\.headers\)/);
  assert.match(middlewareSource, /const previousCookies=response\.cookies\.getAll\(\)/);
  assert.match(middlewareSource, /previousHeaders\.forEach\(\(value,key\)=>response\.headers\.set\(key,value\)\)/);
  assert.match(middlewareSource, /previousCookies\.forEach\(cookie=>response\.cookies\.set\(cookie\)\)/);
  assert.match(middlewareSource, /values\.forEach\(\(\{name,value,options\}\)=>response\.cookies\.set\(name,value,options\)\)/);
  assert.match(middlewareSource, /values\.forEach\(\(\{name,value\}\)=>request\.cookies\.set\(name,value\)\)/);
});
