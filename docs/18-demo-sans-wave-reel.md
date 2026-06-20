# Demonstration sans Wave reel

## Objectif

Permettre de presenter et tester CotaDISE sans disposer immediatement d'un compte Wave marchand reel.

Le compte Wave reel reste necessaire avant une production officielle, mais il ne bloque pas la demonstration du produit, des parcours et des regles metier.

## Ce qui peut etre teste sans Wave reel

- Import officiel des nouveaux ISE1.
- Activation mobile des comptes etudiants.
- Connexion mobile.
- Consultation des cotisations.
- Paiement main a main par le tresorier.
- Paiement pour un camarade en mode initie/en attente.
- Mise a jour de la progression apres paiement manuel.
- Alertes de paiement confirme.
- Rappels automatiques.
- Defis entre etudiants.
- Classement et podium.
- Passage annuel ISE1 vers ISE2, ISE2 vers ISE3, ISE3 vers alumni.
- Dons alumni.
- Messages manuels du tresorier.
- Audit des actions sensibles.

## Ce qui ne doit pas etre presente comme final

- Confirmation Wave reelle.
- Signature webhook Wave reelle.
- Encaissement marchand reel.
- Versement effectif sur un compte Wave marchand.

## Parcours de demonstration recommande

### 1. Preparation tresorier

- Creer ou ouvrir une annee academique.
- Importer deux ISE1.
- Definir les montants ISE1, ISE2 et ISE3.
- Ajouter une exception individuelle pour un etudiant.
- Generer les cotisations.

### 2. Activation etudiant

- Ouvrir l'application mobile.
- Rechercher un etudiant importe.
- Activer son compte.
- Se connecter.

### 3. Suivi cotisation

- Montrer l'accueil mobile.
- Montrer l'onglet `Cotiser`.
- Montrer le reste a payer, l'historique et la courbe.

### 4. Paiement sans Wave reel

Option recommandee:

- Le tresorier enregistre un paiement main a main.
- L'etudiant actualise l'application.
- La progression, le reste a payer, l'historique et le classement se mettent a jour.

Option alternative:

- L'etudiant initie un paiement Wave.
- L'application affiche que la demande est en attente ou que Wave n'est pas encore configure.
- Expliquer que la confirmation reelle viendra du webhook Wave quand le compte marchand sera disponible.

### 5. Paiement pour camarade

- ISE1 Alpha cherche ISE1 Beta.
- Il selectionne la cotisation ouverte de Beta.
- Il initie le paiement.
- Le tresorier peut simuler la confirmation par paiement manuel si necessaire.

### 6. Defis

- ISE1 Alpha lance un defi a ISE1 Beta.
- ISE1 Beta accepte.
- Le tresorier ajoute des paiements manuels.
- La progression du defi et le gagnant s'affichent.

### 7. Alertes

- Montrer les alertes par type.
- Marquer une alerte comme lue.
- Expliquer le rappel automatique toutes les 3 semaines si l'etudiant eligible ne cotise pas.

### 8. Alumni

- Montrer une promotion alumni.
- Envoyer un message manuel de demande d'aide.
- Enregistrer un don alumni.

## Message a donner pendant la demo

CotaDISE est pret cote architecture Wave: l'application mobile ne stocke aucune cle Wave, les confirmations passent par le backend et le tresorier peut changer de compte marchand d'un bureau a l'autre.

Pour la demonstration du jour, les paiements sont valides par paiement main a main ou restent en attente. L'integration Wave reelle sera activee des que le compte marchand sera disponible.

## Critere de succes demo

La demonstration est reussie si:

- un etudiant importe peut activer son compte;
- sa cotisation est visible;
- un paiement manuel met a jour sa progression;
- son classement evolue;
- une alerte est creee;
- un defi peut etre lance et suivi;
- le tresorier garde la main sur les montants, paiements, messages et exports.
