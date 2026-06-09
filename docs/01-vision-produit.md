# Vision produit COTADISE Mobile

## Objectif

COTADISE Mobile est une application de gestion des cotisations des etudiants de la division ISE. Elle permet a chaque etudiant de cotiser via un paiement mobile, de suivre sa progression, de recevoir des alertes et de participer a une dynamique de classement et de defis entre camarades.

L'application doit aussi donner au tresorier un outil simple pour preparer l'annee, importer les nouveaux etudiants, fixer les montants de cotisation, suivre les paiements et gerer les cas particuliers.

## Public cible

- Etudiants ISE1, ISE2 et ISE3.
- Tresorier ou administrateur de la division.
- Alumni, pour les dons, aides et soutiens non obligatoires.

## Principes du produit

- L'etudiant doit comprendre en quelques secondes ou il en est dans sa cotisation.
- Le paiement doit etre simple, mobile et traçable.
- Le tresorier doit pouvoir travailler par annee academique, par classe et par cas particulier.
- L'application est reservee aux etudiants officiellement importes par le tresorier.
- Les etudiants externes ou non presents dans la liste officielle ne sont pas eligibles a l'application.
- Les cotisations obligatoires concernent les etudiants actifs, pas les alumni.
- Les alumni restent dans la plateforme pour soutenir la division par dons ou aides.
- Les classements et defis doivent encourager la participation sans bloquer la gestion financiere.
- L'annee academique commence en octobre et se termine a la fin du mois d'aout.
- Le processus de cotisation est reinitialise chaque annee apres la cloture de l'annee precedente.

## Parcours general

1. En debut d'annee, le tresorier cree ou ouvre l'annee academique.
2. Le systeme applique les passages automatiques:
   - ISE1 vers ISE2.
   - ISE2 vers ISE3.
   - ISE3 vers alumni.
3. Le tresorier gere les exceptions: redoublement, abandon, exclusion, changement manuel de niveau.
4. Le tresorier importe la nouvelle liste officielle des ISE1.
5. Les nouveaux ISE1 installent l'application et retrouvent leur nom dans la liste importee.
6. Chaque nouvel ISE1 active son compte en completant ses identifiants, notamment un email valide.
7. Apres la cloture de l'annee precedente, le tresorier fixe les nouveaux montants et directives.
8. La periode de cotisation demarre en novembre.
9. Le systeme genere les cotisations de l'annee.
10. Les etudiants se connectent, paient via Wave et suivent leur progression.
11. Le systeme envoie des alertes et met a jour les classements.
12. Les etudiants peuvent lancer ou accepter des defis.

## Fonctionnalites principales

### Etudiant

- Connexion securisee.
- Activation du compte uniquement si l'etudiant est present dans la liste officielle importee.
- Recherche de son nom dans la liste des nouveaux ISE1 au premier acces.
- Completion du profil avec un email valide pour recevoir les alertes.
- Consultation du montant total a cotiser.
- Consultation du montant deja cotise.
- Consultation du reste a payer.
- Courbe d'evolution des paiements.
- Historique des paiements.
- Paiement via Wave.
- Verification que le numero de telephone utilise pour payer correspond a un compte Wave utilisable.
- Possibilite de payer volontairement pour un camarade.
- Alertes de retard, echeance proche, paiement confirme, defi reçu.
- Classement dans la classe.
- Classement global optionnel.
- Creation et suivi des defis.

### Tresorier

- Import Excel/CSV des nouveaux ISE1.
- Gestion des niveaux ISE1, ISE2, ISE3 et alumni.
- Passage automatique de fin d'annee.
- Gestion des exceptions.
- Fixation des montants par classe.
- Fixation de montants speciaux par etudiant.
- Generation des cotisations annuelles.
- Suivi des paiements.
- Enregistrement des paiements main a main.
- Ajustement manuel d'une cotisation apres reception d'un paiement physique.
- Exports Excel.
- Tableau de bord financier.
- Gestion des dons des alumni.
- Messages personnalises aux alumni par promotion sortante.

### Alumni

- Profil conserve dans le systeme.
- Regroupement par promotion sortante.
- Non eligible aux cotisations obligatoires.
- Possibilite de faire des dons.
- Possibilite de participer comme soutien de la division.
- Reception de demandes d'aide adressees a leur promotion.
