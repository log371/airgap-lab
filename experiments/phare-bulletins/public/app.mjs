import { examples, trust } from "./fixtures.mjs";
import { MAX_FILE_BYTES, verifyBulletin } from "./verify.mjs";

const now = Date.parse("2026-11-18T10:00:00Z");
const ledger = new Map();
const $ = (id) => document.getElementById(id);
const buttons = [...document.querySelectorAll("[data-example]")];
const report = $("result");
const file = $("bulletin-file");
const reset = $("reset");
const exportButton = $("export");
let busy = false;
let accepted = null;

const outcomes = {
  ready: ["En attente d’un bulletin", "Choisis un scénario pour suivre la décision du poste récepteur."],
  accepted: ["Bulletin accepté", "La signature, la période de validité et la séquence ont été vérifiées."],
  signature: ["Signature invalide", "Le bulletin a été modifié ou sa signature ne correspond pas à la clé de confiance."],
  expired: ["Bulletin périmé", "La date de fin est atteinte ou dépassée dans le scénario."],
  unknown: ["Émetteur inconnu", "L’émetteur déclaré n’est pas dans le registre de confiance du poste."],
  early: ["Bulletin pas encore valide", "La date de début est postérieure à l’horloge du scénario."],
  replay: ["Séquence déjà utilisée", "Le poste a déjà accepté une séquence égale ou supérieure de cet émetteur."],
  format: ["Format refusé", "Le fichier doit être une enveloppe Phare v1 valide et peser au plus 16 Kio."],
  error: ["Vérification indisponible", "Ouvre la page via HTTPS ou un serveur local à l’adresse 127.0.0.1."],
};

function render(state, bulletin = null) {
  accepted = bulletin;
  const [title, detail] = outcomes[state];
  report.dataset.state = state;
  $("result-title").textContent = title;
  $("result-detail").textContent = detail;
  $("message").hidden = !bulletin;
  $("bulletin-title").textContent = bulletin?.title ?? "";
  $("bulletin-body").textContent = bulletin?.body ?? "";
  $("bulletin-meta").textContent = bulletin ? `${bulletin.publisher} · séquence ${bulletin.sequence} · expire à ${bulletin.expires}` : "";
  exportButton.disabled = !bulletin;
  $("sequence").textContent = ledger.get("atelier-des-calanques") ?? "—";
  reset.disabled = !ledger.size;
}

async function receive(read) {
  if (busy) return;
  busy = true;
  buttons.forEach((button) => { button.disabled = true; });
  file.disabled = reset.disabled = exportButton.disabled = true;
  try {
    if (!globalThis.crypto?.subtle) {
      render("error");
      return;
    }
    const result = await verifyBulletin(await read(), { trust, now, lastAccepted: ledger });
    if (result.state === "accepted") ledger.set(result.bulletin.publisher, result.bulletin.sequence);
    render(result.state, result.bulletin);
  } catch {
    render("error");
  } finally {
    busy = false;
    file.disabled = false;
    buttons.forEach((button) => { button.disabled = false; });
  }
}

function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + "\n"], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

for (const button of buttons) {
  button.addEventListener("click", () => receive(() => JSON.stringify(examples[button.dataset.example])));
}

file.addEventListener("change", () => {
  const selected = file.files[0];
  file.value = "";
  if (selected) receive(() => selected.size <= MAX_FILE_BYTES ? selected.text() : null);
});

reset.addEventListener("click", () => {
  ledger.clear();
  render("ready");
});

$("download-example").addEventListener("click", () => download("phare-bulletin-exemple.json", examples.valid));
exportButton.addEventListener("click", () => {
  if (accepted) download("phare-bulletin-verifie.json", accepted);
});

render("ready");
