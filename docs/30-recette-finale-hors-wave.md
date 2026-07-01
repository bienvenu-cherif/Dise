# Recette finale hors Wave reel

## Objectif

Valider que CotaDISE est utilisable en pilote sans compte Wave marchand. Les paiements
reels Wave restent desactives, mais le tresorier peut piloter la campagne, enregistrer
les paiements main a main et verifier tout le parcours etudiant.

## Avant de commencer

- L'API Render repond sur `https://cotadise-api.onrender.com/api/health`.
- L'admin repond sur `https://cotadise-admin.onrender.com`.
- Les pages legales repondent sur `/privacy.html` et `/terms.html`.
- Le mobile pointe vers `https://cotadise-api.onrender.com/api`.
- Le test ordinateur via Expo Web utilise `http://localhost:8081`, autorise par CORS pour la recette locale.
- Le compte tresorier de recette est disponible.
- Un fichier d'import ISE1 contient uniquement `nom` et `prenom`.

Commande de controle :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-public-recette.ps1
```

## Parcours tresorier a valider

1. Connexion admin/tresorier.
2. Import de la liste officielle ISE1.
3. Verification que les invites apparaissent dans `Etudiants`.
4. Verification qu'un etudiant invite peut encore apparaitre dans la creation mobile.
5. Creation/ouverture de l'annee academique.
6. Definition des montants ISE1, ISE2 et ISE3.
7. Creation d'une exception individuelle de montant.
8. Inscription des etudiants actifs dans l'annee.
9. Generation des cotisations.
10. Enregistrement d'un paiement main a main.
11. Verification que le paiement apparait dans l'historique.
12. Envoi d'une alerte manuelle a un etudiant.
13. Envoi d'un message a une promotion alumni.
14. Consultation des dons alumni.
15. Export ou verification des donnees de suivi.
16. Test de passation vers un futur tresorier en environnement de recette.

## Parcours etudiant a valider

1. Choix du niveau actuel, puis recherche de son nom dans la liste officielle.
2. Creation autonome du compte avec email, telephone, numero Wave et mot de passe.
3. Connexion.
4. Lecture de l'accueil: objectif, verse, reste, progression.
5. Verification du rang compact sur l'accueil.
6. Ouverture de l'onglet `Rang` pour voir la position, la personne devant et la personne derriere.
7. Ouverture des alertes, puis disparition du badge apres consultation.
8. Lancement d'un defi avec filtre niveau puis recherche nom/prenom.
9. Consultation du badge `Defis` dans le footer.
10. Paiement pour soi jusqu'a l'etape d'initiation, sans validation Wave reelle.
11. Paiement pour un camarade jusqu'a l'etape d'initiation.
12. Verification qu'un paiement main a main saisi par le tresorier met a jour l'application apres actualisation.
13. Modification du profil.
14. Deconnexion avec le bouton `Quitter`.

## Points acceptes sans Wave

- Le bouton de paiement peut preparer une demande, mais la cotisation ne doit pas etre soldee sans confirmation serveur.
- Le paiement main a main sert de reference pour les tests financiers.
- Les notifications de paiement confirme doivent apparaitre apres paiement main a main.
- Les defis et le rang doivent se reajuster apres chaque paiement confirme.

## Points bloquants avant pilote

- SMTP reel non teste.
- Sauvegarde quotidienne non activee chez l'hebergeur.
- Test sur Android physique non termine.
- Test iPhone/TestFlight non termine.
- Passation de bureau non repetee avec le futur tresorier.

## Critere de sortie

La recette hors Wave est acceptee si :

- les validations automatiques passent;
- le tresorier peut effectuer toute la preparation annuelle;
- au moins deux comptes etudiants sont actives;
- un paiement main a main se reflete cote etudiant;
- un defi, une alerte et le rang personnel fonctionnent;
- l'ancien tresorier perd ses droits apres une passation de recette.
