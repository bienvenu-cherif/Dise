# Ecrans mobile a prevoir

## Application etudiant

### Ecran de connexion

Objectif:

- Permettre a l'etudiant de se connecter rapidement.

Elements:

- Logo ou nom COTADISE.
- Identite visuelle DISE claire des la premiere ouverture.
- Pastilles ISE1, ISE2, ISE3 et Wave.
- Messages rassurants sur l'eligibilite officielle et la securite Wave.
- Champ email ou telephone.
- Champ mot de passe.
- Bouton connexion.
- Mot de passe oublie: demande de code email et reinitialisation.
- Lien d'activation pour les nouveaux ISE1 presents dans la liste officielle.
- Message d'erreur clair.

### Activation nouvel ISE1

Objectif:

- Permettre uniquement aux etudiants importes par le tresorier d'activer leur compte.

Elements:

- Recherche par nom ou matricule si disponible.
- Liste des correspondances possibles.
- Verification que l'etudiant n'est pas deja active.
- Formulaire de completion: email valide, telephone, numero Wave si different, mot de passe.
- Message indiquant que les etudiants non importes ne sont pas eligibles.

### Tableau de bord

Objectif:

- Donner une vue immediate de la situation de cotisation.

Elements:

- Classe de l'etudiant.
- Montant total a cotiser.
- Montant deja cotise.
- Reste a payer.
- Pourcentage de progression.
- Bouton payer.
- Rang dans la classe.
- Alertes importantes.
- Statut clair: en cours ou cotisation terminee.
- Indicateurs rapides: rang, alertes non lues, defis en attente.
- Message confirmant qu'un etudiant ayant fini de cotiser ne recevra plus de rappels automatiques.

### Courbe d'evolution

Objectif:

- Montrer la progression dans le temps.

Elements:

- Graphique des paiements cumules.
- Courbe simple basee sur les paiements confirmes.
- Affichage des derniers points de progression cumulee.
- Liste des paiements.
- Filtre par periode.
- Resume annuel: total, deja verse, reste, progression.
- Detail du reste a payer par cotisation.
- Historique lisible des paiements avec reference, statut et date.
- Etat vide si aucune cotisation ou aucun paiement n'existe encore.

### Paiement Wave

Objectif:

- Lancer et suivre un paiement mobile.

Elements:

- Montant propose.
- Possibilite de modifier le montant si autorise.
- Choix du beneficiaire: moi ou un camarade.
- Recherche d'un camarade actif par nom, prenom ou email.
- Chargement des cotisations ouvertes du camarade selectionne.
- Numero Wave utilise pour le paiement.
- Bouton payer avec Wave.
- Etat du paiement: en attente, confirme, echoue.
- Message de securite indiquant que les cles Wave restent cote serveur.
- Rappel que la confirmation definitive vient du webhook Wave backend.

### Classement

Objectif:

- Afficher la position personnelle de l'etudiant sans exposer toute la liste du niveau.

Elements:

- Rang personnel.
- Carte de position personnelle.
- Nombre total d'etudiants dans le niveau.
- Nom et rang de la personne directement devant lui, si elle existe.
- Nom et rang de la personne directement derriere lui, si elle existe.
- Message clair si l'etudiant est premier ou dernier.

### Defis

Objectif:

- Permettre aux etudiants de se stimuler entre eux.

Elements:

- Liste des defis reçus.
- Liste des defis envoyes.
- Liste des defis en cours.
- Bouton lancer un defi.
- Recherche d'un camarade actif a defier.
- Message court joint a la demande de defi.
- Progression des deux participants dans chaque defi.
- Affichage du gagnant lorsque le defi est termine.
- Annulation possible par le createur tant que le defi est actif.
- Resultats des defis termines.

### Notifications

Objectif:

- Centraliser les messages importants.

Elements:

- Alertes de retard.
- Confirmations de paiement.
- Defis.
- Messages du tresorier.
- Badges visuels par type: rappel, paiement, defi, alumni, tresorier.
- Etat lu/non lu avec action pour marquer le message comme lu.
- Date courte d'envoi.

### Profil

Objectif:

- Afficher les informations personnelles.

Elements:

- Nom.
- Email.
- Telephone.
- Numero Wave.
- Modification de l'email, du telephone et du numero Wave.
- Modification du mot de passe avec verification de l'ancien mot de passe.
- Nouveau mot de passe different de l'ancien, avec au moins une lettre et un chiffre.
- Niveau.
- Statut.
- Informations DISE et ENSEA.
- Rappel que les paiements Wave sont confirmes cote serveur.
- Deconnexion.

## Application mobile Android et iOS

L'etudiant utilise une application mobile dediee, construite separement de l'interface web du tresorier.

Socle prevu:

- connexion et stockage securise de session;
- activation d'un compte issu de la liste officielle importee;
- tableau de bord personnel;
- progression et reste a payer;
- paiement Wave;
- historique des paiements;
- rang personnel dans le niveau;
- notifications et alertes;
- defis de cotisation.

Le backend reste la source de verite: aucune confirmation de paiement n'est acceptee depuis le telephone sans webhook Wave cote serveur.

## Interface tresorier

L'interface tresorier peut rester web au debut.

Ecrans prioritaires:

- Tableau de bord financier.
- Gestion des annees academiques.
- Import des ISE1.
- Suivi des comptes invites, actives et non actives.
- Gestion des passages et exceptions.
- Gestion des montants par niveau.
- Gestion des exceptions individuelles.
- Liste des cotisations.
- Liste des paiements.
- Exports Excel.
- Dons alumni.
- Promotions alumni.
- Messages personnalises par promotion sortante.
