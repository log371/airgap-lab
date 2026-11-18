import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, existsSync, mkdirSync, symlinkSync, readlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { webcrypto } from "node:crypto";
import { examples, trust } from "../public/fixtures.mjs";

const cli = fileURLToPath(new URL("../scripts/receive.mjs", import.meta.url));
function setup(t) {
  const dir = mkdtempSync(join(tmpdir(), "phare-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const ledger = join(dir, "ledger.json");
  const keys = join(dir, "trust.json");
  writeFileSync(keys, JSON.stringify(trust));
  for (const [name, envelope] of Object.entries(examples)) writeFileSync(join(dir, `${name}.json`), JSON.stringify(envelope));
  const run = (name = "valid", extra = []) => spawnSync(process.execPath, [cli, join(dir, `${name}.json`),
    "--trust", keys, "--ledger", ledger, "--demo-time", "2026-11-18T10:00:00Z", ...extra], { encoding: "utf8" });
  return { dir, ledger, keys, run };
}
function outcome(result, code, state) {
  assert.equal(result.status, code, result.stderr || result.stdout);
  const output = JSON.parse(code === 2 ? result.stderr : result.stdout);
  if (state) assert.equal(output.state, state);
  return output;
}

test("two distinct receiver processes accept then reject the identical file", (t) => {
  const { run, ledger } = setup(t);
  outcome(run(), 0, "accepted");
  const saved = readFileSync(ledger, "utf8");
  assert.deepEqual(JSON.parse(saved).sequences, { "atelier-des-calanques": 42 });
  outcome(run(), 1, "replay");
  assert.equal(readFileSync(ledger, "utf8"), saved);
});

test("all fixture refusals leave an absent or existing ledger untouched", (t) => {
  const { dir, ledger, run } = setup(t);
  writeFileSync(join(dir, "malformed.json"), "{");
  for (const initialized of [false, true]) {
    if (initialized) outcome(run(), 0, "accepted");
    const before = initialized ? readFileSync(ledger, "utf8") : null;
    for (const [name, state] of [["changed", "signature"], ["expired", "expired"], ["unknown", "unknown"], ["malformed", "format"]]) {
      outcome(run(name), 1, state);
      assert.equal(existsSync(ledger) ? readFileSync(ledger, "utf8") : null, before);
    }
  }
});

test("newer altered and correctly signed expired sequences never advance the ledger", async (t) => {
  const { dir, keys, ledger, run } = setup(t);
  outcome(run(), 0, "accepted");
  const before = readFileSync(ledger, "utf8");
  const pair = await webcrypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  writeFileSync(keys, JSON.stringify({ "atelier-des-calanques": await webcrypto.subtle.exportKey("jwk", pair.publicKey) }));
  const payload = JSON.stringify({ ...JSON.parse(examples.expired.payload), sequence: 100 });
  const signature = Buffer.from(await webcrypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, pair.privateKey, new TextEncoder().encode(payload))).toString("base64");
  writeFileSync(join(dir, "new-expired.json"), JSON.stringify({ payload, signature }));
  outcome(run("new-expired"), 1, "expired");
  writeFileSync(join(dir, "tampered.json"), JSON.stringify({ payload: payload.replace('100', '101'), signature }));
  outcome(run("tampered"), 1, "signature");
  assert.equal(readFileSync(ledger, "utf8"), before);
});

test("corrupt or unreadable ledger fails closed and is preserved", (t) => {
  const { run, ledger } = setup(t);
  for (const raw of ["{", "null", '{"version":1,"sequences":{"a":-1}}', '{"version":1,"sequences":[]}']) {
    writeFileSync(ledger, raw);
    assert.match(outcome(run(), 2).reason, /Registre invalide/);
    assert.equal(readFileSync(ledger, "utf8"), raw);
  }
  rmSync(ledger);
  mkdirSync(ledger);
  assert.match(outcome(run(), 2).reason, /Registre illisible/);
  assert.ok(existsSync(ledger));
  rmSync(ledger, { recursive: true });
  symlinkSync("missing-ledger.json", ledger);
  assert.match(outcome(run(), 2).reason, /Registre illisible/);
  assert.equal(readlinkSync(ledger), "missing-ledger.json");
});

test("busy ledger and invalid clock do not create state", (t) => {
  const { run, ledger } = setup(t);
  mkdirSync(`${ledger}.lock`);
  assert.match(outcome(run(), 2).reason, /Verrou/);
  assert.equal(existsSync(ledger), false);
  rmSync(`${ledger}.lock`, { recursive: true });
  outcome(run("valid", ["--demo-time", "invalid"]), 2);
  assert.equal(existsSync(ledger), false);
});
