import assert from "node:assert/strict";
import test from "node:test";
import { examples, trust } from "../public/fixtures.mjs";
import { MAX_FILE_BYTES, verifyBulletin } from "../public/verify.mjs";

const now = Date.parse("2026-11-18T10:00:00Z");
const envelope = (example) => JSON.stringify(examples[example]);

function verify(raw, options = {}) {
  return verifyBulletin(raw, { trust, now, lastAccepted: new Map(), ...options });
}

test("accepts the authentic bulletin and exposes its original text", async () => {
  const result = await verify(envelope("valid"));
  assert.equal(result.state, "accepted");
  assert.deepEqual(result.bulletin, JSON.parse(examples.valid.payload));
});

test("rejects a modified payload even when its sequence is newer", async () => {
  const changed = {
    ...examples.changed,
    payload: JSON.stringify({ ...JSON.parse(examples.changed.payload), sequence: 43 }),
  };
  const result = await verify(JSON.stringify(changed));
  assert.deepEqual(result, { state: "signature" });
});

test("rejects a publisher without an installed trust key", async () => {
  assert.deepEqual(await verify(envelope("unknown")), { state: "unknown" });
});

test("validity starts at issuance and ends at the expiry instant", async () => {
  assert.equal((await verify(envelope("expired"))).state, "expired");
  assert.equal((await verify(envelope("valid"), { now: Date.parse("2026-11-18T07:59:59Z") })).state, "early");
  assert.equal((await verify(envelope("valid"), { now: Date.parse("2026-11-18T08:00:00Z") })).state, "accepted");
  assert.equal((await verify(envelope("valid"), { now: Date.parse("2026-11-18T16:00:00Z") })).state, "expired");
});

test("rejects a replay and a lower sequence for that publisher", async () => {
  for (const sequence of [42, 43]) {
    const ledger = new Map([["atelier-des-calanques", sequence]]);
    assert.deepEqual(await verify(envelope("valid"), { lastAccepted: ledger }), { state: "replay" });
  }
  assert.equal((await verify(envelope("valid"), {
    lastAccepted: new Map([["another-publisher", 100], ["atelier-des-calanques", 41]]),
  })).state, "accepted");
});

test("rejects malformed, oversize and invalidly dated files", async () => {
  const impossibleDate = JSON.stringify({
    ...examples.valid,
    payload: JSON.stringify({ ...JSON.parse(examples.valid.payload), issued: "2026-02-31T08:00:00Z" }),
  });
  const oversized = "é".repeat(MAX_FILE_BYTES);
  for (const raw of [null, "{", "[]", "{}", impossibleDate, oversized]) {
    assert.deepEqual(await verify(raw), { state: "format" });
  }
});
