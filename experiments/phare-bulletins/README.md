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

## Format et règle de décision

Une enveloppe JSON de 16 Kio au plus contient `payload` et `signature`. Le premier champ contient le bulletin JSON sous forme de chaîne. ECDSA P-256 avec SHA-256 signe les octets UTF-8 exacts de cette chaîne. La signature est encodée en Base64 (64 octets bruts, `r || s`). La clé publique de l’émetteur provient du registre local et jamais du fichier importé.

Le bulletin v1 identifie l’émetteur, une séquence entière croissante, les dates UTC de début et d’expiration, un titre et un corps texte. Le récepteur accepte le bulletin si la signature est valide, si l’heure appartient à l’intervalle [début, expiration[ et si la séquence est strictement supérieure au dernier bulletin accepté pour cet émetteur. L’export fournit le contenu décodé pour inspection, sans preuve cryptographique embarquée. Conserver l’enveloppe originale pour revérifier la signature ailleurs.

## Frontières de l’expérience

- Transport simulé par fichier. Réception radio, inférence et déploiement sur matériel isolé restent à éprouver.
- Horloge fixe pour tous les essais, y compris les imports. Le registre de séquences est en mémoire et repart de zéro après rechargement ou réinitialisation.
- La signature établit la provenance et l’intégrité sous une clé préinstallée. Toute application aval doit traiter le bulletin comme une donnée, avec ses propres contrôles. Les bulletins ne déclenchent aucune action.
- Pour un pilote, documenter l’installation et la rotation des clés, l’horloge de confiance et le stockage persistant des séquences. Tester le transport séparément.

Licence MIT, voir le fichier `LICENSE` à la racine du dépôt.
