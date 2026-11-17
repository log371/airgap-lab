# Publication du dossier Airgap Lab

Le répertoire `docs/` est la racine du projet Vercel relié au dépôt GitHub. La branche `main` porte la production. Aucun backend Python n’est déployé.

## Parcours public

- `index.html` : dossier technique en français, architecture, preuves, pistes v0.2 et reproduction locale.
- `atelier-v02.html` : choix du jalon, spécifications, tâches, journal, hypothèses, décisions, checklist et présentation.
- `assets/` : styles, filtre des preuves et favicon, sans CDN.

Le dossier de portfolio est maintenu dans `log371/sentinel-v3`, sous `content/projects/airgap-lab.mdx`.

## Déploiement

1. Relier `log371/airgap-lab` au projet Vercel de l’équipe propriétaire.
2. Configurer Root Directory sur `docs` et Framework Preset sur Other.
3. Le fichier `docs/vercel.json` décrit la publication statique et ses en-têtes. Aucune installation ni compilation n’est nécessaire.
4. Une modification de la branche de production déclenche la publication par l’intégration Git.

## Vérification avant publication

Ouvrir `index.html`, vérifier les filtres et les liens, parcourir l’atelier et tester export/import sur un profil vierge. Vérifier aussi les petits écrans et l’accès sans authentification à l’URL de production. Le succès du déploiement statique ne valide pas les tests de l’inspecteur Python.

## Données et limites

Le site public ne contacte aucun service local et ne collecte aucune donnée hôte. Le suivi de l’atelier reste dans `localStorage` sur l’origine du navigateur, sans synchronisation GitHub ou Vercel. Exporter manuellement le JSON pour le conserver ; éviter les traces sensibles dans tout contenu public.

La politique CSP bloque les connexions de l’application (`connect-src 'none'`). Les styles et scripts intégrés restent autorisés pour préserver l’atelier autonome. Il n’y a ni analytique applicative ni police externe ; l’hébergeur traite nécessairement les requêtes de consultation.

Le logiciel reste en v0.1. La publication de ce dossier ne choisit pas la piste v0.2, n’exécute pas les essais et ne certifie pas l’air-gap. Les affirmations documentaires sont datées et doivent être relues après évolution du code.
