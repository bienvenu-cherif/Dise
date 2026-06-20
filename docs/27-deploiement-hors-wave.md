# Deploiement hors integration Wave reelle

Pour le deploiement gere retenu sur Render, suivre en priorite
`28-mise-en-production-render.md` et le Blueprint `render.yaml`.

## Architecture cible

- `api.votre-domaine`: backend NestJS HTTPS.
- `admin.votre-domaine`: frontend tresorier et pages legales.
- PostgreSQL gere ou conteneur PostgreSQL avec volume persistant.
- SMTP reel pour confirmations, alertes et mot de passe oublie.
- Application Expo connectee a l'API HTTPS.

## Deploiement Docker local de production

1. Copier `.env.production.example` vers `.env` a la racine.
2. Copier `cotadise-backend/.env.example` vers `cotadise-backend/.env`.
3. Generer les secrets :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-production-secrets.ps1
```

4. Remplacer tous les domaines `example.com` et mots de passe de demonstration.
5. Verifier :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-production-config.ps1
```

6. Construire et lancer :

```powershell
docker compose -f docker-compose.production.yml --env-file .env up -d --build
```

7. Verifier :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-health.ps1
```

Le frontend est expose localement sur `http://localhost:8080` et le backend sur `http://localhost:3000`.

## HTTPS et domaines

En ligne, placer un reverse proxy ou utiliser le HTTPS gere de l'hebergeur. Configurer :

```env
PUBLIC_BACKEND_URL=https://api.votre-domaine
CORS_ORIGINS=https://admin.votre-domaine
```

Les pages legales seront disponibles sur :

- `https://admin.votre-domaine/privacy.html`
- `https://admin.votre-domaine/terms.html`

## SMTP

Renseigner dans le backend :

```env
EMAIL_DISPATCH_ENABLED=true
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM=CotaDISE <noreply@votre-domaine>
```

Redemarrer le backend, puis utiliser `Alertes > Exploitation email > Tester SMTP`.

## Mobile Expo

Configurer les variables de build EAS :

```text
EXPO_PUBLIC_API_BASE=https://api.votre-domaine/api
EXPO_PUBLIC_PRIVACY_URL=https://admin.votre-domaine/privacy.html
EXPO_PUBLIC_TERMS_URL=https://admin.votre-domaine/terms.html
```

Puis construire :

```powershell
npm run build:preview:android
npm run build:preview:ios
```

Les builds stores restent bloques jusqu'a la creation des comptes Google Play et Apple Developer, mais la configuration du depot est prete.

## Avant ouverture pilote

1. Sauvegarde PostgreSQL testee.
2. Health check branche a un monitoring externe.
3. SMTP teste depuis l'admin.
4. Smoke test contre l'URL HTTPS.
5. Activation d'un ISE1 avec code prive testee.
6. Passation de bureau testee sur un environnement de recette.
7. Application testee sur Android et iPhone physiques.
