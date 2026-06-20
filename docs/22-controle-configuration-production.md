# Controle configuration production

Avant une demonstration serieuse ou un deploiement, lancer le controle de configuration.

## Commande

Depuis la racine du projet :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-production-config.ps1
```

Verifier un autre fichier :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-production-config.ps1 -EnvPath ".\cotadise-backend\.env.production"
```

## Ce qui est controle

- `NODE_ENV`.
- Configuration PostgreSQL.
- Secrets forts :
  - `JWT_SECRET`
  - `APP_SECRET`
  - `WAVE_CONFIG_ENCRYPTION_KEY`
- Desactivation des donnees demo.
- Configuration SMTP si `EMAIL_DISPATCH_ENABLED=true`.
- Configuration Wave fallback.
- URLs publiques et URLs de retour Wave.

## Regle production

En production :

- `DEMO_SEED_ENABLED=false`.
- Aucun secret ne doit garder une valeur `change-me`.
- Les cles Wave ne doivent jamais etre dans l'application mobile.
- Le compte Wave actif doit idealement etre gere depuis l'admin par annee academique.
- L'email reel doit etre teste avant d'activer les relances automatiques par mail.

Le script retourne un code d'erreur si une configuration bloquante est detectee.
