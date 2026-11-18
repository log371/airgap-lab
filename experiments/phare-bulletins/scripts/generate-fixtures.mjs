import { webcrypto } from "node:crypto";
import { writeFile } from "node:fs/promises";

const encoder = new TextEncoder();
const keys = await webcrypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"],
);
const publisher = "atelier-des-calanques";
const trust = { [publisher]: await webcrypto.subtle.exportKey("jwk", keys.publicKey) };
const sample = {
  version: 1,
  publisher,
  sequence: 42,
  issued: "2026-11-18T08:00:00Z",
  expires: "2026-11-18T16:00:00Z",
  title: "Maintenance du poste de lecture",
  body: "Exercice fictif. L’atelier est accessible de 14 h à 16 h. Vérifier la sauvegarde locale avant l’arrêt du poste. Le réseau reste indisponible pendant le test.",
};

async function sign(bulletin) {
  const payload = JSON.stringify(bulletin);
  const signature = await webcrypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, keys.privateKey, encoder.encode(payload),
  );
  return { payload, signature: Buffer.from(signature).toString("base64") };
}

const valid = await sign(sample);
const examples = {
  valid,
  changed: { ...valid, payload: JSON.stringify({ ...sample, body: "Horaire modifié pendant le transport." }) },
  expired: await sign({ ...sample, sequence: 41, issued: "2026-11-17T08:00:00Z", expires: "2026-11-17T16:00:00Z" }),
  unknown: await sign({ ...sample, publisher: "emetteur-inconnu" }),
};
const output = `// Données fictives. Générées par scripts/generate-fixtures.mjs.
// Seule la clé publique de démonstration est distribuée.
export const trust = ${JSON.stringify(trust, null, 2)};
export const examples = ${JSON.stringify(examples, null, 2)};
`;
await writeFile(new URL("../public/fixtures.mjs", import.meta.url), output);
