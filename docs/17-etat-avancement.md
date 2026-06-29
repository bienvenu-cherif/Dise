# Etat d'avancement CotaDISE

## Estimation actuelle

Avancement MVP hors integration Wave reelle estime: 95%.

Cette estimation suppose que les builds restent verts et que les tests manuels critiques du cahier MVP passent sur un environnement local ou de test.

## Terminé ou quasi termine

- Modele metier principal: niveaux ISE1, ISE2, ISE3, alumni.
- Import officiel des nouveaux ISE1.
- Activation mobile limitee aux comptes importes.
- Cotisations annuelles et montants par niveau.
- Exceptions individuelles de montant.
- Paiement Wave initie depuis mobile.
- Paiement pour camarade.
- Paiement main a main par tresorier.
- Confirmation serveur des paiements.
- Alertes automatiques et manuelles.
- Defis entre etudiants.
- Rang personnel et position relative dans le niveau.
- Alumni par promotion.
- Dons alumni.
- Configuration Wave marchand par annee.
- Audit des actions sensibles.
- Application mobile Android/iOS avec Expo.
- Icone, splash screen et documentation store.
- Profil etudiant, modification contacts et mot de passe.
- Mot de passe oublie par email.
- Documentation production et cahier de tests MVP.
- Packaging Docker backend, frontend et PostgreSQL.
- Pages legales HTML publiables.
- Health check PostgreSQL, sauvegarde et restauration.
- Controle SMTP et file email depuis l'administration.
- Activation ISE1 protegee par code individuel.

## Reste avant pilote reel

- Executer le cahier de tests manuels sur telephones physiques.
- Brancher une vraie configuration SMTP.
- Brancher les vraies cles Wave marchand ou sandbox officielle.
- Tester le webhook Wave avec signature reelle.
- Stabiliser le domaine definitif si Render n'est pas conserve.
- Tester sur Android reel.
- Tester sur iPhone reel via TestFlight.

## Reste avant production officielle

- Elargir progressivement la couverture automatisee au-dela des regles sensibles deja testees.
- Politique de confidentialite publiee en ligne.
- Comptes Apple Developer et Google Play Console.
- Captures store et fiches de publication.
- Automatiser la sauvegarde quotidienne sur l'hebergeur choisi.
- Brancher `/api/health` a un service de monitoring externe.

## Note demo sans Wave reel

L'absence de compte Wave marchand ne bloque pas la poursuite du developpement ni une demonstration MVP.

Voir `docs/18-demo-sans-wave-reel.md` pour le parcours conseille.
