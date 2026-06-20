# Donnees de demonstration CotaDISE

Ce mode permet de presenter CotaDISE avec des donnees realistes sans compte Wave marchand reel.

## Activation

Dans `cotadise-backend/.env`, ajouter ou modifier :

```env
DEMO_SEED_ENABLED=true
```

Puis redemarrer le backend. Le seed est idempotent : il ne recrée pas les donnees si le compte `ise1.alpha@cotadise.test` existe deja.

En production, garder obligatoirement :

```env
DEMO_SEED_ENABLED=false
```

## Comptes demo

| Profil | Email | Mot de passe | Usage |
| --- | --- | --- | --- |
| Tresorier | `tresorier@cotadise.test` | `Tresorier123!` | Tableau de bord admin, paiements main a main, suivi global |
| ISE1 active | `ise1.alpha@cotadise.test` | `Etudiant123!` | Mobile etudiant avec paiement partiel |
| ISE1 active | `ise1.beta@cotadise.test` | `Etudiant123!` | Mobile etudiant avec paiement recu par camarade |
| ISE1 invitee | `awa.fall.invite@cotadise.test` | `Invite123!` | Parcours d'activation depuis la liste officielle |
| ISE2 active | `ise2.alpha@cotadise.test` | `Etudiant123!` | Mobile etudiant avec cotisation partielle |
| ISE3 soldee | `ise3.alpha@cotadise.test` | `Etudiant123!` | Cas d'un etudiant ayant fini de cotiser |
| Alumni | `alumni.2026@cotadise.test` | `Alumni123!` | Don alumni et promotion sortante 2026, visible cote tresorier |

## Donnees creees

- Annee academique `2026-2027`, ouverte et active.
- Montants de cotisation :
  - ISE1 : 30 000 FCFA
  - ISE2 : 35 000 FCFA
  - ISE3 : 40 000 FCFA
- Inscriptions annuelles pour ISE1, ISE2, ISE3 et alumni.
- Cotisations avec plusieurs etats : zero paiement, paiement partiel, paiement complet.
- Paiement main a main saisi par le tresorier.
- Paiement volontaire d'un etudiant pour son camarade.
- Defi accepte entre deux ISE1.
- Don alumni rattache a la promotion sortante 2026.

Le compte alumni est conserve pour les donnees de promotion et de soutien. Il ne suit plus le parcours de cotisation obligatoire des etudiants actifs.

Pour activer l'invitation de demonstration `Awa Fall`, utiliser le code prive :

```text
DEMO2026ISE1
```

En production, chaque code est aleatoire, expire apres 120 jours et doit etre transmis uniquement a l'etudiant concerne.

## Ce que cette demo ne fait pas

- Elle ne contacte pas Wave.
- Elle ne confirme pas de paiement externe.
- Elle ne doit pas etre activee dans la base de production officielle.
