# Cycle annuel et activation des comptes

## Regle centrale

COTADISE n'est pas une application ouverte au public. Un etudiant externe ne peut pas installer l'application et creer librement un compte.

Pour etre eligible, l'etudiant doit appartenir a la liste officielle geree par la division ISE:

- ISE1 importe par le tresorier en debut d'annee.
- ISE2 ou ISE3 issu du passage automatique.
- Alumni issu de la sortie de ISE3, uniquement pour les dons et soutiens.

## Calendrier de l'annee

### Octobre

- Le nouveau bureau de la division prend les reignes.
- Le tresorier prepare la nouvelle annee academique.
- Les comptes de l'annee precedente sont clotures.
- Les passages automatiques sont prepares:
  - ISE1 vers ISE2.
  - ISE2 vers ISE3.
  - ISE3 vers alumni.
- Le tresorier gere les exceptions:
  - redoublement;
  - abandon;
  - exclusion;
  - cas administratif particulier.
- Le tresorier importe la liste officielle des nouveaux ISE1.

### Novembre

- Le tresorier fixe les nouveaux montants par niveau.
- Le tresorier ajoute les exceptions individuelles.
- Le tresorier valide les directives de cotisation.
- La periode de cotisation demarre.
- Les etudiants peuvent commencer a payer via Wave.

Avant l'ouverture effective des paiements, le tresorier consulte le controle de preparation annuelle:

- annee ouverte et active;
- etudiants eligibles inscrits;
- montants definis pour les niveaux concernes;
- cotisations annuelles generees;
- compte Wave marchand valide et actif pour l'annee.

Si un point est incomplet, la campagne n'est pas consideree prete pour les paiements Wave.

### Fin aout

- L'annee academique prend fin.
- Les derniers etats financiers sont consolides.
- Les donnees restent consultables comme historique.

## Securite de la premiere activation

L'import officiel reste limite aux colonnes `nom` et `prenom`. Le systeme genere ensuite un code d'activation individuel de 12 caracteres pour chaque invitation.

- Le tresorier remet le code en prive a l'etudiant concerne.
- Le code est stocke uniquement sous forme de hash.
- Le code expire apres 120 jours.
- Un code utilise est supprime lors de l'activation.
- Le tresorier peut regenerer un code tant que le compte reste invite.

Connaitre le nom d'un etudiant ne suffit donc plus pour prendre possession de son compte.
- Le cycle suivant pourra etre prepare en octobre.

## Activation des nouveaux ISE1

1. Le tresorier importe le fichier officiel des ISE1.
2. Le systeme cree des comptes en statut `invite`.
3. Le nouvel ISE1 installe l'application mobile.
4. Il recherche son nom dans la liste.
5. Il selectionne son profil.
6. Il complete ses informations:
   - email valide;
   - telephone;
   - numero Wave si different;
   - mot de passe.
7. Le systeme active son compte.
8. L'etudiant peut suivre sa cotisation des que les montants de l'annee sont ouverts.

## Cas non eligible

Un utilisateur ne doit pas pouvoir activer un compte si:

- son nom n'existe pas dans la liste importee;
- son profil a deja ete active;
- il est marque abandon;
- il est marque exclu;
- il est externe a la division;
- il est alumni et tente d'acceder aux cotisations obligatoires.

## Implication technique

Le systeme doit distinguer:

- un compte importe mais pas encore active;
- un compte active;
- un etudiant eligible a la cotisation;
- un alumni conserve pour les dons;
- un alumni rattache a une promotion sortante;
- un utilisateur externe non autorise.

Ce point doit etre traite avant l'ouverture de l'application mobile au public.
