# Le Phare · Bulletins hors ligne

Peut-on faire entrer une information utile dans un poste coupé d’Internet tout en vérifiant qui l’a publiée ? Ce prototype simule la réception d’un bulletin signé, avant toute lecture par une IA locale.

**À essayer** : accepter le bulletin signé, le rejouer, puis comparer le texte modifié, le bulletin expiré et l’émetteur inconnu. La démonstration utilise une horloge fixe et des données fictives. Le navigateur vérifie réellement la signature, les dates et la séquence.

## Exécuter hors ligne

Après récupération du dépôt, depuis ce dossier :

```sh
python3 -m http.server 8767 --bind 127.0.0.1 --directory public
```

Ouvrir http://127.0.0.1:8767. Python ne sert que les fichiers statiques. Les vérifications utilisent Web Crypto dans un navigateur récent, via HTTPS ou sur l’interface de bouclage. Le poste ne télécharge ni modèle ni dépendance à l’exécution, et l’interface n’envoie aucun fichier.

```sh
node --test tests/*.test.mjs
```

Pour régénérer les exemples, exécuter `node scripts/generate-fixtures.mjs`, puis les tests. Cette opération crée une nouvelle identité de démonstration en mémoire et remplace ensemble la clé publique et les exemples. Seule la clé publique est conservée.

## Récepteur local persistant

Avec Node.js 22 ou ultérieur, sans paquet npm à installer :

```sh
node scripts/receive.mjs bulletin.json --trust cles.json --ledger registre.json
```

`cles.json` associe chaque identifiant d’émetteur à sa clé publique JWK préinstallée. Le fichier importé est l’enveloppe existante, pas l’export du contenu décodé. La commande appelle directement `public/verify.mjs`, comme le navigateur. Elle utilise l’heure système par défaut et affiche une ligne JSON avec le verdict, la cause, l’heure et le chemin du registre. Codes de sortie : **0 accepté, 1 refusé, 2 erreur technique**. `--demo-time` est réservé aux exemples fictifs datés ; ne pas l’utiliser comme horloge de confiance en exploitation.

Le registre versionné conserve une séquence par émetteur. Seul un bulletin accepté entraîne une écriture : fichier temporaire dans le même répertoire, synchronisation disque, renommage atomique puis synchronisation du répertoire. Le répertoire parent doit déjà exister, sur un disque local persistant (Linux/macOS). Un verrou exclusif couvre la lecture, la vérification et l’écriture. Un registre illisible ou invalide provoque une erreur sans réinitialisation. Après un arrêt brutal, un dossier `.lock` peut rester : vérifier qu’aucun récepteur ne tourne avant de retirer **uniquement ce verrou** ; conserver le registre et les traces. Une erreur de synchronisation après renommage peut laisser le registre avancé : c’est une erreur technique, jamais une acceptation annoncée.

Suivre le [protocole PC de réemploi, hors réseau et après redémarrage](PROTOCOL-OFFLINE.md). La démo web reste autonome, avec son registre en mémoire distinct du fichier de la commande.

## Format et règle de décision

Une enveloppe JSON de 16 Kio au plus contient `payload` et `signature`. Le premier champ contient le bulletin JSON sous forme de chaîne. ECDSA P-256 avec SHA-256 signe les octets UTF-8 exacts de cette chaîne. La signature est encodée en Base64 (64 octets bruts, `r || s`). La clé publique de l’émetteur provient du registre local et jamais du fichier importé.

Le bulletin v1 identifie l’émetteur, une séquence entière croissante, les dates UTC de début et d’expiration, un titre et un corps texte. Le récepteur accepte le bulletin si la signature est valide, si l’heure appartient à l’intervalle [début, expiration[ et si la séquence est strictement supérieure au dernier bulletin accepté pour cet émetteur. L’export fournit le contenu décodé pour inspection, sans preuve cryptographique embarquée. Conserver l’enveloppe originale pour revérifier la signature ailleurs.

## LoRa Mesh

**État : piste d’essai radio.** Le fichier reste le premier mode d’entrée. Le [protocole du récepteur local](PROTOCOL-OFFLINE.md) précède le banc à trois nœuds et vérifie le registre après redémarrage. Le maillage serait un moyen d’acheminer ce fichier vers un poste sans Internet, en passant par un relais si la liaison directe est insuffisante.

LoRa est la modulation radio. Le maillage relève du protocole choisi, par exemple [Meshtastic et sa diffusion à nombre de sauts limité](https://meshtastic.org/docs/overview/mesh-algo/). LoRaWAN est [une architecture distincte, conçue en étoile](https://www.semtech.com/design-support/faq/P100). Pour un premier essai, garder une configuration fixe et tester une seule question : le relais améliore-t-il la réception dans les conditions du banc ?

### Banc minimal

1. **Émetteur A** : préparer un bulletin synthétique et signer le texte sur le poste de publication. Chaque bulletin de test reçoit un numéro de séquence distinct. La clé privée reste sur le poste de signature.
2. **Relais B** : retransmettre les paquets reçus selon le protocole maillé. La décision d’accepter le bulletin reste indépendante du relais.
3. **Récepteur C** : récupérer le message sur un poste de collecte. Pour commencer, transférer manuellement l’enveloppe JSON vers Le Phare et l’importer avec la commande locale (ou dans la démo navigateur, sans persistance). Cette séparation permet de tester les deux chaînes avant de les relier.

**Deux essais distincts.** Commencer par un petit message numéroté pour comparer le transport A–C avec et sans B. Passer ensuite à l’enveloppe signée. L’exemple valide actuel occupe **486 octets en JSON UTF-8 compact**, avant les en-têtes radio. Mesurer la charge utile disponible avec le matériel et le firmware choisis. Si l’enveloppe ne tient pas, garder le fractionnement hors du premier essai. Un essai de bout en bout demandera ensuite une enveloppe compacte ou un réassemblage borné qui restitue exactement les octets signés. Rejeter les messages incomplets.

### Ce qui compterait comme résultat

| Essai | Trace à conserver |
| --- | --- |
| A–C, puis A–B–C | Par exemple, 20 messages numérotés par configuration. Noter les reçus uniques, les pertes, les doublons et le délai. Garder la position des nœuds et les réglages fixes. |
| Bulletin signé reconstitué | Comparer les octets avant et après le transport. L’import doit accepter le bulletin valide et refuser le texte altéré. |
| Même bulletin importé deux fois | La commande locale doit refuser le second import avec le même registre, après relance. Voir le [protocole après redémarrage physique](PROTOCOL-OFFLINE.md), encore à exécuter sur le matériel cible. |

Le banc à trois nœuds mesurera la livraison radio indépendamment du verdict du récepteur : un fichier livré peut être refusé comme expiré, altéré ou déjà reçu.

L’heure, la clé de confiance et le registre de séquence relèvent du poste récepteur. Un maillage peut acheminer un message, mais il peut aussi le perdre, le dupliquer ou le retarder. La première série documentera le matériel, le firmware et les résultats bruts. Voir aussi [la note du labo sur le maillage LoRa](https://julienl.dev/lab/mesh-ai).

## Frontières de l’expérience

- Transport simulé par fichier. Réception radio, inférence et déploiement sur matériel isolé restent à éprouver.
- Navigateur : horloge fixe et registre en mémoire, remis à zéro après rechargement ou réinitialisation. Commande : heure système par défaut et registre persistant ; horloge fictive uniquement avec `--demo-time`. La perte ou la restauration d’une ancienne copie du registre affaiblit la protection contre le rejeu.
- La signature établit la provenance et l’intégrité sous une clé préinstallée. Toute application aval doit traiter le bulletin comme une donnée, avec ses propres contrôles. Les bulletins ne déclenchent aucune action.
- Pour un pilote, documenter l’installation et la rotation des clés, l’horloge de confiance et la sauvegarde/protection du registre persistant des séquences. Tester le transport séparément.

Licence MIT, voir le fichier `LICENSE` à la racine du dépôt.
