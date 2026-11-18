export const MAX_FILE_BYTES = 16 * 1024;
const MAX_PAYLOAD_BYTES = 8 * 1024;
const utf8 = new TextEncoder();

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function date(value) {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return NaN;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value.replace("Z", ".000Z")
    ? time
    : NaN;
}

function text(value, max) {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export async function verifyBulletin(raw, { trust, now, lastAccepted }) {
  if (typeof raw !== "string" || utf8.encode(raw).length > MAX_FILE_BYTES) {
    return { state: "format" };
  }
  let envelope, bulletin, bytes;
  try {
    envelope = JSON.parse(raw);
    if (!object(envelope) || typeof envelope.payload !== "string" ||
        typeof envelope.signature !== "string" || !/^[A-Za-z0-9+/]{86}==$/.test(envelope.signature)) {
      return { state: "format" };
    }
    bytes = utf8.encode(envelope.payload);
    if (bytes.length > MAX_PAYLOAD_BYTES) return { state: "format" };
    bulletin = JSON.parse(envelope.payload);
  } catch {
    return { state: "format" };
  }

  if (!object(bulletin) || bulletin.version !== 1 ||
      typeof bulletin.publisher !== "string" || !/^[a-z0-9-]{1,48}$/.test(bulletin.publisher) ||
      !Number.isSafeInteger(bulletin.sequence) || bulletin.sequence < 1 ||
      !text(bulletin.title, 120) || !text(bulletin.body, 3000)) {
    return { state: "format" };
  }

  const issued = date(bulletin.issued);
  const expires = date(bulletin.expires);
  if (!Number.isFinite(issued) || !Number.isFinite(expires) || expires <= issued) {
    return { state: "format" };
  }
  if (!Object.hasOwn(trust, bulletin.publisher)) return { state: "unknown" };

  const algorithm = { name: "ECDSA", namedCurve: "P-256" };
  const key = await crypto.subtle.importKey("jwk", trust[bulletin.publisher], algorithm, false, ["verify"]);
  const signature = Uint8Array.from(atob(envelope.signature), (character) => character.charCodeAt(0));
  if (!await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, signature, bytes)) {
    return { state: "signature" };
  }
  if (now < issued) return { state: "early" };
  if (now >= expires) return { state: "expired" };
  if (bulletin.sequence <= (lastAccepted.get(bulletin.publisher) ?? 0)) return { state: "replay" };

  return { state: "accepted", bulletin };
}
