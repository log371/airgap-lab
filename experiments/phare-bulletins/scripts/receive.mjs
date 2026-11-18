#!/usr/bin/env node
import { lstatSync, readFileSync, openSync, readSync, closeSync, writeFileSync, fsyncSync, renameSync, unlinkSync, mkdirSync, rmdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { parseArgs } from "node:util";
import { MAX_FILE_BYTES, verifyBulletin } from "../public/verify.mjs";

const reasons = {
  accepted: "Signature, dates et séquence valides ; registre enregistré.",
  format: "Enveloppe Phare v1 invalide ou supérieure à 16 Kio.",
  unknown: "Émetteur absent des clés de confiance locales.",
  signature: "Signature invalide : contenu altéré ou mauvaise signature.",
  early: "Bulletin pas encore valide à l’heure choisie.",
  expired: "Bulletin expiré à l’heure choisie.",
  replay: "Séquence déjà acceptée ou inférieure pour cet émetteur.",
};

function readLedger(path) {
  let raw;
  try { raw = readFileSync(path, "utf8"); }
  catch (error) {
    if (error.code === "ENOENT") {
      // A dangling symlink is not a new ledger.
      try { lstatSync(path); }
      catch (statError) { if (statError.code === "ENOENT") return new Map(); }
    }
    throw new Error(`Registre illisible : ${error.message}`);
  }
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== 1 || !data.sequences ||
        typeof data.sequences !== "object" || Array.isArray(data.sequences)) throw new Error();
    const entries = Object.entries(data.sequences);
    if (entries.some(([publisher, sequence]) => !/^[a-z0-9-]{1,48}$/.test(publisher) ||
        !Number.isSafeInteger(sequence) || sequence < 1)) throw new Error();
    return new Map(entries);
  } catch { throw new Error("Registre invalide : conservé sans réinitialisation."); }
}

function saveLedger(path, ledger) {
  const temp = `${path}.${randomUUID()}.tmp`;
  let fd;
  try {
    fd = openSync(temp, "wx", 0o600);
    writeFileSync(fd, JSON.stringify({ version: 1, sequences: Object.fromEntries(ledger) }, null, 2) + "\n");
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    renameSync(temp, path);
    // Flush the directory entry as well as the file before reporting acceptance.
    const directory = openSync(dirname(path), "r");
    try { fsyncSync(directory); } finally { closeSync(directory); }
  } finally {
    if (fd !== undefined) closeSync(fd);
    try { unlinkSync(temp); } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
}

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    trust: { type: "string" }, ledger: { type: "string" }, "demo-time": { type: "string" },
  } });
  if (positionals.length !== 1 || !values.trust || !values.ledger) {
    throw new Error("Usage : node scripts/receive.mjs BULLETIN.json --trust CLES.json --ledger REGISTRE.json [--demo-time 2026-11-18T10:00:00Z]");
  }
  const now = values["demo-time"] === undefined ? Date.now() : Date.parse(values["demo-time"]);
  if (!Number.isFinite(now)) throw new Error("Heure de démonstration invalide.");
  const trust = JSON.parse(readFileSync(values.trust, "utf8"));
  if (!trust || typeof trust !== "object" || Array.isArray(trust)) throw new Error("Clés de confiance invalides.");
  const path = resolve(values.ledger);
  const lock = `${path}.lock`;
  try { mkdirSync(lock, { mode: 0o700 }); }
  catch (error) { throw new Error(`Verrou du registre indisponible (${error.code}) : aucun import effectué.`); }
  try {
    const ledger = readLedger(path);
    // Bound the read even when the supplied file is larger than the envelope limit.
    const fd = openSync(positionals[0], "r");
    const buffer = Buffer.alloc(MAX_FILE_BYTES + 1);
    let count = 0;
    try {
      while (count < buffer.length) {
        const bytes = readSync(fd, buffer, count, buffer.length - count, null);
        if (!bytes) break;
        count += bytes;
      }
    } finally { closeSync(fd); }
    const result = await verifyBulletin(count > MAX_FILE_BYTES ? null : buffer.subarray(0, count).toString("utf8"), {
      trust, now, lastAccepted: ledger,
    });
    if (result.state === "accepted") {
      ledger.set(result.bulletin.publisher, result.bulletin.sequence);
      saveLedger(path, ledger);
    }
    console.log(JSON.stringify({
      verdict: result.state === "accepted" ? "ACCEPTE" : "REFUSE",
      state: result.state, reason: reasons[result.state],
      time: new Date(now).toISOString(), clock: values["demo-time"] === undefined ? "system" : "demo",
      ledger: path,
      ...(result.bulletin ? { publisher: result.bulletin.publisher, sequence: result.bulletin.sequence } : {}),
    }));
    process.exitCode = result.state === "accepted" ? 0 : 1;
  } finally { rmdirSync(lock); }
} catch (error) {
  console.error(JSON.stringify({ verdict: "ERREUR", reason: error.message }));
  process.exitCode = 2;
}
