# Politique de confidentialite CotaDISE

## Objectif

CotaDISE collecte uniquement les informations necessaires pour gerer les cotisations des etudiants ISE eligibles, suivre les paiements, envoyer les alertes utiles et permettre au tresorier de piloter l'annee academique.

## Donnees collectees

Pour les etudiants actifs:

- nom et prenoms;
- niveau ISE1, ISE2 ou ISE3;
- promotion et annee academique;
- adresse email;
- numero de telephone associe au paiement Wave;
- statut du compte;
- montants de cotisation attendus, payes et restants;
- historique des paiements;
- notifications et defis.

Pour les alumni:

- nom et prenoms;
- promotion sortante;
- contacts conserves pour les messages de soutien, dons et aides a la division.

## Origine des donnees

Les nouveaux etudiants ne creent pas librement leur compte. Le tresorier importe la liste officielle des ISE1 au debut de l'annee academique. L'etudiant retrouve ensuite son nom dans cette liste et complete ses informations de contact.

Les etudiants externes non importes ne sont pas eligibles a l'application.

## Utilisation des donnees

Les donnees sont utilisees pour:

- verifier l'eligibilite d'un etudiant;
- calculer la progression de cotisation;
- initier un paiement Wave;
- confirmer un paiement apres retour securise du backend;
- envoyer des recus, felicitations et rappels;
- afficher le classement et les defis;
- permettre au tresorier de gerer les exceptions scolaires;
- contacter les alumni par promotion sortante pour les demandes d'aide.

## Paiements Wave

Aucune cle secrete Wave n'est stockee dans l'application mobile. Les informations sensibles du compte marchand sont conservees uniquement cote backend.

L'application mobile initie une demande de paiement. La confirmation definitive est faite par le backend apres verification du webhook Wave.

## Conservation

Les donnees des cotisations sont conservees pour assurer la tracabilite financiere de chaque annee academique.

Les etudiants ISE3 devenus alumni ne sont plus eligibles aux cotisations obligatoires, mais leurs informations de promotion peuvent etre conservees pour les messages de soutien et l'historique de la division.

## Acces et controle

Chaque etudiant peut consulter ses propres informations depuis l'application.

Le tresorier et les administrateurs autorises peuvent consulter et corriger les donnees necessaires a la gestion des cotisations, des paiements, des passages de niveau, des exceptions et des alumni.

## Securite

CotaDISE applique les principes suivants:

- authentification obligatoire pour les comptes actifs;
- stockage securise du token sur mobile;
- API de production en HTTPS;
- journal d'audit pour les actions sensibles;
- separation entre application mobile et secrets backend;
- confirmation serveur des paiements.

## Contact

Pour toute demande liee aux donnees personnelles, l'etudiant doit contacter le bureau de la division ISE ou le tresorier en exercice.
