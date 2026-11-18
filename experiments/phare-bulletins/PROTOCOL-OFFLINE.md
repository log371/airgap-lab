# Récepteur Le Phare : essai physique hors ligne

**Statut : protocole à exécuter sur un PC de réemploi.** Les tests automatisés lancent des processus distincts ; ils ne prouvent ni une coupure réseau physique, ni la tenue après redémarrage de la machine, ni une livraison radio.

## 1. Préparer avant la coupure

PC sous Linux, disque local persistant, Node.js 22 ou ultérieur installé et Git disponible pour la préparation. Depuis une copie du dépôt contenant cette version, ouvrir Bash :

```bash
cd experiments/phare-bulletins
mkdir -p essai-local
node --input-type=module <<'JS'
import { writeFileSync } from 'node:fs';
import { examples, trust } from './public/fixtures.mjs';
for (const [name, envelope] of Object.entries(examples)) {
  writeFileSync(`essai-local/${name}.json`, JSON.stringify(envelope) + '\n', { flag: 'wx' });
}
writeFileSync('essai-local/cles.json', JSON.stringify(trust) + '\n', { flag: 'wx' });
JS
pwd > essai-local/dossier.txt
git rev-parse HEAD > essai-local/commit.txt
node --version > essai-local/node.txt
uname -a > essai-local/systeme.txt
sha256sum essai-local/{valid,changed,expired,cles}.json > essai-local/fichiers.sha256
node --test tests/*.test.mjs > essai-local/tests.txt 2>&1
```

Attendu : tests sans échec ; aucun `registre.json` pour ce **nouvel** essai. Ne pas supprimer un registre existant pour faire accepter un rejeu. Ne pas régénérer les fixtures entre les étapes. La clé fournie est une identité fictive de démonstration, pas une autorité réelle. Noter le matériel, le disque et l’opérateur dans `essai-local/observations.txt`.

## 2. Couper le réseau et importer

Débrancher Ethernet et tout modem, désactiver Wi-Fi et Bluetooth ; noter l’heure réelle et les actions dans `observations.txt`. Conserver une photo ou une capture des interfaces désactivées. Aucune commande du récepteur n’utilise le réseau. L’option ci-dessous fixe **uniquement l’horloge fictive du vérificateur**, sans changer celle du PC, pour que le bulletin daté reste rejouable un autre jour.

```bash
set -o pipefail
node scripts/receive.mjs essai-local/valid.json --trust essai-local/cles.json --ledger essai-local/registre.json --demo-time 2026-11-18T10:00:00Z 2>&1 | tee essai-local/01-acceptation.jsonl
printf 'exit=%s\n' "${PIPESTATUS[0]}" | tee essai-local/01-exit.txt
cp essai-local/registre.json essai-local/registre-accepte.json
sha256sum essai-local/registre.json > essai-local/registre.sha256
```

Attendu : `exit=0`, `verdict:"ACCEPTE"`, `state:"accepted"`, émetteur `atelier-des-calanques`, séquence `42`, horloge `demo`. Le registre contient cette séquence. Ne poursuivre que si ce résultat est obtenu.

## 3. Redémarrer puis réimporter exactement le même fichier

```bash
sudo reboot
```

Après reconnexion, maintenir le réseau coupé (vérifier que le Wi-Fi ne s’est pas réactivé). Rouvrir Bash et revenir au chemin absolu noté dans `essai-local/dossier.txt` :

```bash
cd /chemin/vers/airgap-lab/experiments/phare-bulletins
set -o pipefail
sha256sum -c essai-local/fichiers.sha256
node scripts/receive.mjs essai-local/valid.json --trust essai-local/cles.json --ledger essai-local/registre.json --demo-time 2026-11-18T10:00:00Z 2>&1 | tee essai-local/02-rejeu.jsonl
printf 'exit=%s\n' "${PIPESTATUS[0]}" | tee essai-local/02-exit.txt
sha256sum -c essai-local/registre.sha256
```

Remplacer seulement `/chemin/vers/airgap-lab` par le chemin local préparé. Attendu : fichiers identiques (`OK`), `exit=1`, `verdict:"REFUSE"`, `state:"replay"`, motif « Séquence déjà acceptée ou inférieure pour cet émetteur. », registre inchangé (`OK`). Noter les heures d’arrêt/reprise et la coupure réseau observée.

## 4. Contrôles négatifs et trace

```bash
for cas in changed expired; do
  node scripts/receive.mjs "essai-local/$cas.json" --trust essai-local/cles.json --ledger essai-local/registre.json --demo-time 2026-11-18T10:00:00Z 2>&1 | tee "essai-local/03-$cas.jsonl"
  printf 'exit=%s\n' "${PIPESTATUS[0]}" | tee "essai-local/03-$cas-exit.txt"
done
sha256sum -c essai-local/registre.sha256
cmp essai-local/registre-accepte.json essai-local/registre.json
```

Attendu : deux refus, code 1, états `signature` puis `expired` ; empreinte `OK` et `cmp` sans sortie (code 0). Conserver **tout `essai-local/`**, dont les enveloppes originales, la clé publique, le registre, les sorties et les observations/photos. Une ligne `ERREUR` (code 2) est un essai non concluant à investiguer, pas un refus cryptographique. Ne jamais effacer un registre illisible pour contourner l’erreur.

Le [banc LoRa Mesh](README.md#lora-mesh) viendra ensuite mesurer reçus uniques, pertes, doublons et délais sur A–C puis A–B–C. La livraison radio et le verdict local auront des traces séparées. Aucun matériel radio, service cloud ou moteur d’inférence n’est requis pour ce protocole.
