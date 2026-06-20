# Cahier de tests manuels MVP

## Objectif

Valider les parcours essentiels de CotaDISE avant une demonstration ou un test pilote avec de vrais etudiants.

Chaque test doit etre coche seulement si le resultat attendu est observe.

## Donnees de test conseillees

### Comptes

- Tresorier: `tresorier@cotadise.test`
- Admin: `admin@cotadise.test`
- Etudiant ISE1: `ise1.alpha@cotadise.test`
- Etudiant ISE1 camarade: `ise1.beta@cotadise.test`
- Etudiant ISE2: `ise2.alpha@cotadise.test`
- Etudiant ISE3: `ise3.alpha@cotadise.test`
- Alumni: `alumni.2026@cotadise.test`

### Montants

- ISE1: 30000 XOF
- ISE2: 35000 XOF
- ISE3: 40000 XOF
- Exception individuelle ISE1 Alpha: 25000 XOF

### Annee academique

- Libelle: `2026-2027`
- Debut: 2026-10-01
- Fin: 2027-08-31
- Demarrage cotisation: novembre 2026

## Tests tresorier

### T01 - Importer les nouveaux ISE1

Etapes:

- Se connecter comme tresorier.
- Importer un fichier Excel contenant ISE1 Alpha et ISE1 Beta.
- Verifier que les comptes sont crees avec le statut `invite`.

Resultat attendu:

- Les etudiants importes apparaissent dans la liste.
- Aucun etudiant externe ne peut activer un compte s'il n'est pas importe.

### T02 - Configurer les montants

Etapes:

- Creer ou ouvrir l'annee academique `2026-2027`.
- Definir les montants ISE1, ISE2 et ISE3.
- Ajouter une exception individuelle pour ISE1 Alpha.

Resultat attendu:

- Les montants sont visibles par niveau.
- L'exception individuelle remplace le montant du niveau pour l'etudiant cible.

### T03 - Generer les cotisations annuelles

Etapes:

- Lancer la generation des cotisations de l'annee.
- Consulter la liste des cotisations.

Resultat attendu:

- Les etudiants eligibles ont une cotisation.
- Les alumni ne recoivent pas de cotisation obligatoire.

### T04 - Configurer Wave marchand

Etapes:

- Creer une configuration Wave pour l'annee.
- Valider la configuration.
- Activer la configuration.

Resultat attendu:

- Une seule configuration Wave est active pour l'annee.
- Les cles sensibles ne sont jamais affichees en clair apres enregistrement.

### T05 - Enregistrer un paiement main a main

Etapes:

- Chercher ISE1 Alpha.
- Enregistrer un paiement main a main de 5000 XOF.
- Consulter sa cotisation.

Resultat attendu:

- Le montant paye augmente.
- Le reste a payer diminue.
- L'application mobile de l'etudiant affiche la mise a jour apres actualisation.

### T06 - Envoyer une alerte manuelle

Etapes:

- Envoyer une alerte directe a ISE1 Alpha.
- Envoyer un message a une promotion alumni.

Resultat attendu:

- L'etudiant voit l'alerte dans l'application.
- Les alumni de la promotion ciblee recoivent le message.

## Tests etudiant mobile

### E01 - Activer un compte invite

Etapes:

- Ouvrir l'application mobile.
- Chercher `ISE1 Alpha`.
- Completer email, telephone, numero Wave et mot de passe.
- Activer le compte.

Resultat attendu:

- Le compte devient actif.
- L'etudiant peut se connecter.

### E02 - Bloquer un externe

Etapes:

- Rechercher un nom absent de la liste importee.

Resultat attendu:

- Aucun compte invite n'est propose.
- L'application indique que le compte est introuvable.

### E03 - Consulter le tableau de bord

Etapes:

- Se connecter comme ISE1 Alpha.
- Consulter l'accueil.

Resultat attendu:

- Le total attendu, le montant verse, le reste et la progression sont corrects.
- Le statut affiche `En cours` ou `Terminee` selon la cotisation.

### E04 - Payer sa cotisation via Wave

Etapes:

- Choisir `Moi` dans le bloc Wave.
- Selectionner la cotisation ouverte.
- Saisir un montant.
- Initier le paiement.

Resultat attendu:

- Une demande de paiement est creee.
- La cotisation n'est mise a jour qu'apres confirmation webhook.

### E05 - Payer pour un camarade

Etapes:

- Choisir `Camarade`.
- Rechercher ISE1 Beta.
- Selectionner sa cotisation.
- Initier un paiement.

Resultat attendu:

- Le paiement est rattache au beneficiaire ISE1 Beta.
- Le payeur reste ISE1 Alpha.
- ISE1 Beta recoit une alerte apres confirmation.

### E06 - Historique et courbe

Etapes:

- Confirmer plusieurs paiements.
- Ouvrir l'onglet `Cotiser`.

Resultat attendu:

- L'historique affiche les paiements.
- La courbe montre les paiements cumules.
- Le reste a payer est coherent.

### E07 - Classement

Etapes:

- Ouvrir l'onglet `Rang`.

Resultat attendu:

- La position personnelle est visible.
- Le podium top 3 est visible.
- La ligne de l'etudiant connecte est mise en valeur.

### E08 - Defi

Etapes:

- ISE1 Alpha lance un defi a ISE1 Beta.
- ISE1 Beta accepte.
- Confirmer des paiements jusqu'a ce qu'un etudiant atteigne 100%.

Resultat attendu:

- Les deux voient le defi.
- La progression de chaque participant s'affiche.
- Le gagnant est affiche a la fin.

### E09 - Alertes

Etapes:

- Generer un rappel.
- Confirmer un paiement.
- Recevoir un defi.
- Marquer une alerte comme lue.

Resultat attendu:

- Chaque alerte a un badge de type.
- Les alertes non lues sont distinguees.
- Une alerte marquee comme lue n'est plus mise en avant.

### E10 - Profil

Etapes:

- Modifier email, telephone et numero Wave.
- Changer le mot de passe.
- Se reconnecter avec le nouveau mot de passe.

Resultat attendu:

- Les contacts sont sauvegardes.
- Le nouveau numero Wave est utilise dans le formulaire de paiement.
- L'ancien mot de passe ne permet plus la connexion.

### E11 - Mot de passe oublie

Etapes:

- Depuis l'ecran de connexion, demander un code.
- Recuperer le code dans la file email ou via SMTP.
- Saisir le code et un nouveau mot de passe.
- Se connecter avec le nouveau mot de passe.

Resultat attendu:

- Le code expire apres 20 minutes.
- Le mot de passe est reinitialise.
- Le code ne peut pas etre reutilise.

## Tests cycle annuel

### A01 - Passage automatique

Etapes:

- Fermer l'annee academique.
- Executer le passage automatique.

Resultat attendu:

- ISE1 devient ISE2.
- ISE2 devient ISE3.
- ISE3 devient alumni.
- Les alumni ne sont plus eligibles aux cotisations obligatoires.

### A02 - Exceptions de passage

Etapes:

- Declarer un redoublement.
- Declarer un abandon.
- Declarer une exclusion.

Resultat attendu:

- Le passage automatique respecte les exceptions.
- Les statuts sont visibles pour le tresorier.

## Tests production technique

### P01 - Endpoint sante

Etapes:

- Appeler `GET /health`.

Resultat attendu:

- Reponse `status: ok`.
- Timestamp present.

### P02 - Variables d'environnement

Etapes:

- Creer un `.env` a partir de `.env.example`.
- Lancer le backend.

Resultat attendu:

- Le backend demarre.
- La base PostgreSQL est joignable.
- Les secrets Wave ne sont pas exposes.

### P03 - Builds

Etapes:

- Lancer le build backend.
- Lancer le build frontend.
- Lancer le typecheck mobile.

Resultat attendu:

- Les trois commandes passent sans erreur.
