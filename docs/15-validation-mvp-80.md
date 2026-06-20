# Validation MVP 80%

## Objectif

Atteindre un MVP utilisable en conditions de test reel par le bureau et un petit groupe d'etudiants.

## Etat attendu pour 80%

- Backend compile sans erreur.
- Interface tresorier compile sans erreur.
- Application mobile compile sans erreur TypeScript.
- Les migrations critiques sont referencees dans le backend.
- Les variables d'environnement de production sont documentees.
- Le backend expose un endpoint de sante: `GET /api/health` ou `GET /health` selon le prefix global.
- L'application mobile Android/iOS a une icone, un splash screen et une configuration EAS.
- Les parcours etudiants essentiels sont disponibles.
- Les parcours tresorier essentiels sont disponibles.
- Wave est pret cote architecture, meme si les vraies cles marchand restent a obtenir.

## Parcours etudiant a valider

Les tests detailles sont decrits dans `docs/16-cahier-tests-manuels-mvp.md`.

- Activer un compte depuis la liste officielle importee.
- Se connecter.
- Modifier email, telephone et numero Wave.
- Changer son mot de passe.
- Reinitialiser un mot de passe oublie par email.
- Voir progression, reste a payer et historique.
- Payer sa propre cotisation via Wave.
- Payer volontairement pour un camarade.
- Recevoir une confirmation de paiement.
- Recevoir un rappel automatique si aucune cotisation recente n'existe.
- Ne plus recevoir de rappel si la cotisation est terminee.
- Lancer un defi.
- Accepter ou refuser un defi.
- Voir la progression du defi.
- Voir son classement et le podium.

## Parcours tresorier a valider

- Importer les nouveaux ISE1.
- Fixer les montants par niveau.
- Definir une exception individuelle.
- Generer les cotisations de l'annee.
- Configurer un compte Wave marchand.
- Valider et activer la configuration Wave.
- Enregistrer un paiement main a main.
- Envoyer une alerte manuelle.
- Envoyer un message aux alumni par promotion.
- Consulter l'audit.
- Exporter cotisations, paiements et dons.

## Points bloquants avant production officielle

- Obtenir les vraies cles Wave marchand.
- Remplacer les URLs de demonstration dans `eas.json`.
- Mettre en ligne le backend en HTTPS.
- Configurer SMTP reel et tester l'envoi email.
- Tester le webhook Wave avec signature reelle.
- Creer compte Apple Developer.
- Creer compte Google Play Console.
- Tester sur Android reel.
- Tester sur iPhone reel via TestFlight.
- Publier la politique de confidentialite en URL publique.

## Estimation actuelle

Le projet est proche de 80% MVP si les builds restent verts et si les tests manuels des parcours ci-dessus passent.

Ce qui reste apres 80% concerne surtout la production, les stores, Wave reel, les tests automatises et le durcissement securite.
