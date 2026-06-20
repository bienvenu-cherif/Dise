# Modele metier

## Entites principales

### Utilisateur

Represente toute personne connue du systeme.

Champs importants:

- Identifiant.
- Prenom.
- Nom.
- Email.
- Telephone.
- Numero Wave ou telephone confirme compatible avec Wave.
- Mot de passe chiffre.
- Role: etudiant, tresorier, admin, alumni.
- Statut: actif, inactif.
- Niveau actuel: ISE1, ISE2, ISE3 ou alumni.
- Source d'entree: import officiel, passage automatique, creation manuelle autorisee.
- Statut d'activation: invite, profil a completer, actif.
- Email valide confirme ou a confirmer.
- Promotion sortante pour les alumni.

### Niveau

Represente une classe ou categorie.

Niveaux attendus:

- ISE1.
- ISE2.
- ISE3.
- Alumni.

Champs importants:

- Nom.
- Description.
- Montant annuel par defaut.
- Eligibilite a la cotisation obligatoire.

### Annee academique

Represente une periode de cotisation.

Champs importants:

- Libelle, par exemple 2026-2027.
- Date de debut, normalement en octobre.
- Date de fin, normalement a la fin du mois d'aout.
- Statut: brouillon, ouverte, fermee.
- Date de generation des cotisations.
- Date d'ouverture de la periode de cotisation, normalement en novembre.
- Bureau ou tresorier responsable de l'annee.
- Configuration Wave marchand rattachee a l'annee ou au bureau actif.
- Statut de validation du compte marchand Wave.

Regles importantes:

- Chaque annee academique peut utiliser un compte Wave marchand different.
- Les paiements d'une cotisation doivent toujours etre inities avec le compte marchand de l'annee academique de cette cotisation.
- Quand un bureau change de compte marchand, l'historique des paiements des annees precedentes reste rattache aux anciens comptes.
- Un nouveau compte marchand doit etre valide avant l'ouverture effective des cotisations Wave.

### Inscription annuelle

Represente la situation d'un etudiant pour une annee donnee.

Champs importants:

- Etudiant.
- Annee academique.
- Niveau.
- Statut scolaire: actif, redoublant, abandon, exclu, alumni.
- Eligible a la cotisation.
- Commentaire du tresorier.

### Cotisation annuelle

Represente l'obligation de cotiser pour un etudiant pendant une annee.

Champs importants:

- Etudiant.
- Annee academique.
- Niveau.
- Montant total a cotiser.
- Montant deja paye.
- Reste a payer.
- Statut: en attente, partielle, payee, en retard, annulee.
- Date limite.
- Source du montant: niveau ou exception individuelle.

### Paiement

Represente une transaction effectuee par l'etudiant ou enregistree par le tresorier.

Champs importants:

- Cotisation.
- Etudiant beneficiaire, c'est-a-dire celui dont la cotisation est ajustee.
- Payeur reel: l'etudiant lui-meme, un camarade ou le tresorier dans le cas d'un paiement main a main.
- Montant.
- Montant applique a la cotisation.
- Methode: Wave, espece, virement, autre.
- Origine: paiement personnel, paiement pour camarade, paiement main a main, ajustement tresorier.
- Reference transaction.
- Statut: initie, en attente, confirme, echoue, annule.
- Date du paiement.
- Date d'application effective sur la cotisation.
- Tresorier ayant enregistre le paiement si paiement main a main.
- Configuration Wave marchand utilisee si paiement Wave.

### Notification

Represente un message envoye ou affiche a l'etudiant.

Types possibles:

- Rappel automatique de cotisation apres 3 semaines sans alimentation du compte.
- Accuse de reception et felicitation apres paiement confirme.
- Message manuel du tresorier a un etudiant precis.
- Message manuel du tresorier a une promotion alumni.
- Demande d'aide adressee a une promotion sortante.
- Defi reçu.
- Defi accepte.
- Defi gagne ou perdu.
- Paiement effectue par un camarade pour le beneficiaire.

Champs importants:

- Destinataire.
- Titre.
- Message.
- Type.
- Canal: application, email, ou application et email.
- Promotion cible si message alumni.
- Statut de lecture.
- Date d'envoi.

Regles importantes:

- Les rappels automatiques sont envoyes dans l'application et par email si aucune cotisation recente n'est observee sur une periode de 3 semaines.
- Un etudiant qui a entierement solde sa cotisation ne doit plus recevoir de rappel de cotisation.
- Une notification de paiement confirme doit etre creee des que Wave confirme un paiement ou que le tresorier valide un paiement main a main.
- Quand un etudiant paie pour un camarade, le beneficiaire reçoit une alerte indiquant qu'un paiement a ete fait pour lui.
- Les alertes de defi informent le destinataire qu'un etudiant lui lance un defi.
- Les messages manuels alumni sont cibles par promotion sortante.
- Les notifications dont le canal contient email creent un message dans une file d'envoi email avant l'integration du fournisseur mail final.

### Message email

Represente un email prepare par le systeme a partir d'une notification.

Champs importants:

- Notification source.
- Destinataire.
- Email destinataire.
- Objet.
- Corps du message.
- Statut: en attente, envoye, echec.
- Nombre de tentatives.
- Derniere erreur.

### Defi

Represente une competition amicale entre deux etudiants.

Champs importants:

- Createur.
- Adversaire.
- Annee academique.
- Niveau du createur.
- Niveau de l'adversaire.
- Montant cible ou objectif: finir sa cotisation.
- Statut: en attente, accepte, refuse, annule, termine.
- Date limite.
- Gagnant.

Regles importantes:

- Un etudiant ne peut pas se lancer un defi a lui-meme.
- Les deux participants doivent etre actifs et eligibles aux cotisations.
- Les alumni ne participent pas aux defis de cotisation obligatoire.
- Les deux participants doivent avoir une cotisation sur la meme annee academique.
- Un seul defi actif peut exister entre deux etudiants pour une annee donnee.
- Le defi est termine des qu'un des deux participants atteint 100% de sa cotisation.
- Le gagnant et l'autre participant reçoivent une notification de resultat.

### Don alumni

Represente un soutien financier non obligatoire.

Champs importants:

- Alumni.
- Montant.
- Methode de paiement.
- Statut: initie, en attente, confirme, echoue, annule.
- Origine: don Wave, don main a main, ajustement tresorier.
- Reference.
- Telephone payeur.
- Message optionnel.
- Tresorier ayant enregistre le don si don main a main.
- Date.

Regles importantes:

- Un don alumni est un soutien volontaire, jamais une cotisation obligatoire.
- Seuls les alumni peuvent etre rattaches a un don alumni.
- Le tresorier peut enregistrer un don main a main.
- Les dons doivent pouvoir etre filtres par promotion sortante et exportes.

### Promotion alumni

Represente une promotion sortante d'anciens ISE3.

Champs importants:

- Libelle de promotion.
- Annee de sortie.
- Liste des alumni.
- Messages ou demandes d'aide envoyes a cette promotion.
- Historique des dons issus de cette promotion.

## Regles importantes

- Les etudiants externes ne sont pas eligibles a l'application.
- Un nouvel ISE1 doit exister dans la liste officielle importee par le tresorier avant de pouvoir activer son compte.
- Un etudiant ne peut pas creer librement un compte depuis l'application mobile.
- Le premier acces d'un nouvel ISE1 consiste a retrouver son nom dans la liste importee puis completer son profil.
- L'email valide devient obligatoire pour les alertes, rappels et confirmations.
- Le telephone de paiement doit pouvoir correspondre a un compte Wave utilisable.
- L'annee academique commence en octobre et se termine a la fin du mois d'aout.
- Le nouveau bureau prend les reignes en octobre.
- Le tresorier attend generalement novembre pour assigner les montants et directives de cotisation.
- Les cotisations de la nouvelle annee ne doivent pas demarrer avant la cloture de l'annee precedente.
- Un etudiant ISE1, ISE2 ou ISE3 est eligible aux cotisations obligatoires.
- Un alumni n'est pas eligible aux cotisations obligatoires.
- Le tresorier peut definir un montant par niveau.
- Le tresorier peut definir un montant different pour un etudiant particulier.
- La progression d'un etudiant est calculee par rapport au montant total qui lui est affecte.
- Le classement d'une classe compare les etudiants du meme niveau pour la meme annee academique.
- Les defis peuvent etre limites aux etudiants actifs.
- Un paiement Wave ne doit etre considere valide qu'apres confirmation.
- Un etudiant peut payer pour un camarade, mais le paiement doit clairement distinguer le payeur et le beneficiaire.
- Un paiement main a main est enregistre par le tresorier et ajuste immediatement la cotisation du beneficiaire.
- Un paiement ne peut pas viser une cotisation appartenant a un autre beneficiaire.
- Un paiement ne peut pas etre cree sur une cotisation deja soldee.
- Le montant initie ne doit pas depasser le reste a payer, sauf ajustement explicite du tresorier.
- Le systeme garde le montant confirme et le montant reellement applique pour tracer les cas limites.
- Un webhook repete ne doit jamais appliquer deux fois le meme paiement.
- Les ISE3 qui passent alumni doivent etre rattaches a une promotion sortante pour permettre les messages cibles.
- Les passages automatiques ne doivent pas ecraser les exceptions saisies par le tresorier.
