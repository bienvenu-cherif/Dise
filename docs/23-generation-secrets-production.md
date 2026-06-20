# Generation des secrets production

Les secrets de production doivent etre longs, aleatoires et differents entre eux.

## Commande

Depuis la racine du projet :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\generate-production-secrets.ps1
```

Le script genere :

- `JWT_SECRET`
- `APP_SECRET`
- `WAVE_CONFIG_ENCRYPTION_KEY`

## Utilisation

Copier les valeurs dans :

- `cotadise-backend\.env` pour un serveur local;
- les variables secretes de l'hebergeur pour la production.

## Regles

- Ne jamais committer un vrai `.env`.
- Ne jamais envoyer ces secrets dans WhatsApp, email ou capture publique.
- Regenerer les secrets si une fuite est suspectee.
- Garder `DEMO_SEED_ENABLED=false` en production.

Apres modification du `.env`, relancer :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-production-config.ps1
```
