// Données fictives. Générées par scripts/generate-fixtures.mjs.
// Seule la clé publique de démonstration est distribuée.
export const trust = {
  "atelier-des-calanques": {
    "key_ops": [
      "verify"
    ],
    "ext": true,
    "kty": "EC",
    "x": "HhCDxR3BVQsTBgYjPOKW8WyEC_u7xJlYBQ7boVynbDo",
    "y": "zpKHTBBGfTskdQwM1q58-_t4vKzWwMYv5m5GGLw_Agc",
    "crv": "P-256"
  }
};
export const examples = {
  "valid": {
    "payload": "{\"version\":1,\"publisher\":\"atelier-des-calanques\",\"sequence\":42,\"issued\":\"2026-11-18T08:00:00Z\",\"expires\":\"2026-11-18T16:00:00Z\",\"title\":\"Maintenance du poste de lecture\",\"body\":\"Exercice fictif. L’atelier est accessible de 14 h à 16 h. Vérifier la sauvegarde locale avant l’arrêt du poste. Le réseau reste indisponible pendant le test.\"}",
    "signature": "jb1xN3RfLhI/XN2sHrtI4hbDm81jQ72dQRSfrFR4xPKuwUEHPw5Ar5FQcQDBbT5IHZyDpAqZEUuEhvtn2I7kRA=="
  },
  "changed": {
    "payload": "{\"version\":1,\"publisher\":\"atelier-des-calanques\",\"sequence\":42,\"issued\":\"2026-11-18T08:00:00Z\",\"expires\":\"2026-11-18T16:00:00Z\",\"title\":\"Maintenance du poste de lecture\",\"body\":\"Horaire modifié pendant le transport.\"}",
    "signature": "jb1xN3RfLhI/XN2sHrtI4hbDm81jQ72dQRSfrFR4xPKuwUEHPw5Ar5FQcQDBbT5IHZyDpAqZEUuEhvtn2I7kRA=="
  },
  "expired": {
    "payload": "{\"version\":1,\"publisher\":\"atelier-des-calanques\",\"sequence\":41,\"issued\":\"2026-11-17T08:00:00Z\",\"expires\":\"2026-11-17T16:00:00Z\",\"title\":\"Maintenance du poste de lecture\",\"body\":\"Exercice fictif. L’atelier est accessible de 14 h à 16 h. Vérifier la sauvegarde locale avant l’arrêt du poste. Le réseau reste indisponible pendant le test.\"}",
    "signature": "eu9Vd0xa231N9hVrO9vM2jMm9p7fkbLNgOScY0St1toS7b56b/kssg/StdF+ajEDzNR8E7eYvje+y414RGoqWA=="
  },
  "unknown": {
    "payload": "{\"version\":1,\"publisher\":\"emetteur-inconnu\",\"sequence\":42,\"issued\":\"2026-11-18T08:00:00Z\",\"expires\":\"2026-11-18T16:00:00Z\",\"title\":\"Maintenance du poste de lecture\",\"body\":\"Exercice fictif. L’atelier est accessible de 14 h à 16 h. Vérifier la sauvegarde locale avant l’arrêt du poste. Le réseau reste indisponible pendant le test.\"}",
    "signature": "l9dkVfaX+X8jj1XTFE9aAYhXYtHkwuFA2Zqxz6oTr0RYm/iwLEcnWDSFep3+mW0kPVD6Ii8Mq+BxVBWcW9n0PQ=="
  }
};
