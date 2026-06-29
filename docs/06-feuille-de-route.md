# Feuille de route

## Phase 1: Stabiliser le modele backend

Objectif:

- Adapter le backend actuel aux vraies regles metier.

Taches:

- Ajouter la notion d'annee academique.
- Formaliser les niveaux ISE1, ISE2, ISE3 et alumni.
- Ajouter l'inscription annuelle.
- Ajouter les statuts scolaires: actif, redoublant, abandon, exclu, alumni.
- Ajouter le statut d'activation des comptes: invite, profil a completer, actif.
- Bloquer l'auto-inscription libre des etudiants externes.
- Ajouter le parcours d'activation des nouveaux ISE1 depuis la liste importee.
- Ajouter le numero Wave et la validation du telephone de paiement.
- Ajouter la promotion sortante des alumni.
- Ajouter les montants par niveau et les exceptions individuelles.
- Revoir la generation des cotisations.
- Revoir les roles admin et tresorier.

## Phase 2: Paiement mobile

Objectif:

- Permettre a l'etudiant de cotiser via Wave.

Taches:

- Creer le flux d'initiation du paiement Wave.
- Permettre a un etudiant de payer pour un camarade.
- Permettre au tresorier d'enregistrer un paiement main a main.
- Ajouter le webhook de confirmation.
- Gerer les statuts de paiement.
- Proteger contre les doubles confirmations.
- Mettre a jour automatiquement la cotisation apres confirmation.

## Phase 3: Application mobile etudiant

Objectif:

- Creer l'application mobile orientee etudiant.

Taches:

- Choisir la technologie mobile, probablement Expo React Native.
- Creer une base Expo React Native compatible Android et iOS.
- Creer l'authentification.
- Creer le parcours d'activation mobile depuis la liste officielle importee.
- Creer le tableau de bord.
- Creer l'ecran paiement.
- Creer l'historique.
- Creer la courbe d'evolution.
- Creer le classement.
- Creer les notifications application.
- Envoyer les confirmations de paiement.
- Declencher les rappels automatiques apres 3 semaines sans cotisation.
- Preparer l'envoi email des alertes importantes.
- Ajouter un controle tresorier pour relancer manuellement les rappels de l'annee active.
- Brancher un fournisseur email sur la file d'envoi.
- Configurer le stockage securise du token sur smartphone.

## Phase 4: Defis et dynamique sociale

Objectif:

- Ajouter la competition positive entre etudiants.

Taches:

- Creer les defis.
- Gerer acceptation, refus et annulation.
- Detecter automatiquement le gagnant.
- Envoyer des notifications.
- Afficher les defis dans l'application mobile.
- Bloquer les defis pour les alumni et les comptes non eligibles.

## Phase 5: Alumni et dons

Objectif:

- Garder les anciens dans l'ecosysteme.

Taches:

- Marquer automatiquement les ISE3 comme alumni.
- Regrouper les alumni par promotion sortante.
- Permettre au tresorier d'envoyer un message personnalise a une promotion.
- Les exclure des cotisations obligatoires.
- Ajouter les dons.
- Ajouter les exports des dons.
- Exporter les dons par promotion sortante.
- Permettre au tresorier d'enregistrer un don main a main.
- Ajouter un tableau de bord alumni.

## Phase 6: Qualite et exploitation

Objectif:

- Rendre l'application fiable pour une vraie utilisation.

Taches:

- Ajouter des tests e2e pour les nouveaux modules.
- Ajouter des logs utiles.
- Ajouter une documentation d'installation.
- Preparer les environnements dev, test et production.
- Securiser les secrets.
- Preparer les sauvegardes de base de donnees.
- Configurer EAS Build pour generer les versions Android et iOS.
- Confirmer le domaine API definitif dans les profils EAS avant publication store.
- Ajouter les icones, l'ecran de demarrage et les assets officiels de publication.
- Preparer la publication Android: APK de test, AAB Play Store et fiche Google Play.
- Preparer la publication iOS: compte Apple Developer, TestFlight, certificats et fiche App Store.
- Rediger la politique de confidentialite et les conditions d'utilisation.
- Tester l'application sur Android reel, iPhone reel et simulateurs avant de publier.
