# Fiche de publication CotaDISE

## Identite

- Nom public : `CotaDISE`
- Identifiant Android : `com.dise.cotadise`
- Identifiant iOS : `com.dise.cotadise`
- Categorie proposee : Finance
- Public : etudiants ISE officiellement importes et alumni autorises
- Age propose : 4+, sous reserve des questionnaires des stores

## Description courte

Suivez vos cotisations DISE, vos paiements, votre progression et les defis de votre promotion.

## Description complete

CotaDISE est l'application officielle de suivi des cotisations de la Division des
Ingenieurs Statisticiens Economistes. Les etudiants eligibles activent leur compte a
partir de la liste importee par le tresorier, consultent leur objectif annuel, suivent
leurs versements et recoivent les confirmations et communications du bureau.

L'application permet aussi de payer pour un camarade, participer a des defis de
cotisation, consulter le classement de son niveau et retrouver l'historique de ses
operations. Les alumni restent rattaches a leur promotion pour soutenir la division.

## Elements a fournir aux stores

- Icone 1024 x 1024 sans transparence pour Apple.
- Captures Android et iPhone prises sur les builds de production.
- URL de confidentialite : `https://DOMAINE/privacy.html`.
- URL des conditions : `https://DOMAINE/terms.html`.
- URL d'assistance et email institutionnel.
- Compte de demonstration conforme aux regles de revue, sans vraies donnees etudiantes.
- Instructions de revue expliquant l'activation sur liste fermee.

## Declarations de donnees a verifier

CotaDISE traite notamment identite, email, telephone, niveau, promotion, historique de
cotisations, paiements, notifications et defis. Les formulaires Apple et Google doivent
etre remplis d'apres le comportement de la version effectivement soumise. Ne pas declarer
la vente de donnees. Documenter le chiffrement HTTPS, l'authentification et la procedure
de demande de correction ou suppression.

## Notes pour l'equipe de revue

L'inscription publique est volontairement desactivee. Un nouveau compte est active a
partir d'un etudiant ISE1 importe par le tresorier et d'un code prive. Fournir aux
equipes Apple et Google un compte de revue deja active ou une procedure d'activation de
demonstration. Les paiements Wave reels ne doivent etre annonces dans la fiche que
lorsque l'integration marchande a ete validee en production.

## Publication progressive

1. Build interne Android et iOS.
2. Recette sur telephones physiques.
3. Test ferme Google Play et TestFlight.
4. Correction des retours et validation par le futur tresorier.
5. Soumission publique avec deploiement progressif.
