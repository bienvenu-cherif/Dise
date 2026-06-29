# Livraison MVP hors integration Wave reelle

## Validation en une commande

Depuis la racine :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-mvp.ps1
```

Avec le backend deja demarre :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate-mvp.ps1 -WithSmokeTest
```

Cette commande execute :

- tests Jest backend;
- build NestJS;
- build frontend tresorier;
- typecheck Expo mobile;
- validation syntaxique des scripts PowerShell;
- smoke test API en option.

## Termine dans le code

- Gestion annuelle ISE1, ISE2, ISE3 et alumni.
- Import officiel ISE1 avec code d'activation prive.
- Activation, connexion, profil et mot de passe oublie.
- Montants par niveau et exceptions individuelles.
- Generation et suivi des cotisations.
- Paiements main a main et paiement pour camarade.
- Reparation admin des notifications de paiement confirme si une recette a ete faite avant affichage cote etudiant.
- Architecture Wave securisee, sans vraies cles marchand.
- Rappels automatiques et messages manuels.
- File email, statut SMTP, test SMTP et expedition manuelle.
- Defis, rang personnel et notifications.
- Alumni, promotions et dons.
- Passation du bureau avec revocation des anciens droits.
- Audit, exports, health check PostgreSQL.
- Sauvegarde et restauration PostgreSQL.
- Builds Android/iOS prepares avec Expo EAS.

## Dependances externes encore necessaires

Ces points ne sont pas des developpements manquants dans le depot :

- compte Wave marchand et vraies cles;
- identifiants SMTP reels;
- hebergement HTTPS et nom de domaine;
- compte Apple Developer;
- compte Google Play Console;
- telephone Android reel;
- iPhone reel ou TestFlight;
- URLs publiques pour politique de confidentialite et conditions.

## Ordre avant pilote

1. Configurer PostgreSQL de production.
2. Generer les secrets avec `generate-production-secrets.ps1`.
3. Lancer `check-production-config.ps1`.
4. Configurer SMTP et utiliser `Tester SMTP` dans l'admin.
5. Deployer le backend HTTPS.
6. Renseigner l'URL API de production dans Expo/EAS.
7. Lancer le smoke test contre l'API de test.
8. Tester Android et iOS physiques.
9. Ajouter Wave reel lorsque le compte marchand sera disponible.

## Recette rapide apres import

1. Importer les ISE1 officiels.
2. Inscrire les nouveaux ISE1 dans l'annee active.
3. Generer les cotisations annuelles.
4. Activer au moins un compte etudiant avec son code prive.
5. Saisir un paiement main a main.
6. Ouvrir l'espace etudiant et verifier `Mes messages`.
7. Si une confirmation manque pour un ancien paiement, utiliser `Paiements > Reparer confirmations`.
