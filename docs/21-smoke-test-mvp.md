# Smoke test MVP

Ce test verifie rapidement que les parcours essentiels CotaDISE repondent cote API.

## Prerequis

- Le backend doit etre demarre sur `http://localhost:3000/api`.
- Les donnees demo doivent exister.
- Les comptes demo doivent etre disponibles :
  - `tresorier@cotadise.test`
  - `ise1.alpha@cotadise.test`

## Commande

Depuis la racine du projet :

```powershell
.\scripts\smoke-test.ps1
```

Si Windows bloque l'execution des scripts PowerShell :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke-test.ps1
```

Avec une autre URL API :

```powershell
.\scripts\smoke-test.ps1 -ApiBase "http://localhost:3000/api"
```

## Ce qui est verifie

- Connexion tresorier.
- Chargement des annees academiques.
- Previsualisation des cotisations annuelles.
- Listes admin : utilisateurs, paiements, defis.
- Connexion etudiant avec niveau et telephone Wave.
- Dashboard etudiant.
- Cotisations, paiements et alertes etudiant.
- Recherche de camarade.
- Cotisations ouvertes d'un beneficiaire.
- Defis de l'etudiant.

Le script retourne un code d'erreur si une etape echoue.
